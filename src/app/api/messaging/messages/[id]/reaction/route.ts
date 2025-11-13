import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// POST /api/messaging/messages/[id]/reaction - Add/remove/update reaction
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { emoji } = await req.json();

        // Check if message exists and user is participant
        const message = await prisma.message.findUnique({
            where: { id },
            include: {
                conversation: {
                    include: {
                        participants: true,
                    },
                },
                reactions: true,
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

        // Check if user already has a reaction
        const existingReaction = message.reactions.find(
            (r) => r.userId === session.user.id
        );

        if (existingReaction) {
            if (existingReaction.emoji === emoji) {
                // Remove reaction if same emoji
                await prisma.messageReaction.delete({
                    where: { id: existingReaction.id },
                });
                return NextResponse.json({ action: 'removed' });
            } else {
                // Update reaction
                const updatedReaction = await prisma.messageReaction.update({
                    where: { id: existingReaction.id },
                    data: { emoji },
                });
                return NextResponse.json({ action: 'updated', reaction: updatedReaction });
            }
        } else {
            // Add new reaction
            const newReaction = await prisma.messageReaction.create({
                data: {
                    messageId: id,
                    userId: session.user.id,
                    emoji,
                },
            });
            return NextResponse.json({ action: 'added', reaction: newReaction });
        }
    } catch (error) {
        console.error('Error managing reaction:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
