import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// POST /api/users/[id]/block - Block a user
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: targetUserId } = await params;

        if (targetUserId === session.user.id) {
            return NextResponse.json(
                { error: 'You cannot block yourself' },
                { status: 400 }
            );
        }

        // Create or update block record
        const block = await prisma.userBlock.upsert({
            where: {
                blockerId_blockedId: {
                    blockerId: session.user.id,
                    blockedId: targetUserId,
                },
            },
            update: {},
            create: {
                blockerId: session.user.id,
                blockedId: targetUserId,
            },
        });

        // Archive all conversations with this user
        const conversations = await prisma.conversation.findMany({
            where: {
                type: 'DIRECT',
                participants: {
                    every: {
                        OR: [
                            { userId: session.user.id },
                            { userId: targetUserId },
                        ],
                    },
                },
            },
            include: {
                participants: true,
            },
        });

        for (const conv of conversations) {
            const userParticipant = conv.participants.find(
                (p) => p.userId === session.user.id
            );
            if (userParticipant) {
                await prisma.conversationParticipant.update({
                    where: { id: userParticipant.id },
                    data: { isArchived: true, isActive: false },
                });
            }
        }

        return NextResponse.json({ success: true, block });
    } catch (error) {
        console.error('Error blocking user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/users/[id]/block - Unblock a user
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: targetUserId } = await params;

        await prisma.userBlock.delete({
            where: {
                blockerId_blockedId: {
                    blockerId: session.user.id,
                    blockedId: targetUserId,
                },
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error unblocking user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
