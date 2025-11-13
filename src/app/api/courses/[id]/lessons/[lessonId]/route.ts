/**
 * Course Lesson API - Get lesson details for course player
 * Provides lesson data, video assets, and navigation info
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const lessonParamsSchema = z.object({
    id: z.string(),
    lessonId: z.string(),
});

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'غير مصرح لك بالوصول' },
                { status: 401 }
            );
        }

        const { id: courseId, lessonId } = await params;
        const validation = lessonParamsSchema.safeParse({ id: courseId, lessonId });

        if (!validation.success) {
            return NextResponse.json(
                { error: 'بيانات غير صحيحة', details: validation.error.issues },
                { status: 400 }
            );
        }

        // Verify user has access to this course
        const enrollment = await prisma.enrollment.findFirst({
            where: {
                userId: session.user.id,
                courseId: courseId,
            },
        });

        if (!enrollment) {
            return NextResponse.json(
                { error: 'غير مشترك في هذا الكورس' },
                { status: 403 }
            );
        }

        // Get lesson data
        let lesson;

        if (lessonId === 'first') {
            // Get first lesson
            lesson = await prisma.lesson.findFirst({
                where: { courseId },
                orderBy: { order: 'asc' },
            });
        } else {
            // Get specific lesson
            lesson = await prisma.lesson.findFirst({
                where: {
                    id: lessonId,
                    courseId: courseId,
                },
            });
        }

        if (!lesson) {
            return NextResponse.json(
                { error: 'الدرس غير موجود' },
                { status: 404 }
            );
        }

        // Get video asset for this lesson
        const videoAsset = await prisma.videoAsset.findFirst({
            where: {
                lessonId: lesson.id,
                status: 'READY',
            },
        });

        if (!videoAsset || !videoAsset.muxPlaybackId) {
            return NextResponse.json(
                { error: 'الفيديو غير متوفر للدرس' },
                { status: 404 }
            );
        }

        // Get all lessons for navigation
        const allLessons = await prisma.lesson.findMany({
            where: { courseId },
            select: {
                id: true,
                order: true,
            },
            orderBy: { order: 'asc' },
        });

        // Find next and previous lessons
        const currentIndex = allLessons.findIndex(l => l.id === lesson.id);
        const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
        const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;

        // Format lesson data for frontend
        const lessonData = {
            id: lesson.id,
            title: lesson.title,
            titleAr: lesson.titleAr,
            description: lesson.description,
            videoAssetId: videoAsset.id,
            muxPlaybackId: videoAsset.muxPlaybackId,
            duration: videoAsset.duration || 0,
            order: lesson.order,
            moduleTitle: 'الوحدة الأساسية', // TODO: Implement proper modules
            moduleTitleAr: 'الوحدة الأساسية',
            nextLessonId: nextLesson?.id || null,
            prevLessonId: prevLesson?.id || null,
            resources: lesson.resources ? JSON.parse(lesson.resources as string) : [], // Parse JSON resources
            transcript: lesson.transcript,
        };

        return NextResponse.json(lessonData);

    } catch (error) {
        console.error('Failed to get lesson data:', error);
        return NextResponse.json(
            { error: 'فشل في تحميل بيانات الدرس' },
            { status: 500 }
        );
    }
}
