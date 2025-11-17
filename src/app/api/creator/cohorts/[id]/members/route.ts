import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/creator/cohorts/[id]/members
 * List all members of a cohort with their progress
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
        { error: 'Only creators can view cohort members' },
        { status: 403 }
      );
    }

    const cohortId = id;

    // Verify cohort exists and ownership
    const cohort = await prisma.cohort.findUnique({
      where: { id: cohortId },
      include: {
        course: {
          select: {
            creatorId: true,
            id: true,
          },
        },
      },
    });

    if (!cohort) {
      return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    }

    if (cohort.course.creatorId !== creator.id) {
      return NextResponse.json(
        { error: 'You can only view members of your own cohorts' },
        { status: 403 }
      );
    }

    // Get filter parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Build where clause
    const whereClause: any = {
      cohortId,
    };

    if (status) {
      whereClause.status = status;
    }

    // Fetch members with user details and enrollment info
    const members = await prisma.cohortMember.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            arabicName: true,
            email: true,
            profileImage: true,
            enrollments: {
              where: {
                courseId: cohort.course.id,
              },
              select: {
                createdAt: true,
                progress: true,
              },
            },
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });

    // Enrich member data with computed fields
    const membersWithDetails = members.map((member) => {
      const enrollment = member.user.enrollments[0];

      // Determine if member is at risk (low progress, high absences)
      const isAtRisk =
        member.progressPercent < 50 &&
        member.missedSessions > 2 &&
        member.status === 'ACTIVE';

      // Determine if member needs attention (pending application, low attendance)
      const needsAttention =
        member.status === 'PENDING' ||
        (member.attendedSessions > 0 &&
          member.attendedSessions / (member.attendedSessions + member.missedSessions) <
            0.7);

      return {
        ...member,
        enrollmentDate: enrollment?.createdAt || null,
        courseProgress: enrollment?.progress || 0,
        isAtRisk,
        needsAttention,
        attendanceRate:
          member.attendedSessions + member.missedSessions > 0
            ? Math.round(
                (member.attendedSessions /
                  (member.attendedSessions + member.missedSessions)) *
                  100
              )
            : null,
      };
    });

    // Calculate statistics
    const stats = {
      total: members.length,
      active: members.filter((m) => m.status === 'ACTIVE').length,
      pending: members.filter((m) => m.status === 'PENDING').length,
      completed: members.filter((m) => m.status === 'COMPLETED').length,
      dropped: members.filter((m) => m.status === 'DROPPED').length,
      atRisk: membersWithDetails.filter((m) => m.isAtRisk).length,
      needsAttention: membersWithDetails.filter((m) => m.needsAttention).length,
      averageProgress:
        members.length > 0
          ? Math.round(
              members.reduce((sum, m) => sum + m.progressPercent, 0) / members.length
            )
          : 0,
    };

    return NextResponse.json({
      members: membersWithDetails,
      stats,
    });
  } catch (error: any) {
    console.error('Error fetching cohort members:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/creator/cohorts/[id]/members
 * Add a member to the cohort (approve application or direct add)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
        { error: 'Only creators can add cohort members' },
        { status: 403 }
      );
    }

    const cohortId = id;

    // Verify cohort exists and ownership
    const cohort = await prisma.cohort.findUnique({
      where: { id: cohortId },
      include: {
        course: {
          select: {
            creatorId: true,
            id: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!cohort) {
      return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    }

    if (cohort.course.creatorId !== creator.id) {
      return NextResponse.json(
        { error: 'You can only add members to your own cohorts' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, action } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Check if cohort is full
    if (cohort.maxMembers && cohort._count.members >= cohort.maxMembers) {
      return NextResponse.json(
        {
          error: 'Cohort is full',
          errorAr: 'المجموعة ممتلئة',
        },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const existingMember = await prisma.cohortMember.findUnique({
      where: {
        cohortId_userId: {
          cohortId,
          userId,
        },
      },
    });

    if (action === 'approve' && existingMember) {
      // Approve existing application
      if (existingMember.status !== 'PENDING') {
        return NextResponse.json(
          { error: 'Member is not pending approval' },
          { status: 400 }
        );
      }

      const updatedMember = await prisma.cohortMember.update({
        where: { id: existingMember.id },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedBy: session.user.id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              arabicName: true,
              email: true,
              profileImage: true,
            },
          },
        },
      });

      // TODO: Send approval notification to user

      return NextResponse.json({
        message: 'Member approved successfully',
        messageAr: 'تمت الموافقة على العضو بنجاح',
        member: updatedMember,
      });
    } else if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this cohort' },
        { status: 400 }
      );
    }

    // Verify user exists and is enrolled in the course
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        enrollments: {
          where: {
            courseId: cohort.course.id,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.enrollments.length === 0) {
      return NextResponse.json(
        {
          error: 'User must be enrolled in the course to join cohort',
          errorAr: 'يجب أن يكون المستخدم مسجلاً في الدورة للانضمام إلى المجموعة',
        },
        { status: 400 }
      );
    }

    // Add member directly (creator invitation)
    const newMember = await prisma.cohortMember.create({
      data: {
        cohortId,
        userId,
        status: 'APPROVED', // Direct add, skip pending
        approvedAt: new Date(),
        approvedBy: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            arabicName: true,
            email: true,
            profileImage: true,
          },
        },
      },
    });

    // TODO: Send invitation notification to user

    return NextResponse.json(
      {
        message: 'Member added successfully',
        messageAr: 'تمت إضافة العضو بنجاح',
        member: newMember,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error adding cohort member:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/creator/cohorts/[id]/members
 * Remove a member from the cohort
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
        { error: 'Only creators can remove cohort members' },
        { status: 403 }
      );
    }

    const cohortId = id;

    // Verify cohort exists and ownership
    const cohort = await prisma.cohort.findUnique({
      where: { id: cohortId },
      include: {
        course: {
          select: {
            creatorId: true,
          },
        },
      },
    });

    if (!cohort) {
      return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    }

    if (cohort.course.creatorId !== creator.id) {
      return NextResponse.json(
        { error: 'You can only remove members from your own cohorts' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Find and delete member
    const member = await prisma.cohortMember.findUnique({
      where: {
        cohortId_userId: {
          cohortId,
          userId,
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found in this cohort' },
        { status: 404 }
      );
    }

    // Delete member
    await prisma.cohortMember.delete({
      where: { id: member.id },
    });

    // TODO: Send removal notification to user

    return NextResponse.json({
      message: 'Member removed successfully',
      messageAr: 'تم إزالة العضو بنجاح',
    });
  } catch (error: any) {
    console.error('Error removing cohort member:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
