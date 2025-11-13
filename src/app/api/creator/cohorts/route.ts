import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/creator/cohorts
 * List all cohorts for the creator's courses
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify creator status
    const creator = await prisma.creator.findUnique({
      where: { userId: session.user.id },
    });

    if (!creator) {
      return NextResponse.json(
        { error: 'Only creators can manage cohorts' },
        { status: 403 }
      );
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const status = searchParams.get('status');

    // Build where clause
    const whereClause: any = {
      course: {
        creatorId: creator.id,
      },
    };

    if (courseId) {
      whereClause.courseId = courseId;
    }

    if (status) {
      whereClause.status = status;
    }

    // Fetch cohorts with member counts and course details
    const cohorts = await prisma.cohort.findMany({
      where: whereClause,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            titleAr: true,
            thumbnail: true,
            category: true,
          },
        },
        _count: {
          select: {
            members: true,
            sessions: true,
            announcements: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate statistics
    const stats = {
      totalCohorts: cohorts.length,
      activeCohorts: cohorts.filter((c) => c.status === 'ACTIVE').length,
      upcomingCohorts: cohorts.filter((c) => c.status === 'UPCOMING').length,
      totalMembers: cohorts.reduce((sum, c) => sum + c._count.members, 0),
      totalSessions: cohorts.reduce((sum, c) => sum + c._count.sessions, 0),
    };

    // Transform cohorts to include computed fields
    const cohortsWithDetails = cohorts.map((cohort) => {
      const now = new Date();
      const startDate = new Date(cohort.startDate);
      const endDate = new Date(cohort.endDate);

      // Auto-update status based on dates
      let currentStatus = cohort.status;
      if (cohort.isActive) {
        if (now < startDate) {
          currentStatus = 'UPCOMING';
        } else if (now >= startDate && now <= endDate) {
          currentStatus = 'ACTIVE';
        } else if (now > endDate) {
          currentStatus = 'COMPLETED';
        }
      }

      // Calculate progress percentage (days elapsed / total days)
      const totalDays = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const elapsedDays = Math.ceil(
        (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const progressPercent =
        currentStatus === 'ACTIVE'
          ? Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100))
          : currentStatus === 'COMPLETED'
          ? 100
          : 0;

      // Calculate occupancy percentage
      const occupancyPercent = cohort.maxMembers
        ? (cohort._count.members / cohort.maxMembers) * 100
        : null;

      return {
        ...cohort,
        currentStatus,
        progressPercent: Math.round(progressPercent),
        occupancyPercent: occupancyPercent
          ? Math.round(occupancyPercent)
          : null,
        isFull: cohort.maxMembers
          ? cohort._count.members >= cohort.maxMembers
          : false,
        daysRemaining:
          currentStatus === 'ACTIVE'
            ? Math.max(
                0,
                Math.ceil(
                  (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                )
              )
            : null,
      };
    });

    return NextResponse.json({
      cohorts: cohortsWithDetails,
      stats,
    });
  } catch (error: any) {
    console.error('Error fetching cohorts:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/creator/cohorts
 * Create a new cohort for a course
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify creator status
    const creator = await prisma.creator.findUnique({
      where: { userId: session.user.id },
    });

    if (!creator) {
      return NextResponse.json(
        { error: 'Only creators can create cohorts' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      courseId,
      name,
      nameAr,
      description,
      descriptionAr,
      startDate,
      endDate,
      maxMembers,
      price,
      currency,
      timezone,
      weeklySchedule,
      prerequisites,
      applicationRequired,
    } = body;

    // Validate required fields
    if (!courseId || !name || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: courseId, name, startDate, endDate' },
        { status: 400 }
      );
    }

    // Validate name length
    if (name.length < 5) {
      return NextResponse.json(
        { error: 'Cohort name must be at least 5 characters' },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start >= end) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    if (start < now) {
      return NextResponse.json(
        { error: 'Start date must be in the future' },
        { status: 400 }
      );
    }

    // Verify course ownership
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { creatorId: true },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (course.creatorId !== creator.id) {
      return NextResponse.json(
        { error: 'You can only create cohorts for your own courses' },
        { status: 403 }
      );
    }

    // Determine initial status based on start date
    const status = start > now ? 'UPCOMING' : 'ACTIVE';

    // Create cohort
    const cohort = await prisma.cohort.create({
      data: {
        courseId,
        name,
        nameAr,
        description,
        descriptionAr,
        startDate: start,
        endDate: end,
        maxMembers: maxMembers ? parseInt(maxMembers) : null,
        price: price ? parseFloat(price) : null,
        currency: currency || 'EGP',
        timezone: timezone || 'Africa/Cairo',
        weeklySchedule: weeklySchedule || null,
        prerequisites: prerequisites || null,
        applicationRequired: applicationRequired || false,
        status,
        isActive: true,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            titleAr: true,
            thumbnail: true,
          },
        },
        _count: {
          select: {
            members: true,
            sessions: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: 'Cohort created successfully',
        messageAr: 'تم إنشاء المجموعة بنجاح',
        cohort,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating cohort:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
