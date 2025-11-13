import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { watchTime } = body;

    // Update attendee record with leave time and duration
    const attendee = await prisma.sessionAttendee.updateMany({
      where: {
        sessionId: params.id,
        userId: session.user.id,
        leftAt: null,
      },
      data: {
        leftAt: new Date(),
        duration: watchTime || 0,
      },
    });

    return NextResponse.json({
      message: 'Left session',
    });
  } catch (error) {
    console.error('Error leaving session:', error);
    return NextResponse.json(
      { error: 'Failed to leave session' },
      { status: 500 }
    );
  }
}
