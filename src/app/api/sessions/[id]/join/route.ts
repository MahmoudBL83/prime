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
        
        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized - Please sign in' },
                { status: 401 }
            );
        }

        const { id } = await params;
        const sessionId = id;
        const userId = (session.user as any).id;

        // Fetch the live session with channel and attendees
        const liveSession = await prisma.liveSession.findUnique({
            where: { id: sessionId },
            include: {
                channel: {
                    include: {
                        channelSubscriptions: {
                            where: {
                                userId: userId,
                                status: 'ACTIVE'
                            },
                            include: {
                                tier: true
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

        // Check tier access - single subscription model
        if (liveSession.tier !== 'ALL') {
            const hasAccess = liveSession.channel.channelSubscriptions.length > 0;
            
            if (!hasAccess) {
                return NextResponse.json(
                    { 
                        error: 'You need an active subscription to join this session'
                    },
                    { status: 403 }
                );
            }
            // Single subscription model - all subscribers have full access to all sessions
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
