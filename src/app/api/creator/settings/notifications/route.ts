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
            where: { id: session.user.id },
            include: {
                notificationSettings: true
            }
        })

        const settings = user?.notificationSettings;

        return NextResponse.json({
            success: true,
            settings: {
                emailNotifications: settings?.emailNotifications ?? true,
                pushNotifications: settings?.pushNotifications ?? false,
                courseUpdates: settings?.courseUpdates ?? true,
                newMessages: settings?.newMessages ?? true,
                marketingEmails: settings?.marketingEmails ?? false,
                weeklyDigest: settings?.weeklyDigest ?? true
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
            pushNotifications,
            courseUpdates,
            newMessages,
            marketingEmails,
            weeklyDigest
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

        // Update or create notification settings
        await prisma.notificationSetting.upsert({
            where: { userId: session.user.id },
            update: {
                emailNotifications: emailNotifications ?? undefined,
                pushNotifications: pushNotifications ?? undefined,
                courseUpdates: courseUpdates ?? undefined,
                newMessages: newMessages ?? undefined,
                marketingEmails: marketingEmails ?? undefined,
                weeklyDigest: weeklyDigest ?? undefined
            },
            create: {
                userId: session.user.id,
                emailNotifications: emailNotifications ?? true,
                pushNotifications: pushNotifications ?? false,
                courseUpdates: courseUpdates ?? true,
                newMessages: newMessages ?? true,
                marketingEmails: marketingEmails ?? false,
                weeklyDigest: weeklyDigest ?? true
            }
        })

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
