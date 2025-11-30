import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

const ACTIVE_MATCH_STATUSES = ['accepted', 'ACCEPTED', 'ACTIVE'];

const conversationInclude = {
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
                },
            },
        },
    },
    _count: {
        select: {
            messages: true,
        },
    },
};

// GET /api/messaging/study-buddy-integration - Get or create conversation for a study buddy match
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const matchId = searchParams.get('matchId');

        if (!matchId) {
            return NextResponse.json({ error: 'Match ID is required' }, { status: 400 });
        }

        // Get the study buddy match
        const match = await prisma.studyBuddyMatch.findUnique({
            where: { id: matchId },
        });

        if (!match) {
            return NextResponse.json({ error: 'Match not found' }, { status: 404 });
        }

        // Check if user is part of this match
        if (match.user1Id !== session.user.id && match.user2Id !== session.user.id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Check if match is accepted
        if (!ACTIVE_MATCH_STATUSES.includes(match.status)) {
            return NextResponse.json({ error: 'Match not accepted yet' }, { status: 400 });
        }

        // Get user data for both participants
        const [user1, user2] = await Promise.all([
            prisma.user.findUnique({
                where: { id: match.user1Id },
                select: { id: true, name: true, email: true, profileImage: true },
            }),
            prisma.user.findUnique({
                where: { id: match.user2Id },
                select: { id: true, name: true, email: true, profileImage: true },
            }),
        ]);

        if (!user1 || !user2) {
            return NextResponse.json({ error: 'User data not found' }, { status: 404 });
        }

        // Check if conversation already exists
        const existingConversation = await prisma.conversation.findFirst({
            where: {
                type: 'DIRECT',
                AND: [
                    {
                        participants: {
                            some: {
                                userId: match.user1Id,
                                isActive: true,
                            },
                        },
                    },
                    {
                        participants: {
                            some: {
                                userId: match.user2Id,
                                isActive: true,
                            },
                        },
                    },
                ],
            },
            include: conversationInclude,
        });

        if (existingConversation) {
            return NextResponse.json(existingConversation);
        }

        // Get the other user
        const otherUserId = match.user1Id === session.user.id ? match.user2Id : match.user1Id;
        const otherUser = match.user1Id === session.user.id ? user2 : user1;

        // Create conversation
        const conversation = await prisma.conversation.create({
            data: {
                type: 'DIRECT',
                title: `Chat with ${otherUser.name}`,
                participants: {
                    create: [
                        {
                            userId: session.user.id,
                            role: 'MEMBER',
                        },
                        {
                            userId: otherUserId,
                            role: 'MEMBER',
                        },
                    ],
                },
            },
            include: conversationInclude,
        });

        // Create a system message to indicate this is a study buddy match
        await prisma.message.create({
            data: {
                conversationId: conversation.id,
                senderId: session.user.id, // System message from current user
                content: `🎉 You matched with ${otherUser.name}! Start your study journey together.`,
                messageType: 'SYSTEM',
            },
        });

        return NextResponse.json(conversation);
    } catch (error) {
        console.error('Error creating study buddy conversation:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/messaging/study-buddy-integration - Create conversation for study buddy match
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { matchId } = body;

        if (!matchId) {
            return NextResponse.json({ error: 'Match ID is required' }, { status: 400 });
        }

        // Get the study buddy match
        const match = await prisma.studyBuddyMatch.findUnique({
            where: { id: matchId },
        });

        if (!match) {
            return NextResponse.json({ error: 'Match not found' }, { status: 404 });
        }

        // Check if user is part of this match
        if (match.user1Id !== session.user.id && match.user2Id !== session.user.id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Check if match is accepted
        if (!ACTIVE_MATCH_STATUSES.includes(match.status)) {
            return NextResponse.json({ error: 'Match not accepted yet' }, { status: 400 });
        }

        // Get user data for both participants
        const [user1, user2] = await Promise.all([
            prisma.user.findUnique({
                where: { id: match.user1Id },
                select: { id: true, name: true, email: true, profileImage: true },
            }),
            prisma.user.findUnique({
                where: { id: match.user2Id },
                select: { id: true, name: true, email: true, profileImage: true },
            }),
        ]);

        if (!user1 || !user2) {
            return NextResponse.json({ error: 'User data not found' }, { status: 404 });
        }

        // Get the other user
        const otherUserId = match.user1Id === session.user.id ? match.user2Id : match.user1Id;
        const otherUser = match.user1Id === session.user.id ? user2 : user1;

        // Create conversation
        const conversation = await prisma.conversation.create({
            data: {
                type: 'DIRECT',
                title: `Chat with ${otherUser.name}`,
                participants: {
                    create: [
                        {
                            userId: session.user.id,
                            role: 'MEMBER',
                        },
                        {
                            userId: otherUserId,
                            role: 'MEMBER',
                        },
                    ],
                },
            },
            include: conversationInclude,
        });

        // Create a system message to indicate this is a study buddy match
        await prisma.message.create({
            data: {
                conversationId: conversation.id,
                senderId: session.user.id, // System message from current user
                content: `🎉 You matched with ${otherUser.name}! Start your study journey together.`,
                messageType: 'SYSTEM',
            },
        });

        return NextResponse.json(conversation, { status: 201 });
    } catch (error) {
        console.error('Error creating study buddy conversation:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
