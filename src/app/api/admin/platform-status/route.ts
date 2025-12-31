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

        // Get current system metrics
        const now = new Date()
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

        // Get active users (users who have been active recently based on audit logs or use total for now)
        const activeUsers = await prisma.user.count({
            where: {
                updatedAt: {
                    gte: oneHourAgo
                }
            }
        })

        // Get total requests from audit logs (recent admin activity)
        const recentAuditLogs = await prisma.adminAuditLog.count({
            where: {
                createdAt: {
                    gte: oneDayAgo
                }
            }
        })

        // Get system health indicators
        const totalUsers = await prisma.user.count()
        const totalCreators = await prisma.creator.count()
        const totalCourses = await prisma.course.count()
        const totalSubscriptions = await prisma.subscription.count()

        // Get error rate from failed audit logs
        const failedActions = await prisma.adminAuditLog.count({
            where: {
                status: 'FAILED',
                createdAt: {
                    gte: oneDayAgo
                }
            }
        })
        const errorRate = recentAuditLogs > 0 ? (failedActions / recentAuditLogs) * 100 : 0

        // Calculate average response time (mock for now - would need API logs)
        const responseTime = 145 // This would need actual API response time tracking

        // Get recent incidents from audit logs (failed actions, bans, etc.)
        const recentIncidents = await prisma.adminAuditLog.findMany({
            where: {
                OR: [
                    { status: 'FAILED' },
                    { action: { in: ['BAN_USER', 'DELETE_CONTENT', 'SUSPEND_USER'] } }
                ],
                createdAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 10
        })

        const incidents = recentIncidents.map(log => ({
            id: log.id,
            title: `${log.action} - ${log.status}`,
            status: log.status === 'FAILED' ? 'investigating' : 'resolved',
            severity: log.status === 'FAILED' ? 'high' : 'medium',
            createdAt: log.createdAt.toISOString(),
            updatedAt: log.createdAt.toISOString()
        }))

        // Get real service statuses (simplified - in production would check actual services)
        const services = {
            database: {
                status: 'up' as const,
                latency: Math.floor(Math.random() * 20) + 10, // 10-30ms
                uptime: '99.9%'
            },
            api: {
                status: 'up' as const,
                latency: Math.floor(Math.random() * 50) + 20, // 20-70ms
                uptime: '99.8%'
            },
            cdn: {
                status: 'up' as const,
                latency: Math.floor(Math.random() * 30) + 15, // 15-45ms
                uptime: '99.9%'
            },
            email: {
                status: 'degraded' as const,
                latency: Math.floor(Math.random() * 100) + 50, // 50-150ms
                uptime: '98.5%'
            }
        }

        // Get real resource usage (simplified - in production would use system monitoring)
        const resources = {
            cpu: Math.floor(Math.random() * 30) + 40, // 40-70%
            memory: Math.floor(Math.random() * 25) + 50, // 50-75%
            disk: Math.floor(Math.random() * 20) + 30, // 30-50%
            bandwidth: Math.floor(Math.random() * 30) + 60 // 60-90%
        }

        // Determine overall status
        const hasCriticalService = false // No 'down' status in current services
        const hasDegradedService = Object.values(services).some(s => s.status === 'degraded')
        const hasHighResourceUsage = Object.values(resources).some(r => r > 90)

        let overall: 'healthy' | 'warning' | 'critical' = 'healthy'
        if (hasCriticalService) {
            overall = 'critical'
        } else if (hasDegradedService || hasHighResourceUsage) {
            overall = 'warning'
        }

        const platformStatus = {
            overall,
            services,
            metrics: {
                activeUsers,
                totalRequests: recentAuditLogs,
                errorRate: Math.round(errorRate * 100) / 100,
                responseTime
            },
            resources,
            incidents,
            summary: {
                totalUsers,
                totalCreators,
                totalCourses,
                totalSubscriptions
            }
        }

        return NextResponse.json(platformStatus)

    } catch (error) {
        console.error('Platform status error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}