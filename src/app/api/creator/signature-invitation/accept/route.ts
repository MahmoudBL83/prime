import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'CREATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if invitation exists
    const invitation = await prisma.signatureCourseInvitation.findUnique({
      where: { creatorId: session.user.id },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'No invitation found' }, { status: 404 });
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Invitation already responded to' },
        { status: 400 }
      );
    }

    // Update invitation status
    const updatedInvitation = await prisma.signatureCourseInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    });

    return NextResponse.json({
      invitation: updatedInvitation,
      message: 'Invitation accepted successfully',
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}
