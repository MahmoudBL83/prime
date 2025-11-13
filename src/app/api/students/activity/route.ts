/**
 * Student Activity API
 * Provides learning activity data for analytics and progress tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'غير مصرح لك بالوصول' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || 'week';

        // For demo purposes, return mock activity data
        // TODO: Implement real activity tracking from database
        const mockActivity = [
            {
                date: 'الأحد',
                watchTime: 3600, // 1 hour in seconds
                lessonsCompleted: 2,
                coursesAccessed: 1,
            },
            {
                date: 'الاثنين',
                watchTime: 2700, // 45 minutes
                lessonsCompleted: 1,
                coursesAccessed: 1,
            },
            {
                date: 'الثلاثاء',
                watchTime: 1800, // 30 minutes
                lessonsCompleted: 1,
                coursesAccessed: 2,
            },
            {
                date: 'الأربعاء',
                watchTime: 4200, // 70 minutes
                lessonsCompleted: 3,
                coursesAccessed: 2,
            },
            {
                date: 'الخميس',
                watchTime: 2400, // 40 minutes
                lessonsCompleted: 1,
                coursesAccessed: 1,
            },
            {
                date: 'الجمعة',
                watchTime: 1200, // 20 minutes
                lessonsCompleted: 1,
                coursesAccessed: 1,
            },
            {
                date: 'السبت',
                watchTime: 3000, // 50 minutes
                lessonsCompleted: 2,
                coursesAccessed: 1,
            },
        ];

        return NextResponse.json(mockActivity);

    } catch (error) {
        console.error('Failed to get activity data:', error);
        return NextResponse.json(
            { error: 'فشل في تحميل بيانات النشاط' },
            { status: 500 }
        );
    }
}
