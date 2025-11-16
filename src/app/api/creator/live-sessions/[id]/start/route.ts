import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/creator/live-sessions/[id]/start - Start a live session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'CREATOR') {
      return NextResponse.json(
        { error: 'Only creators can start live sessions' },
        { status: 403 }
      );
    }

    const sessionId = id;
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
      },
    });

    if (!liveSession) {
      return NextResponse.json(
        { error: 'Session not found or unauthorized' },
        { status: 404 }
      );
    }

    // Verify session status
    if (liveSession.status === 'LIVE') {
      return NextResponse.json(
        { error: 'Session is already live' },
        { status: 400 }
      );
    }

    if (liveSession.status === 'ENDED') {
      return NextResponse.json(
        { error: 'Cannot start a session that has ended' },
        { status: 400 }
      );
    }

    if (liveSession.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cannot start a cancelled session' },
        { status: 400 }
      );
    }

    // Generate stream credentials (in production, integrate with streaming service)
    const streamKey = `live_${sessionId}_${Date.now()}`;
    const streamUrl = `rtmp://stream.example.com/live/${streamKey}`;

    // Update session to LIVE
    const updatedSession = await prisma.liveSession.update({
      where: { id: sessionId },
      data: {
        status: 'LIVE',
        actualStartAt: new Date(),
        streamUrl: streamUrl,
        streamKey: streamKey,
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
        id: updatedSession.id,
        title: updatedSession.title,
        status: updatedSession.status,
        streamUrl: updatedSession.streamUrl,
        streamKey: updatedSession.streamKey,
        actualStartAt: updatedSession.actualStartAt?.toISOString(),
        channelName: updatedSession.channel.name,
      },
      message: 'Session started successfully',
    });
  } catch (error) {
    console.error('Error starting live session:', error);
    return NextResponse.json(
      { error: 'Failed to start live session' },
      { status: 500 }
    );
  }
}
