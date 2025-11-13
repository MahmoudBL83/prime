import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/creator/cohorts/[id]/milestones - List all milestones for a cohort
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

    const { id: cohortId } = await params;

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

    // Verify cohort exists and belongs to creator
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
      return NextResponse.json(
        { error: 'Cohort not found' },
        { status: 404 }
      );
    }

    if (cohort.course.creatorId !== creator.id) {
      return NextResponse.json(
        { error: 'You do not have access to this cohort' },
        { status: 403 }
      );
    }

    // Get milestones with completion stats
    const milestones = await prisma.cohortMilestone.findMany({
      where: { cohortId },
      orderBy: { dueDate: 'asc' },
    });

    // Get active members count for completion percentage
    const activeMembersCount = await prisma.cohortMember.count({
      where: {
        cohortId,
        status: 'ACTIVE',
      },
    });

    // Calculate completion stats for each milestone
    const milestonesWithStats = milestones.map((milestone) => {
      const completionPercentage = activeMembersCount > 0
        ? Math.round((milestone.completedCount / activeMembersCount) * 100)
        : 0;

      const now = new Date();
      const isOverdue = !milestone.isCompleted && milestone.dueDate < now;
      const isUpcoming = !milestone.isCompleted && milestone.dueDate > now;

      return {
        ...milestone,
        completionPercentage,
        isOverdue,
        isUpcoming,
        activeMembersCount,
      };
    });

    return NextResponse.json({
      milestones: milestonesWithStats,
      total: milestones.length,
      completed: milestones.filter(m => m.isCompleted).length,
      overdue: milestonesWithStats.filter(m => m.isOverdue).length,
      upcoming: milestonesWithStats.filter(m => m.isUpcoming).length,
    });
  } catch (error) {
    console.error('Error fetching milestones:', error);
    return NextResponse.json(
      { error: 'Failed to fetch milestones' },
      { status: 500 }
    );
  }
}

// POST /api/creator/cohorts/[id]/milestones - Create a new milestone
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const cohortId = params.id;

    // Verify user is a creator
    const creator = await prisma.creator.findUnique({
      where: { userId: session.user.id },
    });

    if (!creator) {
      return NextResponse.json(
        { error: 'Only creators can create milestones' },
        { status: 403 }
      );
    }

    // Verify cohort exists and belongs to creator
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
      return NextResponse.json(
        { error: 'Cohort not found' },
        { status: 404 }
      );
    }

    if (cohort.course.creatorId !== creator.id) {
      return NextResponse.json(
        { error: 'You do not have access to this cohort' },
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
    } = body;

    // Validate required fields
    if (!title || !type || !dueDate) {
      return NextResponse.json(
        { error: 'Title, type, and due date are required' },
        { status: 400 }
      );
    }

    // Validate type
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

    // Validate due date is within cohort timeline
    const dueDateObj = new Date(dueDate);
    const cohortStart = new Date(cohort.startDate);
    const cohortEnd = new Date(cohort.endDate);

    if (dueDateObj < cohortStart || dueDateObj > cohortEnd) {
      return NextResponse.json(
        {
          error: `Due date must be between cohort start (${cohortStart.toLocaleDateString()}) and end (${cohortEnd.toLocaleDateString()})`,
        },
        { status: 400 }
      );
    }

    // Create milestone
    const milestone = await prisma.cohortMilestone.create({
      data: {
        cohortId,
        title,
        description: description || '',
        type,
        dueDate: dueDateObj,
        points: points || 0,
        attachmentUrl: attachmentUrl || null,
        submissionRequired: submissionRequired || false,
        isCompleted: false,
        completedCount: 0,
      },
    });

    return NextResponse.json({
      message: 'Milestone created successfully',
      milestone,
    });
  } catch (error) {
    console.error('Error creating milestone:', error);
    return NextResponse.json(
      { error: 'Failed to create milestone' },
      { status: 500 }
    );
  }
}
