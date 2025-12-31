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

        // Get real security events from database
        const securityEvents = await prisma.adminAuditLog.findMany({
            where: {
                OR: [
                    { status: 'FAILED' },
                    { action: { in: ['BAN_USER', 'SUSPEND_USER', 'DELETE_CONTENT', 'LOGIN_ATTEMPT'] } },
                    { module: 'SECURITY' }
                ],
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 50
        })

        // Get user bans for additional security events
        const recentBans = await prisma.userBan.findMany({
            where: {
                bannedAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                bannedAt: 'desc'
            },
            take: 20
        })

        // Combine and format events
        const events = [
            ...securityEvents.map(log => ({
                id: log.id,
                type: log.action.includes('LOGIN') ? 'login_attempt' :
                      log.action.includes('BAN') || log.action.includes('SUSPEND') ? 'threat_detected' :
                      log.module === 'SECURITY' ? 'suspicious_activity' : 'policy_violation',
                severity: log.status === 'FAILED' ? 'high' :
                         log.action.includes('BAN') ? 'critical' :
                         log.action.includes('SUSPEND') ? 'high' : 'medium',
                description: log.details || `${log.action} performed by ${log.adminName}`,
                userId: log.adminId,
                ipAddress: log.ipAddress || 'Unknown',
                timestamp: log.createdAt.toISOString(),
                status: log.status === 'FAILED' ? 'investigating' : 'resolved'
            })),
            ...recentBans.map(ban => ({
                id: ban.id,
                type: 'threat_detected',
                severity: ban.banType === 'PERMANENT' ? 'critical' : 'high',
                description: `User ${ban.user.name} (${ban.user.email}) was banned for: ${ban.reason}`,
                userId: ban.userId,
                ipAddress: 'N/A',
                timestamp: ban.bannedAt.toISOString(),
                status: ban.status === 'ACTIVE' ? 'active' : 'resolved'
            }))
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 20)

        return NextResponse.json(events)

    } catch (error) {
        console.error('Security events error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}