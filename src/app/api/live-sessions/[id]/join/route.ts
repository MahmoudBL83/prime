import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    // Check if session is live or scheduled
    const liveSession = await prisma.liveSession.findUnique({
      where: { id: id },
    });

    if (!liveSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (liveSession.status === 'ENDED' || liveSession.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Session is not active' },
        { status: 400 }
      );
    }

    // Check if already joined
    const existing = await prisma.sessionAttendee.findUnique({
      where: {
        sessionId_userId: {
          sessionId: params.id,
          userId: session.user.id,
        },
      },
    });

    if (existing && !existing.leftAt) {
      return NextResponse.json({
        message: 'Already joined',
        attendee: existing,
      });
    }

    // Create or update attendee record
    const attendee = await prisma.sessionAttendee.upsert({
      where: {
        sessionId_userId: {
          sessionId: params.id,
          userId: session.user.id,
        },
      },
      create: {
        sessionId: params.id,
        userId: session.user.id,
        joinedAt: new Date(),
      },
      update: {
        joinedAt: new Date(),
        leftAt: null,
      },
    });

    // Increment view count
    await prisma.liveSession.update({
      where: { id: params.id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      message: 'Joined session',
      attendee,
    });
  } catch (error) {
    console.error('Error joining session:', error);
    return NextResponse.json(
      { error: 'Failed to join session' },
      { status: 500 }
    );
  }
}
