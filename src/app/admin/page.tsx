import { eq, sql } from 'drizzle-orm';
import Link from 'next/link';

import { auth } from '@/auth';
import { db } from '@/db';
import { comments, likes, reviews, users } from '@/db/schema';
import { AdminDashboardClient } from '@/components/AdminDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
    const session = await auth();

    // 1. Secure Access Check - Redirect or block standard user sessions
    if (session?.user?.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
                <div className="text-6xl animate-bounce">🚫</div>
                <h1 className="text-3xl font-extrabold tracking-tight text-red-500">Access Denied</h1>
                <p className="text-sm text-foreground/60 max-w-md">
                    Access to this moderation page is strictly restricted to authenticated members of the 
                    Adelaide University Computer Science Club committee.
                </p>
                <Link
                    href="/"
                    className="mt-4 px-4 py-2 bg-primary text-[#FAF9F5] font-bold rounded-xl shadow-lg hover:scale-105 transition-transform"
                >
                    Return Home
                </Link>
            </div>
        );
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
                reviewerEmail: users.email,
            })
            .from(reviews)
            .leftJoin(users, eq(reviews.userId, users.id))
            .orderBy(sql`${reviews.createdAt} desc`);
    } catch (error) {
        console.error('Error fetching admin reviews feed:', error);
    }

    const formattedReviews = allReviews.map((r) => ({
        ...r,
        reviewerName: r.reviewerName || 'Unknown Identity',
        reviewerEmail: r.reviewerEmail || 'unknown@csclub.org.au',
    }));

    const stats = {
        totalReviews,
        totalComments,
        totalLikes,
        totalCourses,
    };

    return <AdminDashboardClient reviews={formattedReviews} stats={stats} />;
}
