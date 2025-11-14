import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/creator/settings/notifications
 * Get creator notification settings
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Get creator profile
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json(
                { error: 'Creator profile not found' },
                { status: 404 }
            )
        }

        // Get notification settings from user preferences
        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        })

        return NextResponse.json({
            success: true,
            settings: {
                emailNotifications: user?.emailNotifications ?? true,
                enrollmentNotifications: true, // Default
                reviewNotifications: true, // Default
                payoutNotifications: true // Default
            }
        })

    } catch (error) {
        console.error('Failed to fetch notification settings:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * PATCH /api/creator/settings/notifications
 * Update creator notification settings
 */
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const {
            emailNotifications,
            enrollmentNotifications,
            reviewNotifications,
            payoutNotifications
        } = body

        // Get creator profile
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json(
                { error: 'Creator profile not found' },
                { status: 404 }
            )
        }

        // Update user email notifications preference
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                emailNotifications: emailNotifications ?? undefined
            }
        })

        // TODO: Store other notification preferences in a separate table
        // For now, we acknowledge the request

        return NextResponse.json({
            success: true,
            message: 'Notification settings updated'
        })

    } catch (error) {
        console.error('Failed to update notification settings:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
