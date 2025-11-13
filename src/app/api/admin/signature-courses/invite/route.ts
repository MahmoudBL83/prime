import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const inviteSchema = z.object({
  creatorId: z.string(),
  message: z.string().min(50, 'Message must be at least 50 characters'),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = inviteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues },
        { status: 400 }
      );
    }

    const { creatorId, message } = validation.data;

    // Check if creator exists
    const creator = await prisma.user.findUnique({
      where: { id: creatorId, role: 'CREATOR' },
    });

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // Check if already invited
    const existingInvitation = await prisma.signatureCourseInvitation.findUnique({
      where: { creatorId },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'Creator already has an invitation' },
        { status: 400 }
      );
    }

    // Create invitation
    const invitation = await prisma.signatureCourseInvitation.create({
      data: {
        creatorId,
        invitedBy: session.user.id,
        message,
        status: 'PENDING',
      },
    });

    // TODO: Send email notification to creator

    return NextResponse.json({
      invitation,
      message: 'Invitation sent successfully',
    });
  } catch (error) {
    console.error('Error sending invitation:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    );
  }
}
