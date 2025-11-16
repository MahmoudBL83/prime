import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/live-stream/notifications
 * Send notifications for live stream events
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { 
            sessionId, 
            type, 
            message, 
            targetUsers, 
            sendToAll = false 
        } = body

        // Validate required fields
        if (!sessionId || !type || !message) {
            return NextResponse.json(
                { error: 'Session ID, type, and message are required' },
                { status: 400 }
            )
        }

        // Validate notification type
        const validTypes = ['stream_started', 'stream_ended', 'stream_reminder', 'stream_update', 'participant_joined', 'participant_left']
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { error: 'Invalid notification type' },
                { status: 400 }
            )
        }

        // Verify the live session exists and user has permission
        const liveSession = await prisma.liveSession.findUnique({
            where: { id: sessionId },
            include: {
                creator: true,
                course: true
            }
        })

        if (!liveSession) {
            return NextResponse.json(
                { error: 'Live session not found' },
                { status: 404 }
            )
        }

        // Check if user is the creator of the session
        if (liveSession.creator.userId !== session.user.id) {
            return NextResponse.json(
                { error: 'Unauthorized to send notifications for this session' },
                { status: 403 }
            )
        }

        let recipients = []

        if (sendToAll) {
            // Get all enrolled students if it's a course session
            if (liveSession.courseId) {
                const enrollments = await prisma.enrollment.findMany({
                    where: { 
                        courseId: liveSession.courseId,
                        status: 'ACTIVE'
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                name: true
                            }
                        }
                    }
                })
                recipients = enrollments.map(enrollment => enrollment.user)
            } else {
                // Get session participants
                const participants = await prisma.sessionParticipant.findMany({
                    where: { sessionId: sessionId },
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                name: true
                            }
                        }
                    }
                })
                recipients = participants.map(participant => participant.user)
            }
        } else if (targetUsers && targetUsers.length > 0) {
            // Get specific target users
            const users = await prisma.user.findMany({
                where: { 
                    id: { in: targetUsers }
                },
                select: {
                    id: true,
                    email: true,
                    name: true
                }
            })
            recipients = users
        }

        if (recipients.length === 0) {
            return NextResponse.json(
                { error: 'No recipients found' },
                { status: 400 }
            )
        }

        // Create notifications for each recipient
        const notifications = await Promise.all(
            recipients.map(async (user) => {
                return await prisma.notification.create({
                    data: {
                        userId: user.id,
                        type: 'LIVE_STREAM',
                        title: `Live Session: ${liveSession.title}`,
                        message: message,
                        data: JSON.stringify({
                            sessionId: liveSession.id,
                            notificationType: type,
                            creatorName: liveSession.creator.user?.name,
                            courseTitle: liveSession.course?.title
                        }),
                        read: false,
                        createdAt: new Date()
                    }
                })
            })
        )

        // TODO: Send real-time notifications via WebSocket or push notifications
        // This could integrate with services like Firebase Cloud Messaging, Pusher, etc.

        return NextResponse.json({
            success: true,
            message: `Notifications sent to ${notifications.length} recipients`,
            data: {
                sessionId: liveSession.id,
                notificationType: type,
                recipientCount: notifications.length,
                notificationIds: notifications.map(n => n.id)
            }
        })

    } catch (error) {
        console.error('Live stream notification error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/live-stream/notifications
 * Get notification history for live stream sessions
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const sessionId = searchParams.get('sessionId')
        const limit = parseInt(searchParams.get('limit') || '20')
        const offset = parseInt(searchParams.get('offset') || '0')

        // Build where clause
        let whereClause: any = {
            type: 'LIVE_STREAM'
        }

        if (sessionId) {
            whereClause.data = {
                contains: `"sessionId":"${sessionId}"`
            }
        }

        // Only show notifications for the authenticated user
        whereClause.userId = session.user.id

        const notifications = await prisma.notification.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
            select: {
                id: true,
                type: true,
                title: true,
                message: true,
                data: true,
                read: true,
                createdAt: true
            }
        })

        const totalCount = await prisma.notification.count({
            where: whereClause
        })

        return NextResponse.json({
            success: true,
            data: {
                notifications,
                totalCount,
                hasMore: offset + notifications.length < totalCount
            }
        })

    } catch (error) {
        console.error('Live stream notification history error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
