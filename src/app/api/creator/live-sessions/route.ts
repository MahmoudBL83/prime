import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const createSessionSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().optional(),
  scheduledAt: z.string().datetime(),
  duration: z.number().min(15).max(480), // 15 mins to 8 hours
  tier: z.enum(['BRONZE', 'SILVER', 'GOLD', 'ALL']).default('BRONZE'),
  maxAttendees: z.number().min(1).max(10000).optional(),
});

// GET /api/creator/live-sessions - List all sessions
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
        { error: 'Only creators can access live sessions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // scheduled, live, ended, cancelled
    const channelId = searchParams.get('channelId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    // Get creator's channel
    const creatorId = session.user.id;
    let channel;

    if (channelId) {
      // Verify ownership
      channel = await prisma.creatorChannel.findFirst({
        where: {
          id: channelId,
          creatorId: creatorId,
        },
      });

      if (!channel) {
        return NextResponse.json(
          { error: 'Channel not found or unauthorized' },
          { status: 404 }
        );
      }
    } else {
      // Get default channel
      channel = await prisma.creatorChannel.findFirst({
        where: { creatorId: creatorId },
      });

      if (!channel) {
        return NextResponse.json(
          { error: 'No channel found. Please create a channel first.' },
          { status: 404 }
        );
      }
    }

    // Build query filters
    const where: any = {
      channelId: channel.id,
    };

    if (status) {
      where.status = status.toUpperCase();
    }

    // Fetch sessions
    const sessions = await prisma.liveSession.findMany({
      where,
      include: {
        attendees: {
          select: {
            id: true,
            userId: true,
            joinedAt: true,
            leftAt: true,
            duration: true,
          },
        },
        channel: {
          select: {
            id: true,
            name: true,
            nameAr: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'asc', // Upcoming sessions first
      },
      take: limit,
    });

    // Transform data for response
    const transformedSessions = sessions.map((session) => ({
      id: session.id,
      title: session.title,
      titleAr: session.titleAr,
      description: session.description,
      descriptionAr: session.descriptionAr,
      scheduledAt: session.scheduledAt.toISOString(),
      duration: session.duration,
      status: session.status,
      tier: session.tier,
      maxAttendees: session.maxAttendees,
      actualStartAt: session.actualStartAt?.toISOString(),
      actualEndAt: session.actualEndAt?.toISOString(),
      viewCount: session.viewCount,
      attendeeCount: session.attendees.length,
      activeAttendees: session.attendees.filter((a) => !a.leftAt).length,
      channelName: session.channel.name,
      channelNameAr: session.channel.nameAr,
      createdAt: session.createdAt.toISOString(),
    }));

    return NextResponse.json({
      sessions: transformedSessions,
      total: transformedSessions.length,
    });
  } catch (error) {
    console.error('Error fetching live sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live sessions' },
      { status: 500 }
    );
  }
}

// POST /api/creator/live-sessions - Schedule new session
export async function POST(request: NextRequest) {
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
        { error: 'Only creators can schedule live sessions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = createSessionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validation.error.issues 
        },
        { status: 400 }
      );
    }

    const data = validation.data;
    const creatorId = session.user.id;

    // Get or create creator's channel
    let channel = await prisma.creatorChannel.findFirst({
      where: { creatorId: creatorId },
    });

    if (!channel) {
      // Auto-create default channel
      const creator = await prisma.creator.findUnique({
        where: { userId: creatorId },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!creator) {
        return NextResponse.json(
          { error: 'Creator profile not found' },
          { status: 404 }
        );
      }

      channel = await prisma.creatorChannel.create({
        data: {
          creatorId: creatorId,
          name: `${creator.user.name}'s Channel`,
          description: `Welcome to ${creator.user.name}'s exclusive channel`,
          tiers: JSON.stringify(['BRONZE', 'SILVER', 'GOLD']),
        },
      });
    }

    // Validate scheduled time is in the future
    const scheduledAt = new Date(data.scheduledAt);
    if (scheduledAt <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      );
    }

    // Create live session
    const liveSession = await prisma.liveSession.create({
      data: {
        channelId: channel.id,
        title: data.title,
        description: data.description,
        scheduledAt: scheduledAt,
        duration: data.duration,
        tier: data.tier === 'ALL' ? 'BRONZE' : data.tier,
        maxAttendees: data.maxAttendees,
        status: 'SCHEDULED',
      },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            nameAr: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      session: {
        id: liveSession.id,
        title: liveSession.title,
        description: liveSession.description,
        scheduledAt: liveSession.scheduledAt.toISOString(),
        duration: liveSession.duration,
        status: liveSession.status,
        tier: liveSession.tier,
        maxAttendees: liveSession.maxAttendees,
        channelName: liveSession.channel.name,
        createdAt: liveSession.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error creating live session:', error);
    return NextResponse.json(
      { error: 'Failed to create live session' },
      { status: 500 }
    );
  }
}

// PUT /api/creator/live-sessions - Update session
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'CREATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, title, description, scheduledAt, duration, tier, maxAttendees, status: newStatus } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Verify ownership
    const existingSession = await prisma.liveSession.findFirst({
      where: {
        id: sessionId,
        channel: {
          creatorId: session.user.id
        }
      }
    });

    if (!existingSession) {
      return NextResponse.json({ error: 'Session not found or access denied' }, { status: 404 });
    }

    // Can't edit live or ended sessions
    if (existingSession.status === 'LIVE' || existingSession.status === 'ENDED') {
      return NextResponse.json(
        { error: 'Cannot edit live or ended sessions' },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (scheduledAt !== undefined) {
      const newSchedule = new Date(scheduledAt);
      if (newSchedule <= new Date()) {
        return NextResponse.json(
          { error: 'Scheduled time must be in the future' },
          { status: 400 }
        );
      }
      updateData.scheduledAt = newSchedule;
    }
    if (duration !== undefined) {
      if (duration < 15 || duration > 480) {
        return NextResponse.json(
          { error: 'Duration must be between 15 minutes and 8 hours' },
          { status: 400 }
        );
      }
      updateData.duration = duration;
    }
    if (tier !== undefined) updateData.tier = tier;
    if (maxAttendees !== undefined) updateData.maxAttendees = maxAttendees;

    // Handle status changes
    if (newStatus !== undefined) {
      if (newStatus === 'LIVE') {
        updateData.status = 'LIVE';
        updateData.actualStartAt = new Date();
      } else if (newStatus === 'ENDED') {
        updateData.status = 'ENDED';
        updateData.actualEndAt = new Date();
      } else if (newStatus === 'CANCELLED') {
        updateData.status = 'CANCELLED';
      }
    }

    // Update session
    const updatedSession = await prisma.liveSession.update({
      where: { id: sessionId },
      data: updateData,
      include: {
        channel: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Session updated successfully',
      session: updatedSession
    });
  } catch (error) {
    console.error('Error updating live session:', error);
    return NextResponse.json(
      { error: 'Failed to update live session' },
      { status: 500 }
    );
  }
}

// DELETE /api/creator/live-sessions - Cancel session
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'CREATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Verify ownership
    const liveSession = await prisma.liveSession.findFirst({
      where: {
        id: sessionId,
        channel: {
          creatorId: session.user.id
        }
      }
    });

    if (!liveSession) {
      return NextResponse.json({ error: 'Session not found or access denied' }, { status: 404 });
    }

    // Can't delete live sessions
    if (liveSession.status === 'LIVE') {
      return NextResponse.json(
        { error: 'Cannot delete a live session. End it first.' },
        { status: 400 }
      );
    }

    // Mark as cancelled instead of deleting
    await prisma.liveSession.update({
      where: { id: sessionId },
      data: { status: 'CANCELLED' }
    });

    return NextResponse.json({
      success: true,
      message: 'Session cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling live session:', error);
    return NextResponse.json(
      { error: 'Failed to cancel live session' },
      { status: 500 }
    );
  }
}
