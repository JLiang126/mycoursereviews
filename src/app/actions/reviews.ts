'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { auth } from '@/auth';
import { db } from '@/db';
import { comments, courses, likes, reviews, users } from '@/db/schema';
import { CoursesApiClient } from '@/lib/courses-api';

// Zod Schema to validate Review submissions
const ReviewSchema = z.object({
    courseCode: z.string().min(1),
    title: z.string().min(3, 'Title must be at least 3 characters').max(100),
    description: z.string().min(10, 'Review description must be at least 10 characters').max(2000),
    overallRating: z.number().int().min(1).max(5),
    difficultyScore: z.number().int().min(1).max(5),
    usefulnessScore: z.number().int().min(1).max(5),
    enjoymentScore: z.number().int().min(1).max(5),
    termTaken: z.string().min(1, 'Term Taken is required'),
    grade: z.string().optional(),
    isAnonymous: z.boolean().default(false),
    agreeToTerms: z.literal(true, {
        message: 'You must agree to the Terms and Conditions',
    }),
});

export type ReviewInput = z.infer<typeof ReviewSchema>;

/**
 * Server action to submit a course review
 */
export async function submitReview(input: ReviewInput) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized: You must log in via Keycloak to review courses.');
    }

    // Validate request schema
    const validated = ReviewSchema.parse(input);

    // Ensure the user exists in our local DB (Keycloak session may outlive a DB reset/migration).
    // We upsert here so the review FK constraint is always satisfied.
    await db.insert(users).values({
        id: session.user.id,
        name: session.user.name || 'Adelaide Student',
        email: session.user.email || '',
        image: session.user.image || null,
        role: session.user.role || 'user',
    }).onConflictDoUpdate({
        target: users.id,
        set: {
            name: session.user.name || 'Adelaide Student',
            email: session.user.email || '',
            image: session.user.image || null,
            role: session.user.role || 'user',
        },
    });

    // Make sure the course exists in our local pg cache table (FK reference constraint)
    const localCourse = await db.query.courses.findFirst({
        where: eq(courses.code, validated.courseCode),
    });

    if (!localCourse) {
        // Fetch from Courses API to populate local cache before inserting review (FK constraint)
        const courseData = await CoursesApiClient.getCourseByCode(validated.courseCode);
        if (courseData) {
            await db.insert(courses).values({
                code: courseData.code,
                name: courseData.name,
                description: courseData.description,
                terms: JSON.stringify(courseData.terms),
                officialLink: courseData.officialLink,
            });
        } else {
            // Course outline not in API — insert a minimal placeholder to satisfy FK constraint.
            // This ensures students can still review courses even when API data is unavailable.
            console.warn(`Course outline not found via API for code: ${validated.courseCode}. Inserting placeholder.`);
            await db.insert(courses).values({
                code: validated.courseCode,
                name: validated.courseCode,
                description: '',
                terms: JSON.stringify([]),
                officialLink: '',
            });
        }
    }

    // Insert new review
    await db.insert(reviews).values({
        courseCode: validated.courseCode,
        userId: session.user.id,
        title: validated.title,
        description: validated.description,
        overallRating: validated.overallRating,
        difficultyScore: validated.difficultyScore,
        usefulnessScore: validated.usefulnessScore,
        enjoymentScore: validated.enjoymentScore,
        termTaken: validated.termTaken,
        grade: validated.grade || null,
        isAnonymous: validated.isAnonymous,
    });

    // Revalidate paths for real-time visual updates
    revalidatePath(`/courses/${encodeURIComponent(validated.courseCode)}`);
    revalidatePath('/courses');
    return { success: true };
}

/**
 * Server action to toggle review like
 */
export async function toggleLike(reviewId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized: Log in to like reviews.');
    }

    const userId = session.user.id;

    // Ensure user record exists in local DB (session may outlive a DB migration/reset)
    await db.insert(users).values({
        id: userId,
        name: session.user.name || 'Adelaide Student',
        email: session.user.email || '',
        image: session.user.image || null,
        role: session.user.role || 'user',
    }).onConflictDoUpdate({
        target: users.id,
        set: {
            name: session.user.name || 'Adelaide Student',
            email: session.user.email || '',
        },
    });

    // Check if like exists
    const existingLike = await db.query.likes.findFirst({
        where: and(eq(likes.userId, userId), eq(likes.reviewId, reviewId)),
    });

    let courseCode = '';
    const review = await db.query.reviews.findFirst({
        where: eq(reviews.id, reviewId),
    });
    if (review) {
        courseCode = review.courseCode;
    }

    if (existingLike) {
        // Unlike
        await db.delete(likes).where(and(eq(likes.userId, userId), eq(likes.reviewId, reviewId)));
    } else {
        // Like
        await db.insert(likes).values({
            userId,
            reviewId,
        });
    }

    if (courseCode) {
        revalidatePath(`/courses/${encodeURIComponent(courseCode)}`);
    }
    return { success: true, liked: !existingLike };
}

/**
 * Server Action to add threaded comments to a review
 */
export async function addComment(reviewId: string, content: string, parentId?: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized: Log in to comment.');
    }

    if (!content || content.trim().length === 0) {
        throw new Error('Comment content cannot be empty.');
    }

    // Ensure user record exists in local DB (session may outlive a DB migration/reset)
    await db.insert(users).values({
        id: session.user.id,
        name: session.user.name || 'Adelaide Student',
        email: session.user.email || '',
        image: session.user.image || null,
        role: session.user.role || 'user',
    }).onConflictDoUpdate({
        target: users.id,
        set: {
            name: session.user.name || 'Adelaide Student',
            email: session.user.email || '',
        },
    });

    // Insert comment
    await db.insert(comments).values({
        reviewId,
        userId: session.user.id,
        parentId: parentId || null,
        content: content.trim(),
    });

    const review = await db.query.reviews.findFirst({
        where: eq(reviews.id, reviewId),
    });

    if (review) {
        revalidatePath(`/courses/${encodeURIComponent(review.courseCode)}`);
    }
    return { success: true };
}

/**
 * Server Action to delete a review (committee admin-only moderation trigger)
 */
export async function deleteReview(reviewId: string) {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
        throw new Error('Forbidden: Only members of the CS Club committee can moderate reviews.');
    }

    // Find courseCode for path revalidation
    const review = await db.query.reviews.findFirst({
        where: eq(reviews.id, reviewId),
    });

    if (!review) {
        throw new Error('Review not found.');
    }

    // Cascades comments/likes automatically due to schema constraints
    await db.delete(reviews).where(eq(reviews.id, reviewId));

    revalidatePath(`/courses/${encodeURIComponent(review.courseCode)}`);
    revalidatePath('/courses');
    revalidatePath('/admin');

    return { success: true };
}
