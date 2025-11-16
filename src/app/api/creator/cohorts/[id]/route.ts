import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/creator/cohorts/[id]
 * Get detailed cohort information with members and sessions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { error: 'Only creators can view cohort details' },
        { status: 403 }
      );
    }

    const { id: cohortId } = await params;

    // Fetch cohort with full details
    const cohort = await prisma.cohort.findUnique({
      where: { id: cohortId },
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
        members: {
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
          orderBy: {
            joinedAt: 'desc',
          },
        },
        sessions: {
          include: {
            _count: {
              select: {
                attendees: true,
              },
            },
          },
          orderBy: {
            scheduledAt: 'asc',
          },
        },
        announcements: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10, // Latest 10 announcements
        },
        milestones: {
          orderBy: {
            dueDate: 'asc',
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
      return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    }

    // Verify course ownership
    if (cohort.course.creatorId !== creator.id) {
      return NextResponse.json(
        { error: 'You can only view cohorts for your own courses' },
        { status: 403 }
      );
    }

    // Calculate member statistics
    const memberStats = {
      total: cohort._count.members,
      active: cohort.members.filter((m) => m.status === 'ACTIVE').length,
      pending: cohort.members.filter((m) => m.status === 'PENDING').length,
      completed: cohort.members.filter((m) => m.status === 'COMPLETED').length,
      dropped: cohort.members.filter((m) => m.status === 'DROPPED').length,
      averageProgress:
        cohort.members.length > 0
          ? Math.round(
              cohort.members.reduce((sum, m) => sum + m.progressPercent, 0) /
                cohort.members.length
            )
          : 0,
      capstoneSubmitted: cohort.members.filter((m) => m.capstoneSubmitted)
        .length,
    };

    // Calculate session statistics
    const now = new Date();
    const sessionStats = {
      total: cohort._count.sessions,
      upcoming: cohort.sessions.filter(
        (s) => new Date(s.scheduledAt) > now && s.status === 'SCHEDULED'
      ).length,
      completed: cohort.sessions.filter((s) => s.status === 'COMPLETED').length,
      live: cohort.sessions.filter((s) => s.status === 'LIVE').length,
      averageAttendance:
        cohort.sessions.length > 0
          ? Math.round(
              cohort.sessions.reduce((sum, s) => sum + s.attendeeCount, 0) /
                cohort.sessions.length
            )
          : 0,
    };

    // Calculate overall progress
    const totalDays = Math.ceil(
      (new Date(cohort.endDate).getTime() -
        new Date(cohort.startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const elapsedDays = Math.ceil(
      (now.getTime() - new Date(cohort.startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const progressPercent = Math.min(
      100,
      Math.max(0, (elapsedDays / totalDays) * 100)
    );

    // Calculate occupancy
    const occupancyPercent = cohort.maxMembers
      ? (cohort._count.members / cohort.maxMembers) * 100
      : null;

    return NextResponse.json({
      cohort: {
        ...cohort,
        progressPercent: Math.round(progressPercent),
        occupancyPercent: occupancyPercent ? Math.round(occupancyPercent) : null,
        isFull: cohort.maxMembers
          ? cohort._count.members >= cohort.maxMembers
          : false,
        daysRemaining: Math.max(
          0,
          Math.ceil(
            (new Date(cohort.endDate).getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        ),
      },
      memberStats,
      sessionStats,
    });
  } catch (error: any) {
    console.error('Error fetching cohort details:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/creator/cohorts/[id]
 * Update cohort information
 */
export async function PATCH(
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
        { error: 'Only creators can update cohorts' },
        { status: 403 }
      );
    }

    const cohortId = id;

    // Verify cohort exists and ownership
    const existingCohort = await prisma.cohort.findUnique({
      where: { id: cohortId },
      include: {
        course: {
          select: {
            creatorId: true,
          },
        },
      },
    });

    if (!existingCohort) {
      return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    }

    if (existingCohort.course.creatorId !== creator.id) {
      return NextResponse.json(
        { error: 'You can only update your own cohorts' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
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
      isActive,
      status,
    } = body;

    // Validate dates if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start >= end) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        );
      }
    }

    // Build update object (only include provided fields)
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (nameAr !== undefined) updateData.nameAr = nameAr;
    if (description !== undefined) updateData.description = description;
    if (descriptionAr !== undefined) updateData.descriptionAr = descriptionAr;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (maxMembers !== undefined)
      updateData.maxMembers = maxMembers ? parseInt(maxMembers) : null;
    if (price !== undefined) updateData.price = price ? parseFloat(price) : null;
    if (currency !== undefined) updateData.currency = currency;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (weeklySchedule !== undefined) updateData.weeklySchedule = weeklySchedule;
    if (prerequisites !== undefined) updateData.prerequisites = prerequisites;
    if (applicationRequired !== undefined)
      updateData.applicationRequired = applicationRequired;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (status !== undefined) updateData.status = status;

    // Update cohort
    const updatedCohort = await prisma.cohort.update({
      where: { id: cohortId },
      data: updateData,
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

    return NextResponse.json({
      message: 'Cohort updated successfully',
      messageAr: 'تم تحديث المجموعة بنجاح',
      cohort: updatedCohort,
    });
  } catch (error: any) {
    console.error('Error updating cohort:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/creator/cohorts/[id]
 * Delete a cohort (only if no active members)
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
        { error: 'Only creators can delete cohorts' },
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
        { error: 'You can only delete your own cohorts' },
        { status: 403 }
      );
    }

    // Check if cohort has active members
    const activeMembers = await prisma.cohortMember.count({
      where: {
        cohortId,
        status: {
          in: ['ACTIVE', 'APPROVED'],
        },
      },
    });

    if (activeMembers > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete cohort with active members',
          errorAr: 'لا يمكن حذف المجموعة التي تحتوي على أعضاء نشطين',
          activeMembers,
        },
        { status: 400 }
      );
    }

    // Delete cohort (cascade will handle related records)
    await prisma.cohort.delete({
      where: { id: cohortId },
    });

    return NextResponse.json({
      message: 'Cohort deleted successfully',
      messageAr: 'تم حذف المجموعة بنجاح',
    });
  } catch (error: any) {
    console.error('Error deleting cohort:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
