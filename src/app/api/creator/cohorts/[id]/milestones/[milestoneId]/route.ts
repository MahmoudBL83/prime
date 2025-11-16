import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/creator/cohorts/[id]/milestones/[milestoneId] - Get a specific milestone
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const { id, milestoneId } = await params
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const cohortId = id;

    // Verify user is a creator
    const creator = await prisma.creator.findUnique({
      where: { userId: session.user.id },
    });

    if (!creator) {
      return NextResponse.json(
        { error: 'Only creators can access milestones' },
        { status: 403 }
      );
    }

    // Verify cohort and milestone
    const milestone = await prisma.cohortMilestone.findUnique({
      where: { id: milestoneId },
      include: {
        cohort: {
          include: {
            course: {
              select: {
                creatorId: true,
              },
            },
          },
        },
      },
    });

    if (!milestone) {
      return NextResponse.json(
        { error: 'Milestone not found' },
        { status: 404 }
      );
    }

    if (milestone.cohortId !== cohortId) {
      return NextResponse.json(
        { error: 'Milestone does not belong to this cohort' },
        { status: 400 }
      );
    }

    if (milestone.cohort.course.creatorId !== creator.id) {
      return NextResponse.json(
        { error: 'You do not have access to this milestone' },
        { status: 403 }
      );
    }

    // Get active members count
    const activeMembersCount = await prisma.cohortMember.count({
      where: {
        cohortId,
        status: 'ACTIVE',
      },
    });

    const completionPercentage = activeMembersCount > 0
      ? Math.round((milestone.completedCount / activeMembersCount) * 100)
      : 0;

    const now = new Date();
    const isOverdue = !milestone.isCompleted && milestone.dueDate < now;
    const isUpcoming = !milestone.isCompleted && milestone.dueDate > now;

    return NextResponse.json({
      milestone: {
        ...milestone,
        completionPercentage,
        isOverdue,
        isUpcoming,
        activeMembersCount,
      },
    });
  } catch (error) {
    console.error('Error fetching milestone:', error);
    return NextResponse.json(
      { error: 'Failed to fetch milestone' },
      { status: 500 }
    );
  }
}

// PATCH /api/creator/cohorts/[id]/milestones/[milestoneId] - Update a milestone
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const { id, milestoneId } = await params
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const cohortId = id;

    // Verify user is a creator
    const creator = await prisma.creator.findUnique({
      where: { userId: session.user.id },
    });

    if (!creator) {
      return NextResponse.json(
        { error: 'Only creators can update milestones' },
        { status: 403 }
      );
    }

    // Verify milestone exists and belongs to creator
    const milestone = await prisma.cohortMilestone.findUnique({
      where: { id: milestoneId },
      include: {
        cohort: {
          include: {
            course: {
              select: {
                creatorId: true,
              },
            },
          },
        },
      },
    });

    if (!milestone) {
      return NextResponse.json(
        { error: 'Milestone not found' },
        { status: 404 }
      );
    }

    if (milestone.cohortId !== cohortId) {
      return NextResponse.json(
        { error: 'Milestone does not belong to this cohort' },
        { status: 400 }
      );
    }

    if (milestone.cohort.course.creatorId !== creator.id) {
      return NextResponse.json(
        { error: 'You do not have access to this milestone' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      type,
      dueDate,
      points,
      attachmentUrl,
      submissionRequired,
      isCompleted,
    } = body;

    // Validate type if provided
    if (type) {
      const validTypes = [
        'ASSIGNMENT',
        'QUIZ',
        'CAPSTONE',
        'PEER_REVIEW',
        'READING',
        'PROJECT_PHASE',
        'DEADLINE',
      ];

      if (!validTypes.includes(type)) {
        return NextResponse.json(
          { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Validate due date if provided
    if (dueDate) {
      const dueDateObj = new Date(dueDate);
      const cohortStart = new Date(milestone.cohort.startDate);
      const cohortEnd = new Date(milestone.cohort.endDate);

      if (dueDateObj < cohortStart || dueDateObj > cohortEnd) {
        return NextResponse.json(
          {
            error: `Due date must be between cohort start and end dates`,
          },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    if (points !== undefined) updateData.points = points;
    if (attachmentUrl !== undefined) updateData.attachmentUrl = attachmentUrl;
    if (submissionRequired !== undefined) updateData.submissionRequired = submissionRequired;
    if (isCompleted !== undefined) updateData.isCompleted = isCompleted;

    // Update milestone
    const updatedMilestone = await prisma.cohortMilestone.update({
      where: { id: milestoneId },
      data: updateData,
    });

    return NextResponse.json({
      message: 'Milestone updated successfully',
      milestone: updatedMilestone,
    });
  } catch (error) {
    console.error('Error updating milestone:', error);
    return NextResponse.json(
      { error: 'Failed to update milestone' },
      { status: 500 }
    );
  }
}

// DELETE /api/creator/cohorts/[id]/milestones/[milestoneId] - Delete a milestone
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const { id, milestoneId } = await params
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const cohortId = id;

    // Verify user is a creator
    const creator = await prisma.creator.findUnique({
      where: { userId: session.user.id },
    });

    if (!creator) {
      return NextResponse.json(
        { error: 'Only creators can delete milestones' },
        { status: 403 }
      );
    }

    // Verify milestone exists and belongs to creator
    const milestone = await prisma.cohortMilestone.findUnique({
      where: { id: milestoneId },
      include: {
        cohort: {
          include: {
            course: {
              select: {
                creatorId: true,
              },
            },
          },
        },
      },
    });

    if (!milestone) {
      return NextResponse.json(
        { error: 'Milestone not found' },
        { status: 404 }
      );
    }

    if (milestone.cohortId !== cohortId) {
      return NextResponse.json(
        { error: 'Milestone does not belong to this cohort' },
        { status: 400 }
      );
    }

    if (milestone.cohort.course.creatorId !== creator.id) {
      return NextResponse.json(
        { error: 'You do not have access to this milestone' },
        { status: 403 }
      );
    }

    // Delete milestone
    await prisma.cohortMilestone.delete({
      where: { id: milestoneId },
    });

    return NextResponse.json({
      message: 'Milestone deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting milestone:', error);
    return NextResponse.json(
      { error: 'Failed to delete milestone' },
      { status: 500 }
    );
  }
}
