import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const updateSessionSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  duration: z.number().min(15).max(480).optional(),
  tier: z.enum(['BRONZE', 'SILVER', 'GOLD']).optional(),
  maxAttendees: z.number().min(1).max(10000).optional(),
  status: z.enum(['SCHEDULED', 'CANCELLED']).optional(),
});

const startSessionSchema = z.object({
  streamUrl: z.string().url().optional(),
  streamKey: z.string().optional(),
});

// GET /api/creator/live-sessions/[id] - Get single session
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const sessionId = params.id;
    const creatorId = session.user.id;

    // Fetch session with ownership verification
    const liveSession = await prisma.liveSession.findFirst({
      where: {
        id: sessionId,
        channel: {
          creatorId: creatorId,
        },
      },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            creatorId: true,
          },
        },
        attendees: {
          select: {
            id: true,
            userId: true,
            joinedAt: true,
            leftAt: true,
            duration: true,
          },
          orderBy: {
            joinedAt: 'desc',
          },
        },
      },
    });

    if (!liveSession) {
      return NextResponse.json(
        { error: 'Session not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      session: {
        id: liveSession.id,
        title: liveSession.title,
        titleAr: liveSession.titleAr,
        description: liveSession.description,
        descriptionAr: liveSession.descriptionAr,
        scheduledAt: liveSession.scheduledAt.toISOString(),
        duration: liveSession.duration,
        status: liveSession.status,
        tier: liveSession.tier,
        maxAttendees: liveSession.maxAttendees,
        streamUrl: liveSession.streamUrl,
        streamKey: liveSession.streamKey,
        recordingUrl: liveSession.recordingUrl,
        actualStartAt: liveSession.actualStartAt?.toISOString(),
        actualEndAt: liveSession.actualEndAt?.toISOString(),
        viewCount: liveSession.viewCount,
        channelName: liveSession.channel.name,
        channelNameAr: liveSession.channel.nameAr,
        attendees: liveSession.attendees.map((a) => ({
          id: a.id,
          userId: a.userId,
          joinedAt: a.joinedAt.toISOString(),
          leftAt: a.leftAt?.toISOString(),
          duration: a.duration,
        })),
        attendeeCount: liveSession.attendees.length,
        activeAttendees: liveSession.attendees.filter((a) => !a.leftAt).length,
        createdAt: liveSession.createdAt.toISOString(),
        updatedAt: liveSession.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching live session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live session' },
      { status: 500 }
    );
  }
}

// PATCH /api/creator/live-sessions/[id] - Update or cancel session
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: 'Only creators can update live sessions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = updateSessionSchema.safeParse(body);

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
    const sessionId = params.id;
    const creatorId = session.user.id;

    // Verify ownership
    const existingSession = await prisma.liveSession.findFirst({
      where: {
        id: sessionId,
        channel: {
          creatorId: creatorId,
        },
      },
    });

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found or unauthorized' },
        { status: 404 }
      );
    }

    // Prevent updating sessions that are already live or ended
    if (existingSession.status === 'LIVE') {
      return NextResponse.json(
        { error: 'Cannot update a session that is currently live' },
        { status: 400 }
      );
    }

    if (existingSession.status === 'ENDED') {
      return NextResponse.json(
        { error: 'Cannot update a session that has ended' },
        { status: 400 }
      );
    }

    // Validate new scheduled time if provided
    if (data.scheduledAt) {
      const newScheduledAt = new Date(data.scheduledAt);
      if (newScheduledAt <= new Date()) {
        return NextResponse.json(
          { error: 'Scheduled time must be in the future' },
          { status: 400 }
        );
      }
    }

    // Update session
    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.scheduledAt) updateData.scheduledAt = new Date(data.scheduledAt);
    if (data.duration) updateData.duration = data.duration;
    if (data.tier) updateData.tier = data.tier;
    if (data.maxAttendees !== undefined) updateData.maxAttendees = data.maxAttendees;
    if (data.status) updateData.status = data.status;

    const updatedSession = await prisma.liveSession.update({
      where: { id: sessionId },
      data: updateData,
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
        id: updatedSession.id,
        title: updatedSession.title,
        description: updatedSession.description,
        scheduledAt: updatedSession.scheduledAt.toISOString(),
        duration: updatedSession.duration,
        status: updatedSession.status,
        tier: updatedSession.tier,
        maxAttendees: updatedSession.maxAttendees,
        channelName: updatedSession.channel.name,
        updatedAt: updatedSession.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error updating live session:', error);
    return NextResponse.json(
      { error: 'Failed to update live session' },
      { status: 500 }
    );
  }
}

// DELETE /api/creator/live-sessions/[id] - Delete session
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: 'Only creators can delete live sessions' },
        { status: 403 }
      );
    }

    const sessionId = params.id;
    const creatorId = session.user.id;

    // Verify ownership
    const existingSession = await prisma.liveSession.findFirst({
      where: {
        id: sessionId,
        channel: {
          creatorId: creatorId,
        },
      },
    });

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found or unauthorized' },
        { status: 404 }
      );
    }

    // Prevent deleting sessions that are currently live
    if (existingSession.status === 'LIVE') {
      return NextResponse.json(
        { error: 'Cannot delete a session that is currently live. Please end it first.' },
        { status: 400 }
      );
    }

    // Delete session (cascade will delete attendees)
    await prisma.liveSession.delete({
      where: { id: sessionId },
    });

    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting live session:', error);
    return NextResponse.json(
      { error: 'Failed to delete live session' },
      { status: 500 }
    );
  }
}
