import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'CREATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get session and verify ownership
    const liveSession = await prisma.liveSession.findUnique({
      where: { id: params.id },
      include: {
        channel: true,
      },
    });

    if (!liveSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (liveSession.channel.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get current active viewers
    const currentViewers = await prisma.sessionAttendee.count({
      where: {
        sessionId: params.id,
        leftAt: null,
      },
    });

    // Get total unique viewers
    const totalViewers = await prisma.sessionAttendee.count({
      where: {
        sessionId: params.id,
      },
    });

    // Get average watch time
    const attendees = await prisma.sessionAttendee.findMany({
      where: {
        sessionId: params.id,
        duration: {
          not: null,
        },
      },
      select: {
        duration: true,
      },
    });

    const avgWatchTime = attendees.length > 0
      ? Math.round(
          attendees.reduce((sum, a) => sum + (a.duration || 0), 0) / attendees.length
        )
      : 0;

    return NextResponse.json({
      currentViewers,
      totalViewers,
      avgWatchTime,
      peakViewers: liveSession.viewCount,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
