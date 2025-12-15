import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Real-time Metrics API for Admin Dashboard
 * GET /api/admin/metrics/realtime
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const now = new Date()
        const todayStart = new Date(now.setHours(0, 0, 0, 0))
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)

        // Run queries in parallel for performance
        const [
            activeUsers,
            dailyActiveUsers,
            weeklyActiveUsers,
            monthlyActiveUsers,
            newSignups,
            activeSubscriptions,
            todayRevenue,
            onlineCreators,
            pendingReviews,
            recentSignups,
            recentPurchases
        ] = await Promise.all([
            // Active users (updated in last 15 minutes)
            prisma.user.count({
                where: {
                    updatedAt: { gte: fifteenMinutesAgo }
                }
            }),

            // Daily active users
            prisma.user.count({
                where: {
                    updatedAt: { gte: todayStart }
                }
            }),

            // Weekly active users
            prisma.user.count({
                where: {
                    updatedAt: { gte: weekAgo }
                }
            }),

            // Monthly active users
            prisma.user.count({
                where: {
                    updatedAt: { gte: monthAgo }
                }
            }),

            // New signups today
            prisma.user.count({
                where: {
                    createdAt: { gte: todayStart }
                }
            }),

            // Active subscriptions
            prisma.subscription.count({
                where: {
                    status: 'ACTIVE',
                    endDate: { gt: new Date() }
                }
            }),

            // Today's revenue
            prisma.paymentTransaction.aggregate({
                where: {
                    status: 'COMPLETED',
                    paidAt: { gte: todayStart }
                },
                _sum: { amount: true }
            }),

            // Online creators (active in last hour)
            prisma.creator.count({
                where: {
                    user: {
                        updatedAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }
                    }
                }
            }),

            // Pending course reviews
            prisma.course.count({
                where: {
                    status: 'PENDING_REVIEW'
                }
            }),

            // Recent signups (last 10)
            prisma.user.findMany({
                where: { createdAt: { gte: todayStart } },
                select: { id: true, name: true, createdAt: true },
                orderBy: { createdAt: 'desc' },
                take: 5
            }),

            // Recent purchases (last 10)
            prisma.paymentTransaction.findMany({
                where: {
                    status: 'COMPLETED',
                    paidAt: { gte: todayStart }
                },
                select: {
                    id: true,
                    amount: true,
                    subscriptionType: true,
                    paidAt: true,
                    user: { select: { name: true } }
                },
                orderBy: { paidAt: 'desc' },
                take: 5
            })
        ])

        // Build activity feed
        const recentActivity = [
            ...recentSignups.map(user => ({
                id: `signup-${user.id}`,
                type: 'signup' as const,
                message: `${user.name} joined the platform`,
                timestamp: user.createdAt
            })),
            ...recentPurchases.map(tx => ({
                id: `purchase-${tx.id}`,
                type: 'purchase' as const,
                message: `${tx.user.name} subscribed to ${tx.subscriptionType}`,
                timestamp: tx.paidAt || new Date()
            }))
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 10)

        return NextResponse.json({
            activeUsers,
            dailyActiveUsers,
            weeklyActiveUsers,
            monthlyActiveUsers,
            newSignups,
            activeSubscriptions,
            todayRevenue: todayRevenue._sum.amount || 0,
            onlineCreators,
            pendingReviews,
            recentActivity,
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        console.error('Real-time metrics error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch metrics' },
            { status: 500 }
        )
    }
}
