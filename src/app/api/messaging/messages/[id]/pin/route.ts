import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// PATCH /api/messaging/messages/[id]/pin - Pin/unpin a message
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
        const { isPinned } = await req.json();

        // Check if message exists and user is participant
        const message = await prisma.message.findUnique({
            where: { id },
            include: {
                conversation: {
                    include: {
                        participants: true,
                    },
                },
            },
        });

        if (!message) {
            return NextResponse.json({ error: 'Message not found' }, { status: 404 });
        }

        const isParticipant = message.conversation.participants.some(
            (p) => p.userId === session.user.id && p.isActive
        );

        if (!isParticipant) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Update message
        const updatedMessage = await prisma.message.update({
            where: { id },
            data: { isPinned },
        });

        return NextResponse.json(updatedMessage);
    } catch (error) {
        console.error('Error updating message pin status:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
