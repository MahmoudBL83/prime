import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const createConversationSchema = z.object({
    type: z.enum(['DIRECT', 'GROUP']),
    title: z.string().optional(),
    description: z.string().optional(),
    participantIds: z.array(z.string()).min(1),
});

// GET /api/messaging/conversations - Get user's conversations
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');

        const conversations = await prisma.conversation.findMany({
            where: {
                participants: {
                    some: {
                        userId: session.user.id,
                        isActive: true,
                    },
                },
                ...(type && { type: type as any }),
            },
            include: {
                participants: {
                    where: {
                        isActive: true,
                    },
                    select: {
                        lastReadAt: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                profileImage: true,
                                arabicName: true,
                            },
                        },
                    },
                },
                messages: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 1,
                    include: {
                        sender: {
                            select: {
                                id: true,
                                name: true,
                                profileImage: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        messages: true,
                    },
                },
            },
            orderBy: {
                updatedAt: 'desc',
            },
            take: limit,
            skip: offset,
        });

        // Transform the response to include lastMessage with proper timestamp
        const transformedConversations = conversations.map(conversation => ({
            ...conversation,
            lastMessage: conversation.messages[0] ? {
                ...conversation.messages[0],
                timestamp: conversation.messages[0].createdAt.toISOString(),
                createdAt: conversation.messages[0].createdAt.toISOString(),
            } : null,
            messages: undefined, // Remove messages array from response, keep only lastMessage
        }));

        console.log('Returning conversations:', transformedConversations.length);
        return NextResponse.json(transformedConversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/messaging/conversations - Create new conversation
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            console.error('No session found for conversation creation');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        console.log('Received conversation creation request:', { body, sessionUserId: session.user.id });
        
        const { type, title, description, participantIds } = createConversationSchema.parse(body);
        console.log('Parsed conversation data:', { type, participantIds });

        // Ensure current user is included in participantIds if not already
        const allParticipantIds = participantIds.includes(session.user.id) 
            ? participantIds 
            : [session.user.id, ...participantIds];

        // For direct messages, ensure only 2 participants total
        if (type === 'DIRECT' && allParticipantIds.length !== 2) {
            console.error('Invalid participant count for DIRECT conversation:', allParticipantIds.length);
            return NextResponse.json(
                { error: 'Direct conversations must have exactly 2 participants' },
                { status: 400 }
            );
        }

        // Check if conversation already exists for direct messages
        if (type === 'DIRECT') {
            console.log('Checking for existing DIRECT conversation with participants:', allParticipantIds);
            
            const existingConversation = await prisma.conversation.findFirst({
                where: {
                    type: 'DIRECT',
                    AND: [
                        {
                            participants: {
                                some: {
                                    userId: allParticipantIds[0],
                                    isActive: true,
                                },
                            },
                        },
                        {
                            participants: {
                                some: {
                                    userId: allParticipantIds[1],
                                    isActive: true,
                                },
                            },
                        },
                    ],
                },
                include: {
                    participants: {
                        where: {
                            isActive: true,
                        },
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    profileImage: true,
                                    arabicName: true,
                                },
                            },
                        },
                    },
                    messages: {
                        orderBy: {
                            createdAt: 'desc',
                        },
                        take: 1,
                        include: {
                            sender: {
                                select: {
                                    id: true,
                                    name: true,
                                    profileImage: true,
                                },
                            },
                        },
                    },
                    _count: {
                        select: {
                            messages: true,
                        },
                    },
                },
            });

            if (existingConversation) {
                console.log('Found existing conversation:', existingConversation.id);
                // Transform the response to match expected format
                const transformedConversation = {
                    ...existingConversation,
                    lastMessage: existingConversation.messages[0] ? {
                        ...existingConversation.messages[0],
                        timestamp: existingConversation.messages[0].createdAt.toISOString(),
                        createdAt: existingConversation.messages[0].createdAt.toISOString(),
                    } : null,
                    messages: undefined,
                };
                return NextResponse.json(transformedConversation);
            } else {
                console.log('No existing conversation found, creating new one');
            }
        }

        // Create conversation
        console.log('Creating new conversation with participants:', allParticipantIds);
        console.log('Current user ID from session:', session.user.id);
        
        const conversation = await prisma.conversation.create({
            data: {
                type,
                title,
                description,
                participants: {
                    create: allParticipantIds.map((userId, index) => ({
                        userId,
                        role: userId === session.user.id ? 'ADMIN' : 'MEMBER' as const,
                    })),
                },
            },
            include: {
                participants: {
                    where: {
                        isActive: true,
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                profileImage: true,
                                arabicName: true,
                            },
                        },
                    },
                },
                messages: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 1,
                    include: {
                        sender: {
                            select: {
                                id: true,
                                name: true,
                                profileImage: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        messages: true,
                    },
                },
            },
        });

        console.log('Successfully created conversation:', conversation.id);
        
        // Transform the response to match expected format
        const transformedConversation = {
            ...conversation,
            lastMessage: conversation.messages[0] ? {
                ...conversation.messages[0],
                timestamp: conversation.messages[0].createdAt.toISOString(),
                createdAt: conversation.messages[0].createdAt.toISOString(),
            } : null,
            messages: undefined,
        };
        
        return NextResponse.json(transformedConversation, { status: 201 });
    } catch (error) {
        console.error('Error creating conversation:', error);

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
