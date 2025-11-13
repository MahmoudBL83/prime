import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/creator/live-sessions/[id]/end - End a live session
export async function POST(
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
        { error: 'Only creators can end live sessions' },
        { status: 403 }
      );
    }

    const sessionId = params.id;
    const creatorId = session.user.id;

    // Verify ownership and session exists
    const liveSession = await prisma.liveSession.findFirst({
      where: {
        id: sessionId,
        channel: {
          creatorId: creatorId,
        },
      },
      include: {
        channel: true,
        attendees: {
          where: {
            leftAt: null, // Still active
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

    // Verify session is currently live
    if (liveSession.status !== 'LIVE') {
      return NextResponse.json(
        { error: 'Session is not currently live' },
        { status: 400 }
      );
    }

    const now = new Date();

    // Mark all active attendees as left
    if (liveSession.attendees.length > 0) {
      await prisma.sessionAttendee.updateMany({
        where: {
          sessionId: sessionId,
          leftAt: null,
        },
        data: {
          leftAt: now,
        },
      });
    }

    // Update session to ENDED
    const updatedSession = await prisma.liveSession.update({
      where: { id: sessionId },
      data: {
        status: 'ENDED',
        actualEndAt: now,
      },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Calculate actual duration
    const actualDuration = updatedSession.actualStartAt && updatedSession.actualEndAt
      ? Math.round((updatedSession.actualEndAt.getTime() - updatedSession.actualStartAt.getTime()) / 60000)
      : 0;

    return NextResponse.json({
      success: true,
      session: {
        id: updatedSession.id,
        title: updatedSession.title,
        status: updatedSession.status,
        actualStartAt: updatedSession.actualStartAt?.toISOString(),
        actualEndAt: updatedSession.actualEndAt?.toISOString(),
        actualDuration: actualDuration, // in minutes
        viewCount: updatedSession.viewCount,
        channelName: updatedSession.channel.name,
      },
      message: 'Session ended successfully',
    });
  } catch (error) {
    console.error('Error ending live session:', error);
    return NextResponse.json(
      { error: 'Failed to end live session' },
      { status: 500 }
    );
  }
}
