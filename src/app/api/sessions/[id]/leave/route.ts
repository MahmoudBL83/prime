import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/sessions/[id]/leave
 * Member leaves a live session
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

        // Find the active attendee record
        const attendee = await prisma.sessionAttendee.findFirst({
            where: {
                sessionId,
                userId,
                leftAt: null // Still in session
            }
        });

        if (!attendee) {
            return NextResponse.json(
                { error: 'You are not currently attending this session' },
                { status: 400 }
            );
        }

        // Calculate watch duration in seconds
        const leftAt = new Date();
        const joinedAt = new Date(attendee.joinedAt);
        const durationSeconds = Math.floor((leftAt.getTime() - joinedAt.getTime()) / 1000);

        // Update attendee record
        const updatedAttendee = await prisma.sessionAttendee.update({
            where: { id: attendee.id },
            data: {
                leftAt,
                duration: durationSeconds
            }
        });

        return NextResponse.json(
            {
                message: 'Successfully left session',
                attendee: updatedAttendee,
                watchDuration: {
                    seconds: durationSeconds,
                    minutes: Math.floor(durationSeconds / 60),
                    formatted: formatDuration(durationSeconds)
                }
            },
            { status: 200 }
        );

    } catch (error) {
        console.error('Error leaving session:', error);
        return NextResponse.json(
            { error: 'Failed to leave session' },
            { status: 500 }
        );
    }
}

/**
 * Helper function to format duration in HH:MM:SS
 */
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
