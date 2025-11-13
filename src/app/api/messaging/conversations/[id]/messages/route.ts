import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const createMessageSchema = z.object({
    content: z.string().min(1).max(5000),
    messageType: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'FILE', 'VOICE_NOTE', 'SYSTEM']).default('TEXT'),
    replyToId: z.string().optional(),
});

// GET /api/messaging/conversations/[id]/messages - Get messages for a conversation
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const before = searchParams.get('before');

        // Check if user is participant in conversation
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

        const messages = await prisma.message.findMany({
            where: {
                conversationId: id,
                ...(before && { createdAt: { lt: new Date(before) } }),
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        arabicName: true,
                        profileImage: true,
                    },
                },
                replyTo: {
                    include: {
                        sender: {
                            select: {
                                id: true,
                                name: true,
                                arabicName: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        // Transform messages to include timestamp field
        const transformedMessages = messages.map(message => ({
            ...message,
            timestamp: message.createdAt.toISOString(),
        })).reverse();

        return NextResponse.json({ success: true, data: transformedMessages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/messaging/conversations/[id]/messages - Send a message
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
        const body = await req.json();
        const { content, messageType, replyToId } = createMessageSchema.parse(body);

        // Check if user is participant in conversation
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

        // Create message
        const message = await prisma.message.create({
            data: {
                conversationId: id,
                senderId: session.user.id,
                content,
                messageType,
                replyToId,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profileImage: true,
                    },
                },
                replyTo: {
                    include: {
                        sender: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
                attachments: true,
                reactions: true,
            },
        });

        // Update conversation's updatedAt timestamp
        await prisma.conversation.update({
            where: {
                id: id,
            },
            data: {
                updatedAt: new Date(),
            },
        });

        // Transform message to include timestamp field
        const transformedMessage = {
            ...message,
            timestamp: message.createdAt.toISOString(),
        };

        return NextResponse.json(transformedMessage, { status: 201 });
    } catch (error) {
        console.error('Error sending message:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input', details: error.issues },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}