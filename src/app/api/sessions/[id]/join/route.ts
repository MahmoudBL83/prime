import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/sessions/[id]/join
 * Member joins a live session
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Get authenticated session
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized - Please sign in' },
                { status: 401 }
            );
        }

        const { id } = await params;
        const sessionId = id;
        const userId = session.user.id;

        // Fetch the live session with channel and attendees
        const liveSession = await prisma.liveSession.findUnique({
            where: { id: sessionId },
            include: {
                channel: {
                    include: {
                        subscriptions: {
                            where: {
                                userId: userId,
                                status: 'ACTIVE'
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        attendees: {
                            where: {
                                leftAt: null // Currently active attendees
                            }
                        }
                    }
                }
            }
        });

        // Check if session exists
        if (!liveSession) {
            return NextResponse.json(
                { error: 'Session not found' },
                { status: 404 }
            );
        }

        // Check if session is live
        if (liveSession.status !== 'LIVE') {
            return NextResponse.json(
                { 
                    error: 'Session is not currently live',
                    status: liveSession.status 
                },
                { status: 400 }
            );
        }

        // Check tier access
        if (liveSession.tier !== 'ALL') {
            const hasAccess = liveSession.channel.subscriptions.length > 0;
            
            if (!hasAccess) {
                return NextResponse.json(
                    { 
                        error: 'You need an active subscription to join this session',
                        requiredTier: liveSession.tier 
                    },
                    { status: 403 }
                );
            }

            // Check if user's tier matches session tier
            const userSubscription = liveSession.channel.subscriptions[0];
            const tierHierarchy = { 'BRONZE': 1, 'SILVER': 2, 'GOLD': 3 };
            const userTierLevel = tierHierarchy[userSubscription.tier as keyof typeof tierHierarchy] || 0;
            const sessionTierLevel = tierHierarchy[liveSession.tier as keyof typeof tierHierarchy] || 0;

            if (userTierLevel < sessionTierLevel) {
                return NextResponse.json(
                    { 
                        error: `This session requires ${liveSession.tier} tier or higher`,
                        userTier: userSubscription.tier,
                        requiredTier: liveSession.tier
                    },
                    { status: 403 }
                );
            }
        }

        // Check max attendees limit
        if (liveSession.maxAttendees) {
            const currentAttendees = liveSession._count.attendees;
            
            if (currentAttendees >= liveSession.maxAttendees) {
                return NextResponse.json(
                    { 
                        error: 'Session is full',
                        maxAttendees: liveSession.maxAttendees,
                        currentAttendees
                    },
                    { status: 400 }
                );
            }
        }

        // Check if user is already attending
        const existingAttendee = await prisma.sessionAttendee.findFirst({
            where: {
                sessionId,
                userId,
                leftAt: null // Still in session
            }
        });

        if (existingAttendee) {
            return NextResponse.json(
                { 
                    message: 'Already attending this session',
                    attendee: existingAttendee,
                    session: {
                        id: liveSession.id,
                        title: liveSession.title,
                        streamUrl: liveSession.streamUrl,
                        actualStartAt: liveSession.actualStartAt
                    }
                },
                { status: 200 }
            );
        }

        // Create attendee record
        const attendee = await prisma.sessionAttendee.create({
            data: {
                sessionId,
                userId,
                joinedAt: new Date()
            }
        });

        // Increment view count
        await prisma.liveSession.update({
            where: { id: sessionId },
            data: {
                viewCount: {
                    increment: 1
                }
            }
        });

        return NextResponse.json(
            {
                message: 'Successfully joined session',
                attendee,
                session: {
                    id: liveSession.id,
                    title: liveSession.title,
                    titleAr: liveSession.titleAr,
                    description: liveSession.description,
                    descriptionAr: liveSession.descriptionAr,
                    streamUrl: liveSession.streamUrl,
                    actualStartAt: liveSession.actualStartAt,
                    duration: liveSession.duration,
                    tier: liveSession.tier
                }
            },
            { status: 201 }
        );

    } catch (error) {
        console.error('Error joining session:', error);
        return NextResponse.json(
            { error: 'Failed to join session' },
            { status: 500 }
        );
    }
}
