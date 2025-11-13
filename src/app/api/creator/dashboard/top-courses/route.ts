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

    // Fetch creator's courses with performance metrics
    const courses = await prisma.course.findMany({
      where: {
        creatorId: session.user.id,
        status: 'PUBLISHED',
      },
      include: {
        _count: {
          select: {
            enrollments: true,
            reviews: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
        lessons: {
          select: {
            id: true,
            duration: true,
            progress: {
              select: {
                completed: true,
              },
            },
          },
        },
      },
      take: 10,
    });

    // Calculate performance metrics for each course
    const coursesWithMetrics = courses.map(course => {
      // Calculate average rating
      const avgRating = course.reviews.length > 0
        ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length
        : 0;

      // Calculate completion rate
      const totalLessons = course.lessons.length;
      const completedLessons = course.lessons.reduce((sum, lesson) => {
        return sum + lesson.progress.filter(p => p.completed).length;
      }, 0);
      const totalEnrollments = course._count.enrollments;
      const completionRate = totalEnrollments > 0 && totalLessons > 0
        ? (completedLessons / (totalEnrollments * totalLessons)) * 100
        : 0;

      // Calculate total views (unique lesson views)
      const totalViews = course.lessons.reduce((sum, lesson) => {
        return sum + lesson.progress.length;
      }, 0);

      // Calculate total watch hours (estimate based on lesson duration)
      const totalWatchMinutes = course.lessons.reduce((sum, lesson) => {
        const completedCount = lesson.progress.filter(p => p.completed).length;
        return sum + (completedCount * (lesson.duration || 0));
      }, 0);

      // Simplified revenue calculation
      const revenue = course._count.enrollments * 50; // $50 per enrollment

      // Determine trend (simplified - based on recent activity)
      const trend: 'up' | 'down' | 'stable' = 
        course._count.enrollments > 10 ? 'up' :
        course._count.enrollments < 5 ? 'down' : 'stable';

      return {
        id: course.id,
        title: course.title,
        thumbnail: course.thumbnail || '/images/course-placeholder.jpg',
        enrollments: course._count.enrollments,
        revenue,
        avgRating: Math.round(avgRating * 10) / 10,
        completionRate: Math.round(completionRate * 10) / 10,
        totalViews,
        category: course.contentCategory,
        status: course.status,
        trend,
      };
    });

    // Sort by revenue (top performing)
    coursesWithMetrics.sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json({ courses: coursesWithMetrics.slice(0, 5) });

  } catch (error) {
    console.error('Error fetching top courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top courses' },
      { status: 500 }
    );
  }
}
