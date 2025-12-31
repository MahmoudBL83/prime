import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/user/hidden-users
 * Get list of hidden user IDs for the current user
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const hiddenUsers = await prisma.hiddenUser.findMany({
            where: { userId: session.user.id },
            select: { hiddenUserId: true }
        })

        return NextResponse.json({
            hiddenUserIds: hiddenUsers.map(h => h.hiddenUserId)
        })
    } catch (error) {
        console.error('Error fetching hidden users:', error)
        return NextResponse.json(
            { error: 'Failed to fetch hidden users' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/user/hidden-users
 * Hide or unhide a user's posts from feed
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await req.json()
        const { hiddenUserId } = body

        if (!hiddenUserId) {
            return NextResponse.json(
                { error: 'User ID to hide is required' },
                { status: 400 }
            )
        }

        // Can't hide yourself
        if (hiddenUserId === session.user.id) {
            return NextResponse.json(
                { error: 'Cannot hide your own posts' },
                { status: 400 }
            )
        }

        // Check if already hidden
        const existing = await prisma.hiddenUser.findFirst({
            where: {
                userId: session.user.id,
                hiddenUserId
            }
        })

        if (existing) {
            // Unhide
            await prisma.hiddenUser.delete({
                where: { id: existing.id }
            })

            return NextResponse.json({
                success: true,
                hidden: false,
                message: 'User posts are now visible in your feed'
            })
        } else {
            // Hide
            await prisma.hiddenUser.create({
                data: {
                    userId: session.user.id,
                    hiddenUserId
                }
            })

            return NextResponse.json({
                success: true,
                hidden: true,
                message: 'User posts hidden from your feed'
            })
        }

    } catch (error) {
        console.error('Hidden user toggle error:', error)
        return NextResponse.json(
            { error: 'Failed to update hidden users' },
            { status: 500 }
        )
    }
}
