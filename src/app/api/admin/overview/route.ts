import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get platform statistics
        const [
            totalUsers,
            totalCreators,
            totalCourses,
            totalSubscriptions,
            pendingKyc,
            pendingContent,
            recentUsers,
            recentCreators,
            monthlyRevenue
        ] = await Promise.all([
            // Total counts
            prisma.user.count(),
            prisma.creator.count(),
            prisma.course.count(),
            prisma.subscription.count({ where: { status: 'active' } }),

            // Pending items
            prisma.creator.count({ where: { kycStatus: 'PENDING' } }),
            prisma.course.count({ where: { status: 'UNDER_REVIEW' } }),

            // Recent activities
            prisma.user.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                }
            }),

            prisma.creator.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                        }
                    }
                }
            }),

            // Monthly revenue calculation
            prisma.subscription.aggregate({
                where: {
                    status: 'active',
                    startDate: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                    }
                },
                _sum: {
                    pricePerMonth: true
                }
            })
        ])

        // Calculate user growth (last 30 days vs previous 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const sixtyDaysAgo = new Date()
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

        const [recentUserGrowth, previousUserGrowth] = await Promise.all([
            prisma.user.count({
                where: {
                    createdAt: {
                        gte: thirtyDaysAgo
                    }
                }
            }),
            prisma.user.count({
                where: {
                    createdAt: {
                        gte: sixtyDaysAgo,
                        lt: thirtyDaysAgo
                    }
                }
            })
        ])

        const userGrowthPercentage = previousUserGrowth > 0
            ? ((recentUserGrowth - previousUserGrowth) / previousUserGrowth * 100).toFixed(1)
            : '0'

        const stats = {
            overview: {
                totalUsers,
                totalCreators,
                totalCourses,
                totalSubscriptions,
                monthlyRevenue: monthlyRevenue._sum.pricePerMonth || 0,
                userGrowthPercentage: parseFloat(userGrowthPercentage)
            },
            pending: {
                kycApplications: pendingKyc,
                contentReviews: pendingContent
            },
            recentActivity: {
                users: recentUsers,
                creators: recentCreators
            }
        }

        return NextResponse.json(stats)

    } catch (error) {
        console.error('Admin overview API error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch admin overview' },
            { status: 500 }
        )
    }
}
