/**
 * Session Analytics API
 * 
 * GET /api/creator/live-sessions/[id]/analytics
 * 
 * Returns comprehensive analytics for a specific live session including:
 * - Total views and unique viewers
 * - Average watch duration
 * - Peak concurrent viewers
 * - Viewer retention over time
 * - Engagement metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const sessionId = params.id;

        // 1. Fetch the session with channel info
        const liveSession = await prisma.liveSession.findUnique({
            where: { id: sessionId },
            include: {
                channel: {
                    include: {
                        creator: {
                            include: {
                                user: true
                            }
                        }
                    }
                },
                attendees: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                profileImage: true
                            }
                        }
                    },
                    orderBy: {
                        joinedAt: 'asc'
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

        // 2. Verify ownership
        if (liveSession.channel.creator.user.id !== session.user.id) {
            return NextResponse.json(
                { error: 'You do not have permission to view this session analytics' },
                { status: 403 }
            );
        }

        // 3. Calculate analytics metrics
        const attendees = liveSession.attendees;
        const totalAttendees = attendees.length;
        const uniqueViewers = new Set(attendees.map(a => a.userId)).size;

        // Calculate watch durations
        const watchDurations = attendees
            .filter(a => a.duration !== null)
            .map(a => a.duration!);

        const totalWatchTime = watchDurations.reduce((sum, d) => sum + d, 0);
        const averageWatchDuration = watchDurations.length > 0 
            ? Math.round(totalWatchTime / watchDurations.length)
            : 0;

        // Find peak concurrent viewers
        let peakConcurrent = 0;
        if (attendees.length > 0) {
            // Create timeline of join/leave events
            const events: Array<{ time: Date, type: 'join' | 'leave' }> = [];
            
            attendees.forEach(attendee => {
                events.push({ time: attendee.joinedAt, type: 'join' });
                if (attendee.leftAt) {
                    events.push({ time: attendee.leftAt, type: 'leave' });
                }
            });

            // Sort events by time
            events.sort((a, b) => a.time.getTime() - b.time.getTime());

            // Calculate concurrent viewers at each point
            let current = 0;
            events.forEach(event => {
                if (event.type === 'join') {
                    current++;
                    peakConcurrent = Math.max(peakConcurrent, current);
                } else {
                    current--;
                }
            });
        }

        // Calculate retention rate (% who stayed > 50% of session)
        const sessionDurationSeconds = liveSession.duration * 60;
        const halfDuration = sessionDurationSeconds / 2;
        const retainedViewers = watchDurations.filter(d => d >= halfDuration).length;
        const retentionRate = watchDurations.length > 0
            ? Math.round((retainedViewers / watchDurations.length) * 100)
            : 0;

        // 4. Build viewer timeline (for chart)
        const viewerTimeline: Array<{ timestamp: string, viewers: number }> = [];
        
        if (liveSession.actualStartAt && attendees.length > 0) {
            const startTime = new Date(liveSession.actualStartAt);
            const endTime = liveSession.actualEndAt 
                ? new Date(liveSession.actualEndAt)
                : new Date(); // If still live, use current time

            const durationMinutes = Math.ceil((endTime.getTime() - startTime.getTime()) / 1000 / 60);
            const intervalMinutes = Math.max(1, Math.ceil(durationMinutes / 20)); // Max 20 data points

            for (let i = 0; i <= durationMinutes; i += intervalMinutes) {
                const timestamp = new Date(startTime.getTime() + i * 60 * 1000);
                
                // Count viewers at this timestamp
                const viewersAtTime = attendees.filter(a => {
                    const joined = new Date(a.joinedAt);
                    const left = a.leftAt ? new Date(a.leftAt) : new Date();
                    return timestamp >= joined && timestamp <= left;
                }).length;

                viewerTimeline.push({
                    timestamp: timestamp.toISOString(),
                    viewers: viewersAtTime
                });
            }
        }

        // 5. Engagement breakdown by tier
        const tierBreakdown = attendees.reduce((acc, attendee) => {
            // Note: We'd need to fetch user's subscription tier here
            // For now, we'll count all as general viewers
            acc.total = (acc.total || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // 6. Top viewers (by watch duration)
        const topViewers = attendees
            .filter(a => a.duration !== null)
            .sort((a, b) => b.duration! - a.duration!)
            .slice(0, 10)
            .map(a => ({
                id: a.user.id,
                name: a.user.name,
                profileImage: a.user.profileImage,
                watchDuration: a.duration!,
                joinedAt: a.joinedAt,
                leftAt: a.leftAt
            }));

        // 7. Calculate engagement score (0-100)
        const engagementScore = Math.round(
            (retentionRate * 0.4) + // 40% weight on retention
            (Math.min(peakConcurrent / (liveSession.maxAttendees || 100), 1) * 30) + // 30% on capacity
            (Math.min(uniqueViewers / 50, 1) * 30) // 30% on unique viewers
        );

        // 8. Build response
        const analytics = {
            session: {
                id: liveSession.id,
                title: liveSession.title,
                titleAr: liveSession.titleAr,
                status: liveSession.status,
                tier: liveSession.tier,
                scheduledAt: liveSession.scheduledAt,
                actualStartAt: liveSession.actualStartAt,
                actualEndAt: liveSession.actualEndAt,
                duration: liveSession.duration
            },
            overview: {
                totalViews: liveSession.viewCount,
                uniqueViewers,
                totalAttendees,
                peakConcurrent,
                averageWatchDuration, // in seconds
                totalWatchTime, // in seconds
                retentionRate, // percentage
                engagementScore // 0-100
            },
            viewerTimeline,
            topViewers,
            tierBreakdown,
            metrics: {
                averageWatchDurationFormatted: formatDuration(averageWatchDuration),
                totalWatchTimeFormatted: formatDuration(totalWatchTime),
                sessionDurationFormatted: formatDuration(liveSession.duration * 60)
            }
        };

        return NextResponse.json(analytics, { status: 200 });

    } catch (error) {
        console.error('Error fetching session analytics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch session analytics' },
            { status: 500 }
        );
    }
}

// Helper function to format duration
function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}
