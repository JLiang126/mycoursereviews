import { eq, sql } from 'drizzle-orm';
import { notFound } from 'next/navigation';

import { auth } from '@/auth';
import { db } from '@/db';
import { comments, likes, reviews, users } from '@/db/schema';
import { AdminDashboardClient } from '@/components/AdminDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
    const session = await auth();

    // 1. Secure Access Check - Return 404 for standard user sessions
    if (session?.user?.role !== 'admin') {
        notFound();
    }

    // 2. Fetch Aggregated Platform Stats
    let totalReviews = 0;
    let totalComments = 0;
    let totalLikes = 0;
    let totalCourses = 0;

    try {
        const reviewsCount = await db.select({ count: sql<number>`count(*)` }).from(reviews);
        totalReviews = Number(reviewsCount[0]?.count) || 0;

        const commentsCount = await db.select({ count: sql<number>`count(*)` }).from(comments);
        totalComments = Number(commentsCount[0]?.count) || 0;

        const likesCount = await db.select({ count: sql<number>`count(*)` }).from(likes);
        totalLikes = Number(likesCount[0]?.count) || 0;

        const uniqueCourses = await db
            .select({ count: sql<number>`count(distinct ${reviews.courseCode})` })
            .from(reviews);
        totalCourses = Number(uniqueCourses[0]?.count) || 0;
    } catch (error) {
        console.error('Error fetching admin platform metrics:', error);
    }

    // 3. Fetch all reviews list, joining with users table (moderator view always reveals actual identity)
    let allReviews: any[] = [];
    try {
        allReviews = await db
            .select({
                id: reviews.id,
                courseCode: reviews.courseCode,
                title: reviews.title,
                description: reviews.description,
                overallRating: reviews.overallRating,
                isAnonymous: reviews.isAnonymous,
                createdAt: reviews.createdAt,
                reviewerName: users.name,
            })
            .from(reviews)
            .leftJoin(users, eq(reviews.userId, users.id))
            .orderBy(sql`${reviews.createdAt} desc`);
    } catch (error) {
        console.error('Error fetching admin reviews feed:', error);
    }

    // Fetch all comments, joining with users and reviews tables
    let allComments: any[] = [];
    try {
        allComments = await db
            .select({
                id: comments.id,
                reviewId: comments.reviewId,
                content: comments.content,
                createdAt: comments.createdAt,
                authorName: users.name,
                courseCode: reviews.courseCode,
            })
            .from(comments)
            .leftJoin(users, eq(comments.userId, users.id))
            .leftJoin(reviews, eq(comments.reviewId, reviews.id))
            .orderBy(sql`${comments.createdAt} desc`);
    } catch (error) {
        console.error('Error fetching admin comments feed:', error);
    }

    const formattedReviews = allReviews.map((r) => ({
        ...r,
        reviewerName: r.reviewerName || 'Unknown Identity',
    }));

    const formattedComments = allComments.map((c) => ({
        ...c,
        authorName: c.authorName || 'Unknown Identity',
        courseCode: c.courseCode || 'Unknown Course',
    }));

    const stats = {
        totalReviews,
        totalComments,
        totalLikes,
        totalCourses,
    };

    return <AdminDashboardClient reviews={formattedReviews} comments={formattedComments} stats={stats} />;
}
