/**
 * Student Progress Stats API
 * Provides comprehensive learning statistics and metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'غير مصرح لك بالوصول' },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        // Get course enrollment stats
        const enrollments = await prisma.enrollment.findMany({
            where: { userId },
            include: {
                course: {
                    include: {
                        lessons: {
                            include: {
                                progress: {
                                    where: { userId },
                                },
                            },
                        },
                    },
                },
            },
        });

        // Calculate course completion stats
        let totalCourses = enrollments.length;
        let completedCourses = 0;
        let totalLessons = 0;
        let completedLessons = 0;

        enrollments.forEach(enrollment => {
            const lessons = enrollment.course.lessons;
            const completedLessonsInCourse = lessons.filter(lesson =>
                lesson.progress.some(p => p.completed)
            ).length;

            totalLessons += lessons.length;
            completedLessons += completedLessonsInCourse;

            // Course is considered complete if 90% of lessons are done
            if (lessons.length > 0 && (completedLessonsInCourse / lessons.length) >= 0.9) {
                completedCourses++;
            }
        });

        // Get total watch time from video progress
        const videoProgress = await prisma.videoProgress.findMany({
            where: { userId },
        });

        const totalWatchTime = videoProgress.reduce((total: number, progress: any) =>
            total + progress.currentTime, 0
        );

        // Calculate average progress
        const averageProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

        // Get learning streak (simplified - days with any activity)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentActivity = await prisma.videoProgress.findMany({
            where: {
                userId,
                lastWatched: {
                    gte: sevenDaysAgo,
                },
            },
            orderBy: {
                lastWatched: 'desc',
            },
        });

        // Calculate current streak (simplified)
        const currentStreak = Math.min(7, recentActivity.length);
        const longestStreak = currentStreak; // TODO: Implement proper streak calculation

        // Count certificates (completed courses)
        const certificatesEarned = completedCourses;

        const stats = {
            totalCourses,
            completedCourses,
            totalLessons,
            completedLessons,
            totalWatchTime: Math.round(totalWatchTime),
            averageProgress: Math.round(averageProgress),
            currentStreak,
            longestStreak,
            certificatesEarned,
        };

        return NextResponse.json(stats);

    } catch (error) {
        console.error('Failed to get progress stats:', error);
        return NextResponse.json(
            { error: 'فشل في تحميل إحصائيات التقدم' },
            { status: 500 }
        );
    }
}
