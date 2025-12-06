import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PaymentStatus, SubscriptionType } from '@prisma/client'

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const searchParams = req.nextUrl.searchParams
        const range = searchParams.get('range') || '30d'

        // Calculate date range
        const now = new Date()
        const startDate = new Date()
        const previousStartDate = new Date()
        
        switch (range) {
            case '7d':
                startDate.setDate(now.getDate() - 7)
                previousStartDate.setDate(now.getDate() - 14)
                break
            case '30d':
                startDate.setDate(now.getDate() - 30)
                previousStartDate.setDate(now.getDate() - 60)
                break
            case '90d':
                startDate.setDate(now.getDate() - 90)
                previousStartDate.setDate(now.getDate() - 180)
                break
            case '1y':
                startDate.setFullYear(now.getFullYear() - 1)
                previousStartDate.setFullYear(now.getFullYear() - 2)
                break
        }

        // Fetch real financial data
        const [
            totalRevenue,
            periodRevenue,
            previousPeriodRevenue,
            totalPayouts,
            pendingPayoutsCount,
            activeSubscriptions,
            cancelledSubscriptions,
            totalUsers,
            recentTransactions,
            topCreators
        ] = await Promise.all([
            // Total revenue (all time)
            prisma.paymentTransaction.aggregate({
                where: { status: PaymentStatus.PAID },
                _sum: { amount: true }
            }),
            
            // Revenue in selected period
            prisma.paymentTransaction.aggregate({
                where: {
                    status: PaymentStatus.PAID,
                    paidAt: { gte: startDate }
                },
                _sum: { amount: true }
            }),
            
            // Previous period revenue for growth calculation
            prisma.paymentTransaction.aggregate({
                where: {
                    status: PaymentStatus.PAID,
                    paidAt: {
                        gte: previousStartDate,
                        lt: startDate
                    }
                },
                _sum: { amount: true }
            }),
            
            // Total payouts
            prisma.payout.aggregate({
                where: { status: 'completed' },
                _sum: { amount: true }
            }),
            
            // Pending payouts count
            prisma.payout.count({
                where: { status: 'pending' }
            }),
            
            // Active subscriptions
            prisma.subscription.count({
                where: { status: 'active' }
            }),
            
            // Cancelled subscriptions for churn calculation
            prisma.subscription.count({
                where: {
                    cancelledAt: { gte: startDate }
                }
            }),
            
            // Total users
            prisma.user.count(),
            
            // Recent transactions
            prisma.paymentTransaction.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { name: true } }
                }
            }),
            
            // Top creators by earnings
            prisma.creator.findMany({
                take: 10,
                orderBy: { totalEarnings: 'desc' },
                select: {
                    id: true,
                    totalEarnings: true,
                    totalSubscribers: true,
                    expertise: true,
                    user: { select: { name: true } },
                }
            })
        ])

        // Calculate metrics
        const periodRevenueAmount = periodRevenue._sum.amount || 0
        const previousRevenueAmount = previousPeriodRevenue._sum.amount || 0
        const revenueGrowth = previousRevenueAmount > 0
            ? ((periodRevenueAmount - previousRevenueAmount) / previousRevenueAmount * 100)
            : 0
        
        const churnRate = activeSubscriptions > 0
            ? (cancelledSubscriptions / activeSubscriptions * 100)
            : 0
            
        const arpu = totalUsers > 0
            ? (totalRevenue._sum.amount || 0) / totalUsers
            : 0

        // Group transactions for breakdown
        const subscriptionRevenue = await prisma.paymentTransaction.aggregate({
            where: {
                status: PaymentStatus.PAID,
                subscriptionType: SubscriptionType.CATEGORY_C,
                paidAt: { gte: startDate }
            },
            _sum: { amount: true }
        })

        const courseRevenue = await prisma.paymentTransaction.aggregate({
            where: {
                status: PaymentStatus.PAID,
                subscriptionType: SubscriptionType.CATEGORY_B,
                paidAt: { gte: startDate }
            },
            _sum: { amount: true }
        })

        const financialStats = {
            overview: {
                totalRevenue: totalRevenue._sum.amount || 0,
                monthlyRevenue: periodRevenueAmount,
                revenueGrowth: Math.round(revenueGrowth * 10) / 10,
                totalPayouts: totalPayouts._sum.amount || 0,
                pendingPayouts: pendingPayoutsCount,
                activeSubscriptions,
                churnRate: Math.round(churnRate * 10) / 10,
                averageRevenuePerUser: Math.round(arpu * 100) / 100
            },
            breakdown: {
                subscriptions: subscriptionRevenue._sum.amount || 0,
                courses: courseRevenue._sum.amount || 0,
                other: periodRevenueAmount - (subscriptionRevenue._sum.amount || 0) - (courseRevenue._sum.amount || 0)
            },
            recentTransactions: recentTransactions.map(tx => {
                const subscriptionTypes: SubscriptionType[] = [
                    SubscriptionType.CATEGORY_A,
                    SubscriptionType.CATEGORY_B,
                    SubscriptionType.CATEGORY_C,
                    SubscriptionType.BUNDLE_AB,
                    SubscriptionType.BUNDLE_ABC,
                ]
                const isSubscription = subscriptionTypes.includes(tx.subscriptionType)

                const status = tx.status === PaymentStatus.PAID
                    ? 'completed'
                    : tx.status === PaymentStatus.PENDING
                        ? 'pending'
                        : 'failed'

                return {
                    id: tx.id,
                    type: isSubscription ? 'subscription' : 'purchase',
                    amount: tx.amount,
                    status,
                    user: tx.user?.name || 'Unknown',
                    date: tx.createdAt.toISOString()
                }
            }),
            topCreatorEarnings: topCreators.map((creator, index) => ({
                id: creator.id,
                name: creator.user?.name || `Creator ${index + 1}`,
                earnings: creator.totalEarnings || 0,
                subscribers: creator.totalSubscribers || 0,
                category: creator.expertise || 'General'
            }))
        }

        return NextResponse.json(financialStats)
    } catch (error) {
        console.error('Error fetching financial stats:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
