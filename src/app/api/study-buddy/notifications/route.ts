import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get study buddy related notifications
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const limit = parseInt(searchParams.get('limit') || '20')
        const unreadOnly = searchParams.get('unreadOnly') === 'true'

        // Get recent match activities
        const recentMatches = await prisma.studyBuddyMatch.findMany({
            where: {
                OR: [
                    { user1Id: session.user.id },
                    { user2Id: session.user.id }
                ],
                updatedAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                }
            },
            include: {
                user1: {
                    select: {
                        id: true,
                        name: true,
                        arabicName: true,
                        profileImage: true
                    }
                },
                user2: {
                    select: {
                        id: true,
                        name: true,
                        arabicName: true,
                        profileImage: true
                    }
                }
            },
            orderBy: { updatedAt: 'desc' },
            take: limit
        })

        // Format notifications
        const notifications = recentMatches.map(match => {
            const isUser1 = match.user1Id === session.user.id
            const otherUser = isUser1 ? match.user2 : match.user1

            let title = ''
            let message = ''
            let type = 'match'

            switch (match.status) {
                case 'pending':
                    if (isUser1) {
                        title = 'Match Request Sent'
                        message = `Your study buddy request to ${otherUser.name} is pending`
                        type = 'request_sent'
                    } else {
                        title = 'New Match Request!'
                        message = `${otherUser.name} wants to be your study buddy`
                        type = 'request_received'
                    }
                    break
                case 'accepted':
                    title = 'Match Accepted! 🎉'
                    message = `You and ${otherUser.name} are now study buddies!`
                    type = 'match_accepted'
                    break
                case 'blocked':
                    title = 'Match Blocked'
                    message = `Match with ${otherUser.name} has been blocked`
                    type = 'match_blocked'
                    break
            }

            return {
                id: match.id,
                title,
                message,
                type,
                data: {
                    matchId: match.id,
                    otherUser: {
                        id: otherUser.id,
                        name: otherUser.name,
                        arabicName: otherUser.arabicName,
                        profileImage: otherUser.profileImage
                    }
                },
                read: false, // For now, all are unread
                createdAt: match.updatedAt.toISOString()
            }
        })

        // Get summary statistics
        const summary = {
            totalNotifications: notifications.length,
            unreadCount: notifications.filter(n => !n.read).length,
            newMatches: notifications.filter(n => n.type === 'match_accepted').length,
            pendingRequests: notifications.filter(n => n.type === 'request_received').length
        }

        return NextResponse.json({
            notifications: unreadOnly ? notifications.filter(n => !n.read) : notifications,
            summary
        })
    } catch (error) {
        console.error('Get study buddy notifications error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch notifications' },
            { status: 500 }
        )
    }
}

// POST - Mark notifications as read
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { notificationIds } = await req.json()

        if (!Array.isArray(notificationIds)) {
            return NextResponse.json(
                { error: 'notificationIds must be an array' },
                { status: 400 }
            )
        }

        // For now, just return success since we don't have a separate notifications table
        // In a full implementation, you'd update a notifications table here

        return NextResponse.json({
            message: 'Notifications marked as read',
            markedCount: notificationIds.length
        })
    } catch (error) {
        console.error('Mark notifications read error:', error)
        return NextResponse.json(
            { error: 'Failed to mark notifications as read' },
            { status: 500 }
        )
    }
}