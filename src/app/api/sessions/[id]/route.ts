import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/sessions/[id]
 * Get live session details for members
 */
export async function GET(
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

        // Fetch the live session
        const liveSession = await prisma.liveSession.findUnique({
            where: { id: sessionId },
            include: {
                channel: {
                    include: {
                        creator: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        profileImage: true
                                    }
                                }
                            }
                        },
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

        if (!liveSession) {
            return NextResponse.json(
                { error: 'Session not found' },
                { status: 404 }
            );
        }

        // Check if user is currently attending
        const userAttendance = await prisma.sessionAttendee.findFirst({
            where: {
                sessionId,
                userId,
                leftAt: null
            }
        });

        // Check access based on tier
        let hasAccess = liveSession.tier === 'ALL';
        let userTier = null;

        if (!hasAccess && liveSession.channel.channelSubscriptions.length > 0) {
            const subscription = liveSession.channel.channelSubscriptions[0];
            userTier = subscription.tier.name;
            
            const tierHierarchy = { 'BRONZE': 1, 'SILVER': 2, 'GOLD': 3 };
            const userTierLevel = tierHierarchy[userTier as keyof typeof tierHierarchy] || 0;
            const sessionTierLevel = tierHierarchy[liveSession.tier as keyof typeof tierHierarchy] || 0;
            
            hasAccess = userTierLevel >= sessionTierLevel;
        }

        // Calculate time elapsed since start
        let elapsedSeconds = 0;
        if (liveSession.actualStartAt) {
            elapsedSeconds = Math.floor((Date.now() - new Date(liveSession.actualStartAt).getTime()) / 1000);
        }

        return NextResponse.json(
            {
                session: {
                    id: liveSession.id,
                    title: liveSession.title,
                    titleAr: liveSession.titleAr,
                    description: liveSession.description,
                    descriptionAr: liveSession.descriptionAr,
                    scheduledAt: liveSession.scheduledAt,
                    duration: liveSession.duration,
                    status: liveSession.status,
                    tier: liveSession.tier,
                    maxAttendees: liveSession.maxAttendees,
                    streamUrl: hasAccess ? liveSession.streamUrl : null,
                    actualStartAt: liveSession.actualStartAt,
                    actualEndAt: liveSession.actualEndAt,
                    viewCount: liveSession.viewCount,
                    activeAttendees: liveSession._count.attendees,
                    elapsedSeconds,
                    creator: {
                        id: liveSession.channel.creator.user.id,
                        name: liveSession.channel.creator.user.name,
                        profileImage: liveSession.channel.creator.user.profileImage,
                        channelName: liveSession.channel.name
                    }
                },
                userAccess: {
                    hasAccess,
                    userTier,
                    requiredTier: liveSession.tier,
                    isAttending: !!userAttendance,
                    attendeeId: userAttendance?.id
                }
            },
            { status: 200 }
        );

    } catch (error) {
        console.error('Error fetching session:', error);
        return NextResponse.json(
            { error: 'Failed to fetch session' },
            { status: 500 }
        );
    }
}
