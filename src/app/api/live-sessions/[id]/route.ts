import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    const { id } = await params;
    const liveSession = await prisma.liveSession.findUnique({
      where: { id: id },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            coverImage: true,
          },
        },
        attendees: {
          select: {
            id: true,
            userId: true,
            joinedAt: true,
          },
        },
      },
    });

    if (!liveSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      session: liveSession,
    });
  } catch (error) {
    console.error('Error fetching live session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}
