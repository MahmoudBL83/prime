import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();

    // Get live streams
    const liveStreams = await prisma.liveSession.findMany({
      where: {
        status: 'LIVE',
      },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            coverImage: true,
          },
        },
      },
      orderBy: {
        viewCount: 'desc',
      },
    });

    // Get attendee counts for live streams
    const liveStreamAttendees = await Promise.all(
      liveStreams.map(async (stream) => {
        const attendeeCount = await prisma.sessionAttendee.count({
          where: {
            sessionId: stream.id,
            leftAt: null, // Currently active attendees
          },
        });
        return { ...stream, attendeeCount };
      })
    );

    // Get upcoming streams (within next 7 days)
    const upcomingStreams = await prisma.liveSession.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: {
          gte: now,
          lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            coverImage: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
      take: 20,
    });

    // Transform data
    const transformedLive = liveStreamAttendees.map(stream => ({
      ...stream,
      // attendeeCount is already included from the previous step
    }));

    return NextResponse.json({
      liveStreams: transformedLive,
      upcomingStreams,
    });
  } catch (error) {
    console.error('Error fetching live streams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch streams' },
      { status: 500 }
    );
  }
}
