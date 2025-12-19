import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

/**
 * Online Status API - Track user presence
 * Uses in-memory storage for real-time tracking
 * In production, this would use Redis for persistence across instances
 */

// In-memory store for online users with last activity timestamp
const onlineUsers = new Map<string, { lastSeen: Date; status: 'online' | 'away' | 'busy' }>()

// Cleanup stale entries every 5 minutes
const STALE_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes
setInterval(() => {
    const now = new Date()
    for (const [userId, data] of onlineUsers.entries()) {
        if (now.getTime() - data.lastSeen.getTime() > STALE_THRESHOLD_MS) {
            onlineUsers.delete(userId)
        }
    }
}, 60 * 1000) // Check every minute

// Exported helper function to check online status
export function isUserOnline(userId: string): boolean {
    const userData = onlineUsers.get(userId)
    if (!userData) return false

    const now = new Date()
    return now.getTime() - userData.lastSeen.getTime() < STALE_THRESHOLD_MS
}

// Exported helper to get multiple users' online status
export function getUsersOnlineStatus(userIds: string[]): Record<string, boolean> {
    const result: Record<string, boolean> = {}
    for (const userId of userIds) {
        result[userId] = isUserOnline(userId)
    }
    return result
}

// GET: Check online status of users
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const userIdsParam = searchParams.get('userIds')

        if (!userIdsParam) {
            // Return current user's status
            const isOnline = isUserOnline(session.user.id)
            return NextResponse.json({
                userId: session.user.id,
                isOnline,
                lastSeen: onlineUsers.get(session.user.id)?.lastSeen
            })
        }

        const userIds = userIdsParam.split(',')
        const statuses = userIds.map(userId => ({
            userId,
            isOnline: isUserOnline(userId),
            lastSeen: onlineUsers.get(userId)?.lastSeen || null
        }))

        return NextResponse.json({ users: statuses })
    } catch (error) {
        console.error('Online status GET error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch online status' },
            { status: 500 }
        )
    }
}

// POST: Update current user's online status (heartbeat)
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json().catch(() => ({}))
        const status = body.status || 'online'

        // Update user's online status
        onlineUsers.set(session.user.id, {
            lastSeen: new Date(),
            status: status
        })

        return NextResponse.json({
            success: true,
            userId: session.user.id,
            status,
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        console.error('Online status POST error:', error)
        return NextResponse.json(
            { error: 'Failed to update online status' },
            { status: 500 }
        )
    }
}

// DELETE: Mark user as offline
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        onlineUsers.delete(session.user.id)

        return NextResponse.json({
            success: true,
            message: 'User marked as offline'
        })
    } catch (error) {
        console.error('Online status DELETE error:', error)
        return NextResponse.json(
            { error: 'Failed to update online status' },
            { status: 500 }
        )
    }
}
