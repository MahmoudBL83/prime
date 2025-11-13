import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/student/cohorts - Browse available cohorts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all'; // all, open, upcoming, active
    const search = searchParams.get('search') || '';

    const userId = session.user.id;

    // Build filters
    const where: any = {};

    // Status filter
    const now = new Date();
    if (status === 'open') {
      // Open for enrollment: status OPEN and before enrollment end
      where.status = 'OPEN';
      where.enrollmentEndDate = { gte: now };
    } else if (status === 'upcoming') {
      // Starting soon: status OPEN and start date in future
      where.status = 'OPEN';
      where.startDate = { gt: now };
    } else if (status === 'active') {
      // Currently running: status ACTIVE
      where.status = 'ACTIVE';
    }

    // Search filter (title or description)
    if (search) {
      where.OR = [
        { course: { title: { contains: search, mode: 'insensitive' } } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch cohorts with related data
    const cohorts = await prisma.cohort.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            titleAr: true,
            thumbnail: true,
            category: true,
            creatorId: true,
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
      orderBy: { startDate: 'asc' },
    });

    // Get user's membership status for each cohort
    const cohortIds = cohorts.map((c: any) => c.id);
    const memberships = await prisma.cohortMember.findMany({
      where: {
        userId,
        cohortId: { in: cohortIds },
      },
      select: {
        cohortId: true,
        status: true,
      },
    });

    const membershipMap = new Map(
      memberships.map((m: any) => [m.cohortId, m.status])
    );

    // Enrich cohorts with membership info
    const enrichedCohorts = cohorts.map((cohort: any) => {
      const membershipStatus = membershipMap.get(cohort.id);
      const spotsAvailable = cohort.maxMembers
        ? cohort.maxMembers - cohort._count.members
        : null;
      const isFull = cohort.maxMembers
        ? cohort._count.members >= cohort.maxMembers
        : false;

      return {
        id: cohort.id,
        courseId: cohort.courseId,
        courseTitle: cohort.course.title,
        courseTitleAr: cohort.course.titleAr,
        courseThumbnail: cohort.course.thumbnail,
        courseCategory: cohort.course.category,
        description: cohort.description,
        startDate: cohort.startDate,
        endDate: cohort.endDate,
        enrollmentEndDate: cohort.enrollmentEndDate,
        status: cohort.status,
        maxMembers: cohort.maxMembers,
        currentMembers: cohort._count.members,
        spotsAvailable,
        isFull,
        sessionsCount: cohort._count.sessions,
        announcementsCount: cohort._count.announcements,
        membershipStatus: membershipStatus || null, // PENDING, ACTIVE, COMPLETED, DROPPED
        canApply: !membershipStatus && !isFull && cohort.status === 'OPEN',
        timezone: cohort.timezone,
        language: cohort.language,
      };
    });

    return NextResponse.json({
      cohorts: enrichedCohorts,
      total: enrichedCohorts.length,
    });
  } catch (error) {
    console.error('Error fetching cohorts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cohorts' },
      { status: 500 }
    );
  }
}
