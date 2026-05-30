'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { auth } from '@/auth';
import { db } from '@/db';
import { comments, likes, reviews, users } from '@/db/schema';

// Zod Schema to validate Review submissions
const ReviewSchema = z.object({
    courseCode: z.string().min(1),
    title: z.string().min(3, 'Title must be at least 3 characters').max(100),
    description: z.string().min(10, 'Review description must be at least 10 characters').max(2000),
    overallRating: z.number().int().min(1).max(5),
    difficultyScore: z.number().min(0.5).max(5),
    usefulnessScore: z.number().min(0.5).max(5),
    enjoymentScore: z.number().min(0.5).max(5),
    termTaken: z.string().min(1, 'Term Taken is required'),
    grade: z.string().optional(),
    isAnonymous: z.boolean().default(false),
    agreeToTerms: z.literal(true, {
        message: 'You must agree to the Terms & Conditions',
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
        role: session.user.role || 'user',
    }).onConflictDoUpdate({
        target: users.id,
        set: {
            name: session.user.name || 'Adelaide Student',
            role: session.user.role || 'user',
        },
    });

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
        role: session.user.role || 'user',
    }).onConflictDoUpdate({
        target: users.id,
        set: {
            name: session.user.name || 'Adelaide Student',
            role: session.user.role || 'user',
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
        role: session.user.role || 'user',
    }).onConflictDoUpdate({
        target: users.id,
        set: {
            name: session.user.name || 'Adelaide Student',
            role: session.user.role || 'user',
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
 * Delete a review (accessible by review owner or admin)
 */
export async function deleteReview(reviewId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized: Log in to delete reviews.');
    }

    // Find courseCode for path revalidation
    const review = await db.query.reviews.findFirst({
        where: eq(reviews.id, reviewId),
    });

    if (!review) {
        throw new Error('Review not found.');
    }

    const isUserAdmin = session.user.role === 'admin';
    const isOwner = review.userId === session.user.id;

    if (!isUserAdmin && !isOwner) {
        throw new Error('Forbidden: You can only delete reviews you wrote.');
    }

    // Cascades comments/likes automatically due to schema constraints
    await db.delete(reviews).where(eq(reviews.id, reviewId));

    revalidatePath(`/courses/${encodeURIComponent(review.courseCode)}`);
    revalidatePath('/courses');
    revalidatePath('/admin');
    revalidatePath('/my-reviews');

    return { success: true };
}

/**
 * Delete a comment (accessible by review owner or admin)
 */
export async function deleteComment(commentId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized: Log in to delete comments.');
    }

    const comment = await db.query.comments.findFirst({
        where: eq(comments.id, commentId),
    });

    if (!comment) {
        throw new Error('Comment not found.');
    }

    const review = await db.query.reviews.findFirst({
        where: eq(reviews.id, comment.reviewId),
    });

    const isUserAdmin = session.user.role === 'admin';
    const isOwner = comment.userId === session.user.id;

    if (!isUserAdmin && !isOwner) {
        throw new Error('Forbidden: You can only delete comments you wrote.');
    }

    await db.delete(comments).where(eq(comments.id, commentId));

    if (review) {
        revalidatePath(`/courses/${encodeURIComponent(review.courseCode)}`);
    }
    revalidatePath('/my-reviews');

    return { success: true };
}

// Schema to validate Update Review submissions
const UpdateReviewSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(100),
    description: z.string().min(10, 'Review description must be at least 10 characters').max(2000),
    overallRating: z.number().int().min(1).max(5),
    difficultyScore: z.number().min(0.5).max(5),
    usefulnessScore: z.number().min(0.5).max(5),
    enjoymentScore: z.number().min(0.5).max(5),
    termTaken: z.string().min(1, 'Term Taken is required'),
    grade: z.string().optional(),
    isAnonymous: z.boolean().default(false),
});

/**
 * Update a review (accessible by review owner only)
 */
export async function updateReview(reviewId: string, input: z.infer<typeof UpdateReviewSchema>) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized: Log in to update reviews.');
    }

    const validated = UpdateReviewSchema.parse(input);

    const review = await db.query.reviews.findFirst({
        where: eq(reviews.id, reviewId),
    });

    if (!review) {
        throw new Error('Review not found.');
    }

    if (review.userId !== session.user.id) {
        throw new Error('Forbidden: You can only edit reviews you wrote.');
    }

    await db.update(reviews)
        .set({
            title: validated.title,
            description: validated.description,
            overallRating: validated.overallRating,
            difficultyScore: validated.difficultyScore,
            usefulnessScore: validated.usefulnessScore,
            enjoymentScore: validated.enjoymentScore,
            termTaken: validated.termTaken,
            grade: validated.grade || null,
            isAnonymous: validated.isAnonymous,
        })
        .where(eq(reviews.id, reviewId));

    revalidatePath(`/courses/${encodeURIComponent(review.courseCode)}`);
    revalidatePath('/courses');
    revalidatePath('/my-reviews');

    return { success: true };
}

/**
 * Update a comment (accessible by review owner only)
 */
export async function updateComment(commentId: string, content: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized: Log in to update comments.');
    }

    if (!content || content.trim().length === 0) {
        throw new Error('Comment content cannot be empty.');
    }

    const comment = await db.query.comments.findFirst({
        where: eq(comments.id, commentId),
    });

    if (!comment) {
        throw new Error('Comment not found.');
    }

    if (comment.userId !== session.user.id) {
        throw new Error('Forbidden: You can only edit comments you wrote.');
    }

    await db.update(comments)
        .set({
            content: content.trim(),
        })
        .where(eq(comments.id, commentId));

    const review = await db.query.reviews.findFirst({
        where: eq(reviews.id, comment.reviewId),
    });

    if (review) {
        revalidatePath(`/courses/${encodeURIComponent(review.courseCode)}`);
    }
    revalidatePath('/my-reviews');

    return { success: true };
}
