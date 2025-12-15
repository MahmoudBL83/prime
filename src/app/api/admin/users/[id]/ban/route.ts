import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

/**
 * User Ban/Suspend/Unban API for Admins
 * POST /api/admin/users/[id]/ban
 */

const banSchema = z.object({
    action: z.enum(['ban', 'suspend', 'unban', 'warn']),
    reason: z.string().min(1).optional(),
    duration: z.number().optional(), // hours for suspension
    notifyUser: z.boolean().default(true)
})

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: userId } = await params
        const body = await request.json()
        const parsed = banSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
        }

        const { action, reason, duration, notifyUser } = parsed.data

        // Get the user
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, role: true }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Prevent banning other admins
        if (user.role === 'ADMIN' && action !== 'warn') {
            return NextResponse.json(
                { error: 'Cannot ban or suspend admin users' },
                { status: 403 }
            )
        }

        // Prevent self-action
        if (user.id === session.user.id) {
            return NextResponse.json(
                { error: 'Cannot perform this action on yourself' },
                { status: 400 }
            )
        }

        let notificationMessage = ''

        switch (action) {
            case 'ban': {
                // Create UserBan record
                await prisma.userBan.create({
                    data: {
                        userId: userId,
                        banType: 'PERMANENT',
                        reason: reason || 'Violation of terms of service',
                        evidence: [],
                        bannedBy: session.user.id,
                        status: 'ACTIVE'
                    }
                })
                notificationMessage = `Your account has been banned. Reason: ${reason || 'Violation of terms'}`
                break
            }

            case 'suspend': {
                const expiresAt = duration
                    ? new Date(Date.now() + duration * 60 * 60 * 1000)
                    : new Date(Date.now() + 24 * 60 * 60 * 1000) // Default 24 hours

                await prisma.userBan.create({
                    data: {
                        userId: userId,
                        banType: 'TEMPORARY',
                        duration: 'SEVEN_DAYS',
                        reason: reason || 'Temporary suspension',
                        evidence: [],
                        bannedBy: session.user.id,
                        expiresAt: expiresAt,
                        status: 'ACTIVE'
                    }
                })
                notificationMessage = `Your account has been suspended until ${expiresAt.toLocaleString()}. Reason: ${reason || 'Policy violation'}`
                break
            }

            case 'unban': {
                // Lift all active bans
                await prisma.userBan.updateMany({
                    where: { userId: userId, status: 'ACTIVE' },
                    data: {
                        status: 'LIFTED',
                        liftedAt: new Date(),
                        liftedBy: session.user.id,
                        liftReason: reason || 'Admin lifted ban'
                    }
                })
                notificationMessage = 'Your account has been restored. You can now access the platform.'
                break
            }

            case 'warn': {
                notificationMessage = `You have received a warning. Reason: ${reason || 'Policy violation'}. Further violations may result in account suspension.`
                break
            }
        }

        // Create moderation event
        await prisma.moderationEvent.create({
            data: {
                userId: userId,
                eventType: 'BEHAVIOR_FLAG',
                severity: action === 'ban' ? 'CRITICAL' : action === 'suspend' ? 'HIGH' : 'MEDIUM',
                status: 'RESOLVED',
                reason: reason || `Admin ${action} action`,
                source: 'ADMIN_ACTION',
                resolvedAt: new Date(),
                resolvedBy: session.user.id,
                metadata: {
                    action,
                    reason,
                    duration,
                    adminId: session.user.id,
                    adminEmail: session.user.email
                }
            }
        })

        // Log admin action
        await prisma.adminAuditLog.create({
            data: {
                adminId: session.user.id,
                adminName: session.user.name || 'Admin',
                adminEmail: session.user.email || '',
                action: action.toUpperCase() + '_USER',
                module: 'User Management',
                details: `${action} user ${user.name} (${user.email}). Reason: ${reason || 'Not specified'}`,
                status: 'SUCCESS',
                metadata: {
                    userId,
                    userEmail: user.email,
                    action,
                    reason,
                    duration
                }
            }
        })

        // Send notification to user
        if (notifyUser) {
            await prisma.notification.create({
                data: {
                    userId: userId,
                    type: 'SYSTEM',
                    title: action === 'ban' ? 'Account Banned' :
                        action === 'suspend' ? 'Account Suspended' :
                            action === 'unban' ? 'Account Restored' : 'Account Warning',
                    message: notificationMessage,
                    data: {
                        action,
                        reason,
                        adminAction: true
                    }
                }
            })
        }

        // If creator, update creator status
        // Note: 'isActive' does not exist on Creator model. 
        // Logic should rely on UserBan or User.loginDisabled
        /*
        if (user.role === 'CREATOR' && (action === 'ban' || action === 'suspend')) {
            await prisma.creator.updateMany({
                where: { userId: userId },
                data: {
                    isActive: false
                }
            })
        } else if (user.role === 'CREATOR' && action === 'unban') {
            await prisma.creator.updateMany({
                where: { userId: userId },
                data: {
                    isActive: true
                }
            })
        }
        */

        return NextResponse.json({
            success: true,
            action,
            userId,
            message: `User ${action === 'unban' ? 'unbanned' : action === 'ban' ? 'banned' : action === 'suspend' ? 'suspended' : 'warned'} successfully`
        })
    } catch (error) {
        console.error('Ban user error:', error)
        return NextResponse.json(
            { error: 'Failed to perform action' },
            { status: 500 }
        )
    }
}

// GET: Get user ban status and history
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: userId } = await params

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true
            }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Get active bans
        const activeBans = await prisma.userBan.findMany({
            where: { userId, status: 'ACTIVE' },
            orderBy: { bannedAt: 'desc' }
        })

        // Get moderation history
        const moderationHistory = await prisma.moderationEvent.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20,
            select: {
                id: true,
                eventType: true,
                severity: true,
                reason: true,
                createdAt: true,
                resolvedAt: true,
                metadata: true
            }
        })

        return NextResponse.json({
            user: {
                ...user,
                isBanned: activeBans.length > 0,
                activeBans
            },
            moderationHistory
        })
    } catch (error) {
        console.error('Get ban status error:', error)
        return NextResponse.json(
            { error: 'Failed to get ban status' },
            { status: 500 }
        )
    }
}
