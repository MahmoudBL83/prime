import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        // Check authentication and admin role
        const session = await getServerSession(authOptions)
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const now = new Date()
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

        // Get real security metrics from database
        const totalUsers = await prisma.user.count()

        // Active sessions (users with recent activity)
        const activeSessions = await prisma.user.count({
            where: {
                updatedAt: {
                    gte: oneHourAgo
                }
            }
        })

        // Failed logins from audit logs (failed authentication attempts)
        const failedLogins = await prisma.adminAuditLog.count({
            where: {
                action: 'LOGIN_ATTEMPT',
                status: 'FAILED',
                createdAt: {
                    gte: oneDayAgo
                }
            }
        })

        // Suspicious activities from audit logs
        const suspiciousActivities = await prisma.adminAuditLog.count({
            where: {
                OR: [
                    { action: { in: ['SUSPICIOUS_ACTIVITY', 'MULTIPLE_FAILED_LOGINS', 'UNUSUAL_ACCESS'] } },
                    { module: 'SECURITY' }
                ],
                createdAt: {
                    gte: oneDayAgo
                }
            }
        })

        // Blocked IPs from user bans (active bans)
        const blockedIPs = await prisma.userBan.count({
            where: {
                status: 'ACTIVE',
                expiresAt: {
                    gt: now
                }
            }
        })

        // Active threats from flagged channels and recent security incidents
        const activeThreats = await prisma.flaggedChannel.count({
            where: {
                status: 'MONITORING',
                riskLevel: {
                    in: ['HIGH', 'CRITICAL']
                }
            }
        })

        const metrics = {
            totalUsers,
            activeSessions,
            failedLogins,
            suspiciousActivities,
            blockedIPs,
            activeThreats
        }

        return NextResponse.json(metrics)

    } catch (error) {
        console.error('Security metrics error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}