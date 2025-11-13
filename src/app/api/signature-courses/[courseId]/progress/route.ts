import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = params;
    const body = await request.json();
    const { episodeId, progress, completed } = body;

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get enrollment
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: user.id,
        courseId: courseId,
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled' }, { status: 403 });
    }

    // Update or create progress
    const existingProgress = await prisma.lessonProgress.findFirst({
      where: {
        enrollmentId: enrollment.id,
        lessonId: episodeId,
      },
    });

    if (existingProgress) {
      await prisma.lessonProgress.update({
        where: { id: existingProgress.id },
        data: {
          progress,
          completed,
          lastWatchedAt: new Date(),
        },
      });
    } else {
      await prisma.lessonProgress.create({
        data: {
          enrollmentId: enrollment.id,
          lessonId: episodeId,
          progress,
          completed,
          lastWatchedAt: new Date(),
        },
      });
    }

    // Update enrollment progress
    const totalLessons = await prisma.lesson.count({
      where: { courseId },
    });

    const completedLessons = await prisma.lessonProgress.count({
      where: {
        enrollmentId: enrollment.id,
        completed: true,
      },
    });

    const overallProgress = Math.round((completedLessons / totalLessons) * 100);

    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        progress: overallProgress,
        lastAccessedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      progress: overallProgress,
    });
  } catch (error) {
    console.error('Error saving progress:', error);
    return NextResponse.json(
      { error: 'Failed to save progress' },
      { status: 500 }
    );
  }
}
