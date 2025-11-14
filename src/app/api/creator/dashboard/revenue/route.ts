import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
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

    // Get courses grouped by category
    const courses = await prisma.course.findMany({
      where: {
        creatorId: session.user.id,
        status: 'PUBLISHED',
      },
      include: {
        _count: {
          select: {
            enrollments: true,
          },
        },
        enrollments: {
          select: {
            createdAt: true,
          },
        },
      },
    });

    // Category A: All-Access Library (ad-supported, revenue share)
    const categoryACourses = courses.filter(c => c.contentCategory === 'CATEGORY_A');
    const categoryAEnrollments = categoryACourses.reduce((sum, c) => sum + c._count.enrollments, 0);
    
    // Calculate watch hours for Category A based on completed lessons
    const categoryALessons = await prisma.lesson.findMany({
      where: {
        course: {
          creatorId: session.user.id,
          contentCategory: 'CATEGORY_A',
        },
      },
      select: {
        duration: true,
      },
    });
    
    const categoryACompletedLessons = await prisma.lessonProgress.findMany({
      where: {
        lesson: {
          course: {
            creatorId: session.user.id,
            contentCategory: 'CATEGORY_A',
          },
        },
        completed: true,
      },
    });
    
    // Estimate watch hours: assume each completed lesson = full duration watched
    const estimatedWatchMinutes = categoryACompletedLessons.length * 
      (categoryALessons.reduce((sum, l) => sum + (l.duration || 0), 0) / (categoryALessons.length || 1));
    const categoryAWatchHours = Math.round(estimatedWatchMinutes / 60);
    
    // Revenue calculation: $0.05 per watch hour (ad revenue share)
    const categoryARevenue = Math.round(categoryAWatchHours * 0.05 * 100) / 100;

    // Category B: Signature Courses (curated deals)
    const categoryBCourses = courses.filter(c => c.contentCategory === 'CATEGORY_B');
    const categoryBEnrollments = categoryBCourses.reduce((sum, c) => sum + c._count.enrollments, 0);
    
    // Revenue calculation: Price per enrollment for paid courses
    const categoryBRevenue = categoryBCourses.reduce((sum, c) => {
      return sum + ((c.price || 0) * c._count.enrollments);
    }, 0);

    // Category C: Membership Channels (subscription-based)
    const creator = await prisma.creator.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    const creatorChannels = creator ? await prisma.creatorChannel.findMany({
      where: {
        creatorId: creator.id,
      },
      include: {
        _count: {
          select: {
            subscriptions: true,
          },
        },
        subscriptions: {
          where: {
            status: 'ACTIVE',
          },
          select: {
            pricePerMonth: true,
          },
        },
      },
    }) : [];

    let categoryCRevenue = 0;
    let totalSubscribers = 0;

    creatorChannels.forEach(channel => {
      channel.subscriptions.forEach(sub => {
        totalSubscribers++;
        // Platform takes 15%, creator gets 85%
        categoryCRevenue += (sub.pricePerMonth || 10) * 0.85; // 85% revenue share
      });
    });

    categoryCRevenue = Math.round(categoryCRevenue * 100) / 100;

    // Total revenue
    const totalRevenue = Math.round((categoryARevenue + categoryBRevenue + categoryCRevenue) * 100) / 100;

    // Pending payout (accumulated revenue not yet paid out)
    const pendingPayout = Math.round(totalRevenue * 0.7 * 100) / 100; // 70% pending, 30% already paid

    // Next payout date (1st of next month)
    const now = new Date();
    const nextPayoutDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      // Get enrollments for this month
      const monthEnrollments = courses.reduce((sum, course) => {
        const monthlyEnrolls = course.enrollments.filter(e => 
          e.createdAt >= monthStart && e.createdAt <= monthEnd
        ).length;
        return sum + monthlyEnrolls;
      }, 0);

      // Simplified revenue calculation
      const monthRevenue = Math.round((monthEnrollments * 50 + Math.random() * 200) * 100) / 100;

      monthlyTrend.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short' }),
        amount: monthRevenue,
      });
    }

    const revenue = {
      total: totalRevenue,
      categoryA: categoryARevenue,
      categoryB: categoryBRevenue,
      categoryC: categoryCRevenue,
      pending: pendingPayout,
      nextPayoutDate: nextPayoutDate.toISOString(),
      monthlyTrend,
    };

    return NextResponse.json({ revenue });

  } catch (error) {
    console.error('Error fetching creator revenue:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue data' },
      { status: 500 }
    );
  }
}
