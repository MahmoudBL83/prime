import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// PATCH /api/messaging/conversations/[id]/archive - Archive/unarchive conversation
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { isArchived } = await req.json();

        // Check if user is participant
        const participant = await prisma.conversationParticipant.findFirst({
            where: {
                conversationId: id,
                userId: session.user.id,
                isActive: true,
            },
        });

        if (!participant) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Update participant's archived status
        const updatedParticipant = await prisma.conversationParticipant.update({
            where: { id: participant.id },
            data: { isArchived },
        });

        return NextResponse.json(updatedParticipant);
    } catch (error) {
        console.error('Error updating archive status:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
