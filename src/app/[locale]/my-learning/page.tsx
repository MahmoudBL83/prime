/**
 * My Learning Page - All Enrolled Courses
 * Shows learner's enrolled courses with progress, continue watching, and filters
 */

import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import EnhancedMyLearning from '@/components/learning/EnhancedMyLearning';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'My Learning | Prime Egypt',
    description: 'Your enrolled courses and learning progress',
};

export default async function MyLearningPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect('/auth/login');
    }

    // Fetch user's enrolled courses with full details
    const enrollments = await prisma.enrollment.findMany({
        where: {
            userId: session.user.id,
        },
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
                        select: {
                            id: true,
                            title: true,
                            titleAr: true,
                            duration: true,
                            order: true,
                        },
                        orderBy: {
                            order: 'asc',
                        },
                    },
                    _count: {
                        select: {
                            reviews: true,
                            enrollments: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            lastAccessedAt: 'desc',
        },
    });

    // Get lesson progress for all enrolled courses
    const lessonProgress = await prisma.lessonProgress.findMany({
        where: {
            userId: session.user.id,
            lesson: {
                courseId: {
                    in: enrollments.map(e => e.courseId),
                },
            },
        },
        select: {
            lessonId: true,
            completed: true,
            updatedAt: true,
        },
    });

    // Format data for client component
    const coursesWithProgress = enrollments.map((enrollment: any) => {
        const { course } = enrollment;
        const completedLessons = enrollment.completedLessons 
            ? JSON.parse(enrollment.completedLessons) 
            : [];

        // Find last watched lesson
        const lessonsWithProgress = course.lessons.map((lesson: any) => {
            const progress = lessonProgress.find((p: any) => p.lessonId === lesson.id);
            return {
                ...lesson,
                completed: completedLessons.includes(lesson.id),
                progress: progress || undefined,
            };
        });

        const lastWatchedLesson = lessonsWithProgress
            .filter((l: any) => l.progress)
            .sort((a: any, b: any) => {
                const dateA = a.progress?.updatedAt || new Date(0);
                const dateB = b.progress?.updatedAt || new Date(0);
                return dateB.getTime() - dateA.getTime();
            })[0];

        const totalDuration = course.lessons.reduce((sum: number, lesson: any) => sum + (lesson.duration || 0), 0);
        const watchedDuration = lessonProgress
            .filter((p: any) => course.lessons.some((l: any) => l.id === p.lessonId))
            .reduce((sum: number, p: any) => sum + 0, 0); // No watchTime field available

        const courseData = {
            id: course.id,
            title: course.title,
            titleAr: course.titleAr,
            thumbnail: course.thumbnail,
            progress: enrollment.progress || 0,
            enrolledAt: enrollment.createdAt,
            lastAccessed: enrollment.lastAccessedAt || enrollment.createdAt,
            completedAt: enrollment.completedAt || undefined,
            totalLessons: course.lessons.length,
            completedLessons: completedLessons.length,
            totalDuration,
            watchedDuration,
            instructor: {
                name: course.creator.user.name || '',
                arabicName: course.creator.user.arabicName,
                image: course.creator.user.profileImage,
            },
            lastWatchedLesson: lastWatchedLesson ? {
                id: lastWatchedLesson.id,
                title: lastWatchedLesson.title,
                titleAr: lastWatchedLesson.titleAr,
                position: 0, // No lastPosition field available
            } : undefined,
            level: course.level,
            category: course.category,
            rating: course.rating,
            reviewsCount: course._count.reviews,
            studentsCount: course._count.enrollments,
        };

        return courseData;
    });

    // Fetch certificates
    const certificates = await prisma.certificate.findMany({
        where: { userId: session.user.id },
        include: {
            course: {
                select: {
                    title: true,
                    titleAr: true,
                },
            },
        },
    });

    // Fetch achievements
    const achievements = await prisma.achievement.findMany({
        where: { userId: session.user.id },
        select: {
            id: true,
            type: true,
            unlockedAt: true,
        },
    });

    // Calculate learning streak (simplified - should be more sophisticated)
    const recentProgress = await prisma.lessonProgress.findMany({
        where: {
            userId: session.user.id,
            updatedAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
        },
        select: {
            updatedAt: true,
        },
        orderBy: {
            updatedAt: 'desc',
        },
    });

    // Calculate streak
    let currentStreak = 0;
    if (recentProgress.length > 0) {
        const today = new Date().setHours(0, 0, 0, 0);
        const progressDates = new Set(
            recentProgress.map(p => new Date(p.updatedAt).setHours(0, 0, 0, 0))
        );
        
        let checkDate = today;
        while (progressDates.has(checkDate)) {
            currentStreak++;
            checkDate -= 24 * 60 * 60 * 1000;
        }
    }

    // Calculate weekly progress (minutes watched this week)
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weeklyProgress = recentProgress.filter(
        p => new Date(p.updatedAt) >= weekStart
    ).length * 10; // Rough estimate: 10 mins per lesson watched

    const stats = {
        totalCourses: coursesWithProgress.length,
        completedCourses: coursesWithProgress.filter(c => c.completedAt).length,
        inProgressCourses: coursesWithProgress.filter(c => !c.completedAt && c.progress > 0).length,
        totalWatchTime: coursesWithProgress.reduce((sum, c) => sum + c.watchedDuration, 0),
        currentStreak,
        certificates: certificates.length,
        achievements: achievements.length,
        weeklyGoal: 300, // 5 hours
        weeklyProgress,
    };

    return (
        <EnhancedMyLearning
            courses={coursesWithProgress}
            userName={session.user.name || 'Learner'}
            stats={stats}
            achievements={achievements}
            certificates={certificates}
        />
    );
}
