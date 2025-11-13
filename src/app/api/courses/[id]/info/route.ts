/**
 * Course Info API - Get course overview for course player
 * Provides course metadata, progress, and instructor info
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const courseParamsSchema = z.object({
  id: z.string(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      );
    }

    const { id: courseId } = await params;
    const validation = courseParamsSchema.safeParse({ id: courseId });

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

    // Get course data with instructor info
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        creator: {
          include: {
            user: {
              select: {
                id: true,
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
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'الكورس غير موجود' },
        { status: 404 }
      );
    }

    // Get user's lesson progress
    const lessonProgress = await prisma.lesson.findMany({
      where: {
        courseId: courseId,
      },
      include: {
        progress: {
          where: {
            userId: session.user.id,
          },
        },
      },
    });

    const completedLessons = lessonProgress.filter(lesson =>
      lesson.progress.some(p => p.completed)
    ).length;
    const totalLessons = course.lessons.length;
    const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    // Format course info for frontend
    const courseInfo = {
      id: course.id,
      title: course.title,
      titleAr: course.titleAr,
      instructor: {
        id: course.creator.user.id,
        name: course.creator.user.arabicName || course.creator.user.name,
        avatar: course.creator.user.profileImage,
      },
      progress: Math.round(progressPercentage),
      totalLessons: totalLessons,
      completedLessons: completedLessons,
    };

    return NextResponse.json(courseInfo);

  } catch (error) {
    console.error('Failed to get course info:', error);
    return NextResponse.json(
      { error: 'فشل في تحميل بيانات الكورس' },
      { status: 500 }
    );
  }
}
