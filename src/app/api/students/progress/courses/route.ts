/**
 * Student Progress Courses API
 * Provides detailed course progress information for student dashboard
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

        // Get all enrolled courses with progress details
        const enrollments = await prisma.enrollment.findMany({
            where: { userId },
            include: {
                course: {
                    include: {
                        creator: {
                            include: {
                                user: {
                                    select: {
                                        name: true,
                                        arabicName: true,
                                        profileImage: true,
                                    },
                                },
                            },
                        },
                        lessons: {
                            include: {
                                progress: {
                                    where: { userId },
                                },
                            },
                            orderBy: { order: 'asc' },
                        },
                    },
                },
            },
            orderBy: {
                lastAccessedAt: 'desc',
            },
        });

        // Get recent video progress for last watched calculation
        const recentVideoProgress = await prisma.videoProgress.findMany({
            where: { userId },
            orderBy: { lastWatched: 'desc' },
        });

        const courses = enrollments.map(enrollment => {
            const course = enrollment.course;
            const lessons = course.lessons;
            const completedLessons = lessons.filter(lesson =>
                lesson.progress.some(p => p.completed)
            ).length;

            const totalLessons = lessons.length;
            const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

            // Calculate estimated time left (simplified)
            const averageLessonDuration = 900; // 15 minutes default
            const remainingLessons = totalLessons - completedLessons;
            const estimatedTimeLeft = remainingLessons * averageLessonDuration;

            // Get last watched time
            const lastWatched = enrollment.lastAccessedAt || enrollment.createdAt;

            return {
                id: course.id,
                title: course.title,
                titleAr: course.titleAr,
                thumbnail: course.thumbnail || '/images/default-course.jpg',
                progress: Math.round(progress),
                completedLessons,
                totalLessons,
                lastWatched: lastWatched,
                estimatedTimeLeft,
                instructor: {
                    name: course.creator.user.arabicName || course.creator.user.name,
                    avatar: course.creator.user.profileImage,
                },
            };
        });

        return NextResponse.json(courses);

    } catch (error) {
        console.error('Failed to get progress courses:', error);
        return NextResponse.json(
            { error: 'فشل في تحميل تقدم الكورسات' },
            { status: 500 }
        );
    }
}
