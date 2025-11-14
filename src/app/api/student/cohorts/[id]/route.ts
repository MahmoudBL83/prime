import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/student/cohorts/[id]/apply - Apply to join a cohort
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const cohortId = id;
    const userId = session.user.id;

    // Check if cohort exists and is open
    const cohort = await prisma.cohort.findUnique({
      where: { id: cohortId },
      include: {
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!cohort) {
      return NextResponse.json(
        { error: 'Cohort not found' },
        { status: 404 }
      );
    }

    // Check if cohort is open for enrollment
    if (cohort.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'This cohort is not open for enrollment' },
        { status: 400 }
      );
    }

    // Check enrollment deadline
    const now = new Date();
    if (cohort.enrollmentEndDate && cohort.enrollmentEndDate < now) {
      return NextResponse.json(
        { error: 'Enrollment deadline has passed' },
        { status: 400 }
      );
    }

    // Check if cohort is full
    if (cohort.maxMembers && cohort._count.members >= cohort.maxMembers) {
      return NextResponse.json(
        { error: 'This cohort is full' },
        { status: 400 }
      );
    }

    // Check if user already applied or is member
    const existingMembership = await prisma.cohortMember.findUnique({
      where: {
        cohortId_userId: {
          cohortId,
          userId,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        {
          error:
            existingMembership.status === 'PENDING'
              ? 'You have already applied to this cohort'
              : 'You are already a member of this cohort',
        },
        { status: 400 }
      );
    }

    // Parse application data from request
    const body = await request.json();
    const { motivation } = body;

    // Create membership application
    const membership = await prisma.cohortMember.create({
      data: {
        cohortId,
        userId,
        status: 'PENDING', // Requires approval
        progressPercent: 0,
        attendedSessions: 0,
        missedSessions: 0,
        capstoneSubmitted: false,
        joinedAt: null, // Will be set when approved
      },
    });

    // TODO: Send notification to creator about new application
    // TODO: Send confirmation email to student

    return NextResponse.json({
      message: 'Application submitted successfully',
      membership: {
        id: membership.id,
        status: membership.status,
        cohortId: membership.cohortId,
      },
    });
  } catch (error) {
    console.error('Error applying to cohort:', error);
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}

// GET /api/student/cohorts/[id] - Get cohort details for student
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const cohortId = id;

    const cohortId = params.id;
    const userId = session.user.id;

    // Fetch cohort with details
    const cohort = await prisma.cohort.findUnique({
      where: { id: cohortId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            titleAr: true,
            description: true,
            thumbnail: true,
            category: true,
            creatorId: true,
            creator: {
              select: {
                id: true,
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
            members: true,
            sessions: true,
            announcements: true,
            milestones: true,
          },
        },
      },
    });

    if (!cohort) {
      return NextResponse.json(
        { error: 'Cohort not found' },
        { status: 404 }
      );
    }

    // Get user's membership
    const membership = await prisma.cohortMember.findUnique({
      where: {
        cohortId_userId: {
          cohortId,
          userId,
        },
      },
    });

    const spotsAvailable = cohort.maxMembers
      ? cohort.maxMembers - cohort._count.members
      : null;
    const isFull = cohort.maxMembers
      ? cohort._count.members >= cohort.maxMembers
      : false;

    return NextResponse.json({
      cohort: {
        id: cohort.id,
        courseId: cohort.courseId,
        courseTitle: cohort.course.title,
        courseTitleAr: cohort.course.titleAr,
        courseDescription: cohort.course.description,
        courseThumbnail: cohort.course.thumbnail,
        courseCategory: cohort.course.category,
        creatorName: cohort.course.creator.user.name,
        creatorImage: cohort.course.creator.user.profileImage,
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
        milestonesCount: cohort._count.milestones,
        timezone: cohort.timezone,
        language: cohort.language,
      },
      membership: membership
        ? {
            id: membership.id,
            status: membership.status,
            progressPercent: membership.progressPercent,
            attendedSessions: membership.attendedSessions,
            missedSessions: membership.missedSessions,
            capstoneSubmitted: membership.capstoneSubmitted,
            joinedAt: membership.joinedAt,
          }
        : null,
      canApply: !membership && !isFull && cohort.status === 'OPEN',
    });
  } catch (error) {
    console.error('Error fetching cohort details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cohort details' },
      { status: 500 }
    );
  }
}
