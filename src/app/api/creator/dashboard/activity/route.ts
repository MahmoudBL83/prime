import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'CREATOR') {
      return NextResponse.json(
        { error: 'Access denied. Creator account required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Fetch recent activities across creator's courses
    const activities: any[] = [];

    // 1. Recent enrollments
    const recentEnrollments = await prisma.enrollment.findMany({
      where: {
        course: {
          creatorId: session.user.id,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            profileImage: true,
          },
        },
        course: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.floor(limit / 4),
    });

    recentEnrollments.forEach(enrollment => {
      activities.push({
        id: `enrollment-${enrollment.id}`,
        type: 'enrollment',
        message: `${enrollment.user.name} enrolled in "${enrollment.course.title}"`,
        timestamp: enrollment.createdAt.toISOString(),
        courseTitle: enrollment.course.title,
        user: {
          name: enrollment.user.name,
          avatar: enrollment.user.profileImage,
        },
      });
    });

    // 2. Recent reviews
    const recentReviews = await prisma.review.findMany({
      where: {
        course: {
          creatorId: session.user.id,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            profileImage: true,
          },
        },
        course: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.floor(limit / 4),
    });

    recentReviews.forEach(review => {
      activities.push({
        id: `review-${review.id}`,
        type: 'review',
        message: `${review.user.name} left a ${review.rating}-star review on "${review.course.title}"`,
        timestamp: review.createdAt.toISOString(),
        courseTitle: review.course.title,
        user: {
          name: review.user.name,
          avatar: review.user.profileImage,
        },
      });
    });

    // 3. Recent lesson completions
    const recentCompletions = await prisma.lessonProgress.findMany({
      where: {
        completed: true,
        lesson: {
          course: {
            creatorId: session.user.id,
          },
        },
      },
      include: {
        user: {
          select: {
            name: true,
            profileImage: true,
          },
        },
        lesson: {
          include: {
            course: {
              select: {
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: Math.floor(limit / 4),
    });

    recentCompletions.forEach(completion => {
      activities.push({
        id: `completion-${completion.id}`,
        type: 'completion',
        message: `${completion.user.name} completed a lesson in "${completion.lesson.course.title}"`,
        timestamp: completion.updatedAt.toISOString(),
        courseTitle: completion.lesson.course.title,
        user: {
          name: completion.user.name,
          avatar: completion.user.profileImage,
        },
      });
    });

    // 4. Recent live session joins
    const recentLiveJoins = await prisma.sessionAttendee.findMany({
      where: {
        session: {
          channel: {
            creatorId: session.user.id,
          },
        },
      },
      include: {
        user: {
          select: {
            name: true,
            profileImage: true,
          },
        },
        session: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
      take: Math.floor(limit / 4),
    });

    recentLiveJoins.forEach(join => {
      activities.push({
        id: `live-join-${join.id}`,
        type: 'live_join',
        message: `${join.user.name} joined "${join.session.title}" live session`,
        timestamp: join.joinedAt.toISOString(),
        courseTitle: join.session.title,
        user: {
          name: join.user.name,
          avatar: join.user.profileImage,
        },
      });
    });

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Limit total activities
    const limitedActivities = activities.slice(0, limit);

    return NextResponse.json({ activities: limitedActivities });

  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent activity' },
      { status: 500 }
    );
  }
}
