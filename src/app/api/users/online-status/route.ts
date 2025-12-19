import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import {
    isUserOnline,
    updateUserStatus,
    removeUser,
    getLastSeen
} from '@/services/onlineStatusService'

/**
 * Online Status API - Track user presence
 * Logic moved to src/services/onlineStatusService.ts
 */

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
                lastSeen: getLastSeen(session.user.id)
            })
        }

        const userIds = userIdsParam.split(',')
        const statuses = userIds.map(userId => ({
            userId,
            isOnline: isUserOnline(userId),
            lastSeen: getLastSeen(userId)
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
        const result = updateUserStatus(session.user.id, status)

        return NextResponse.json({
            success: true,
            ...result,
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

        removeUser(session.user.id)

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
