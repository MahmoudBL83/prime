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

    // Get date ranges for comparison
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Fetch creator's courses
    const courses = await prisma.course.findMany({
      where: {
        creatorId: session.user.id,
      },
      include: {
        _count: {
          select: {
            enrollments: true,
            reviews: true,
          },
        },
        enrollments: {
          select: {
            createdAt: true,
          },
        },
        reviews: {
          select: {
            rating: true,
            createdAt: true,
          },
        },
      },
    });

    // Calculate current period stats
    const totalCourses = courses.length;
    const publishedCourses = courses.filter(c => c.status === 'PUBLISHED').length;
    
    const currentEnrollments = courses.reduce((sum, course) => 
      sum + course.enrollments.filter(e => e.createdAt >= thirtyDaysAgo).length, 0
    );
    
    const totalStudents = courses.reduce((sum, course) => sum + course._count.enrollments, 0);
    
    // Calculate ratings
    const allReviews = courses.flatMap(c => c.reviews);
    const currentReviews = allReviews.filter(r => r.createdAt >= thirtyDaysAgo);
    const avgRating = allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 0;
    
    const previousReviews = allReviews.filter(r => 
      r.createdAt < thirtyDaysAgo && r.createdAt >= sixtyDaysAgo
    );
    const previousAvgRating = previousReviews.length > 0
      ? previousReviews.reduce((sum, r) => sum + r.rating, 0) / previousReviews.length
      : 0;
    
    const ratingChange = avgRating - previousAvgRating;

    // Calculate previous period for comparison
    const previousEnrollments = courses.reduce((sum, course) => 
      sum + course.enrollments.filter(e => 
        e.createdAt < thirtyDaysAgo && e.createdAt >= sixtyDaysAgo
      ).length, 0
    );

    const studentsChange = previousEnrollments > 0
      ? ((currentEnrollments - previousEnrollments) / previousEnrollments) * 100
      : 0;

    // Get lesson progress for watch hours estimation
    const completedLessons = await prisma.lessonProgress.findMany({
      where: {
        lesson: {
          course: {
            creatorId: session.user.id,
          },
        },
        updatedAt: {
          gte: thirtyDaysAgo,
        },
        completed: true,
      },
      include: {
        lesson: {
          select: {
            duration: true,
          },
        },
      },
    });

    // Estimate watch hours based on completed lessons (assume full duration watched)
    const totalWatchMinutes = completedLessons.reduce((sum, lp) => 
      sum + (lp.lesson.duration || 0), 0
    );
    const watchHours = Math.round(totalWatchMinutes / 60);

    const previousCompletedLessons = await prisma.lessonProgress.findMany({
      where: {
        lesson: {
          course: {
            creatorId: session.user.id,
          },
        },
        updatedAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo,
        },
        completed: true,
      },
      include: {
        lesson: {
          select: {
            duration: true,
          },
        },
      },
    });

    const previousWatchMinutes = previousCompletedLessons.reduce((sum, lp) => 
      sum + (lp.lesson.duration || 0), 0
    );
    const previousWatchHours = Math.round(previousWatchMinutes / 60);
    const watchHoursChange = previousWatchHours > 0
      ? ((watchHours - previousWatchHours) / previousWatchHours) * 100
      : 0;

    // Calculate total views (approximation based on lesson progress)
    const totalViews = completedLessons.length;
    const previousViews = previousCompletedLessons.length;
    const viewsChange = previousViews > 0
      ? ((totalViews - previousViews) / previousViews) * 100
      : 0;

    // Get live sessions count
    // First find the creator record
    const creator = await prisma.creator.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    const liveSessions = creator ? await prisma.liveSession.findMany({
      where: {
        channel: {
          creatorId: creator.id,
        },
      },
      select: {
        status: true,
        scheduledAt: true,
      },
    }) : [];

    const activeLiveSessions = liveSessions.filter(s => s.status === 'LIVE').length;
    const upcomingLiveSessions = liveSessions.filter(s => 
      s.status === 'SCHEDULED' && 
      s.scheduledAt && 
      new Date(s.scheduledAt) > now
    ).length;

    // Calculate total revenue (simplified - would need payment integration)
    const totalRevenue = totalStudents * 50; // Placeholder calculation
    const previousRevenue = (totalStudents - currentEnrollments) * 50;
    const revenueChange = previousRevenue > 0
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    const stats = {
      totalRevenue,
      revenueChange,
      totalStudents,
      studentsChange,
      totalCourses,
      publishedCourses,
      avgRating,
      ratingChange,
      totalViews,
      viewsChange,
      watchHours,
      watchHoursChange,
      activeLiveSessions,
      upcomingLiveSessions,
    };

    return NextResponse.json({ stats });

  } catch (error) {
    console.error('Error fetching creator dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
