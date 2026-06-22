import { NextResponse } from 'next/server';

import { CoursesApiClient, redis } from '@/lib/courses-api';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const lockKey = 'courses:prefetch_lock';
        const isLocked = await redis.get(lockKey);
        
        if (isLocked) {
            return NextResponse.json({ success: true, message: 'Prefetch is already in progress' });
        }

        // Set lock for 5 minutes to prevent parallel runs
        await redis.set(lockKey, 'true', 'EX', 300);

        console.log('API Prefetch: Starting background course prefetch...');
        await CoursesApiClient.prefetchAllCoursesInBackground();
        
        await redis.del(lockKey);

        const cached = await redis.get('courses:all');
        const count = cached ? (JSON.parse(cached) as any[]).length : 0;

        return NextResponse.json({ success: true, count });
    } catch (error: any) {
        console.error('API Prefetch Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
