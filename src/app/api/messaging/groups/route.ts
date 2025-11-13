import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const prisma = new PrismaClient();

const createGroupSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    privacy: z.enum(['PUBLIC', 'PRIVATE', 'INVITE_ONLY']).default('PRIVATE'),
    maxMembers: z.number().min(2).max(1000).optional(),
    initialMemberIds: z.array(z.string()).optional(),
});

// GET /api/messaging/groups - Get user's groups
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const privacy = searchParams.get('privacy');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');

        const groups = await prisma.group.findMany({
            where: {
                members: {
                    some: {
                        userId: session.user.id,
                        isActive: true,
                    },
                },
                ...(privacy && { privacy: privacy as any }),
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profileImage: true,
                    },
                },
                members: {
                    include: {
                        user: {
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
                        members: true,
                        channels: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
            skip: offset,
        });

        return NextResponse.json(groups);
    } catch (error) {
        console.error('Error fetching groups:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/messaging/groups - Create new group
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name, description, privacy, maxMembers, initialMemberIds } = createGroupSchema.parse(body);

        // Create conversation first
        const conversation = await prisma.conversation.create({
            data: {
                type: 'GROUP',
                title: name,
                description,
            },
        });

        // Create group
        const group = await prisma.group.create({
            data: {
                conversationId: conversation.id,
                name,
                description,
                privacy,
                maxMembers,
                createdBy: session.user.id,
                members: {
                    create: [
                        {
                            userId: session.user.id,
                            role: 'ADMIN',
                        },
                        ...(initialMemberIds || [])
                            .filter(id => id !== session.user.id)
                            .map(userId => ({
                                userId,
                                role: 'MEMBER' as const,
                            })),
                    ],
                },
                channels: {
                    create: {
                        name: 'general',
                        description: 'General discussion',
                        channelType: 'TEXT',
                        createdBy: session.user.id,
                    },
                },
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profileImage: true,
                    },
                },
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                profileImage: true,
                            },
                        },
                    },
                },
                channels: true,
                _count: {
                    select: {
                        members: true,
                        channels: true,
                    },
                },
            },
        });

        return NextResponse.json(group, { status: 201 });
    } catch (error) {
        console.error('Error creating group:', error);

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