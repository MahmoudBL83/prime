import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/student/my-cohorts - Get user's enrolled cohorts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all'; // all, pending, active, completed

    // Build status filter
    const statusFilter: any = {};
    if (status === 'pending') {
      statusFilter.status = 'PENDING';
    } else if (status === 'active') {
      statusFilter.status = 'ACTIVE';
    } else if (status === 'completed') {
      statusFilter.status = 'COMPLETED';
    }

    // Fetch user's cohort memberships
    const memberships = await prisma.cohortMember.findMany({
      where: {
        userId,
        ...statusFilter,
      },
      include: {
        cohort: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                titleAr: true,
                thumbnail: true,
                category: true,
                creator: {
                  select: {
                    user: {
                      select: {
                        name: true,
                        profileImage: true,
                      },
                    },
                  },
                },
              },
            },
            _count: {
              select: {
                sessions: true,
                announcements: true,
                milestones: true,
                members: true,
              },
            },
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    profileImage: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    // Get upcoming sessions for each cohort
    const cohortIds = memberships.map((m: any) => m.cohortId);
    const upcomingSessions = await prisma.cohortSession.findMany({
      where: {
        cohortId: { in: cohortIds },
        status: 'SCHEDULED',
        scheduledAt: { gte: new Date() },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 1, // Next session for each cohort
    });

    const upcomingSessionMap = new Map(
      upcomingSessions.map((s: any) => [s.cohortId, s])
    );

    // Get unread announcements count
    const unreadAnnouncements = await prisma.cohortAnnouncement.findMany({
      where: {
        cohortId: { in: cohortIds },
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
      },
      select: {
        cohortId: true,
      },
    });

    const unreadMap = new Map<string, number>();
    unreadAnnouncements.forEach((a: any) => {
      unreadMap.set(a.cohortId, (unreadMap.get(a.cohortId) || 0) + 1);
    });

    // Enrich memberships with additional data
    const enrichedMemberships = memberships.map((membership: any) => {
      const nextSession = upcomingSessionMap.get(membership.cohortId);
      const unreadCount = unreadMap.get(membership.cohortId) || 0;

      const now = new Date();
      const startDate = new Date(membership.cohort.startDate);
      const endDate = new Date(membership.cohort.endDate);
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const elapsedDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        membershipId: membership.id,
        membershipStatus: membership.status,
        progressPercent: membership.progressPercent,
        attendedSessions: membership.attendedSessions,
        missedSessions: membership.missedSessions,
        capstoneSubmitted: membership.capstoneSubmitted,
        joinedAt: membership.joinedAt,
        cohort: {
          id: membership.cohort.id,
          courseId: membership.cohort.courseId,
          courseTitle: membership.cohort.course.title,
          courseTitleAr: membership.cohort.course.titleAr,
          courseThumbnail: membership.cohort.course.thumbnail,
          courseCategory: membership.cohort.course.category,
          creatorName: membership.cohort.course.creator.user.name,
          creatorImage: membership.cohort.course.creator.user.profileImage,
          description: membership.cohort.description,
          startDate: membership.cohort.startDate,
          endDate: membership.cohort.endDate,
          status: membership.cohort.status,
          timezone: membership.cohort.timezone,
          language: membership.cohort.language,
          sessionsCount: membership.cohort._count.sessions,
          announcementsCount: membership.cohort._count.announcements,
          milestonesCount: membership.cohort._count.milestones,
          membersCount: membership.cohort._count.members,
          students: membership.cohort.members.map((m: any) => ({
            id: m.userId,
            name: m.user.name,
            profileImage: m.user.profileImage,
          })),
          unreadAnnouncements: unreadCount,
          totalDays,
          elapsedDays,
          daysRemaining,
          nextSession: nextSession
            ? {
              id: nextSession.id,
              title: nextSession.title,
              scheduledAt: nextSession.scheduledAt,
              type: nextSession.type,
            }
            : null,
        },
      };
    });

    return NextResponse.json({
      memberships: enrichedMemberships,
      total: enrichedMemberships.length,
      stats: {
        pending: memberships.filter((m: any) => m.status === 'PENDING').length,
        active: memberships.filter((m: any) => m.status === 'ACTIVE').length,
        completed: memberships.filter((m: any) => m.status === 'COMPLETED').length,
      },
    });
  } catch (error) {
    console.error('Error fetching my cohorts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch your cohorts' },
      { status: 500 }
    );
  }
}
