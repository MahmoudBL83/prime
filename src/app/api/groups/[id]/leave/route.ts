import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await context.params; // conversationId

        // Find the group associated with this conversation
        const group = await prisma.group.findUnique({
            where: { conversationId: id },
            select: { id: true }
        });

        await prisma.$transaction(async (tx) => {
            // Remove from ConversationParticipant
            await tx.conversationParticipant.updateMany({
                where: {
                    conversationId: id,
                    userId: session.user.id,
                    isActive: true
                },
                data: {
                    isActive: false
                }
            });

            if (group) {
                // Remove from GroupMember
                await tx.groupMember.updateMany({
                    where: {
                        groupId: group.id,
                        userId: session.user.id,
                        isActive: true
                    },
                    data: {
                        isActive: false
                    }
                });
            }

            // Optional: Create a system message
            const user = await tx.user.findUnique({
                where: { id: session.user.id },
                select: { name: true }
            });

            await tx.message.create({
                data: {
                    conversationId: id,
                    senderId: session.user.id,
                    content: `${user?.name || 'A user'} left the group`,
                    messageType: 'SYSTEM'
                }
            });
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error leaving group:', error);
        return NextResponse.json({ error: error.message || 'Failed to leave group' }, { status: 500 });
    }
}
