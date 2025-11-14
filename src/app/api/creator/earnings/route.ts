import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const creator = await prisma.creator.findUnique({ where: { userId: session.user.id } })
        if (!creator) {
            return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 })
        }

        // Total earnings
        const totalAgg = await prisma.creatorEarnings.aggregate({
            where: { creatorId: creator.id },
            _sum: { amount: true }
        })
        const totalEarnings = totalAgg._sum.amount || 0

        // Sum of requested/processing/completed payouts (reserved or paid)
        const payoutsAgg = await prisma.creatorPayout.aggregate({
            where: { creatorId: creator.id, status: { not: 'CANCELLED' } },
            _sum: { amount: true }
        })
        const payoutsReserved = payoutsAgg._sum.amount || 0

        const availableBalance = Math.max(0, totalEarnings - payoutsReserved)

        // Pending earnings (recent earnings not yet settled) - last 14 days
        const recentDate = new Date()
        recentDate.setDate(recentDate.getDate() - 14)
        const pendingAgg = await prisma.creatorEarnings.aggregate({
            where: { creatorId: creator.id, createdAt: { gte: recentDate } },
            _sum: { amount: true }
        })
        const pendingEarnings = pendingAgg._sum.amount || 0

        // This month / last month
        const now = new Date()
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

        const thisMonthAgg = await prisma.creatorEarnings.aggregate({
            where: { creatorId: creator.id, createdAt: { gte: startOfThisMonth } },
            _sum: { amount: true }
        })
        const lastMonthAgg = await prisma.creatorEarnings.aggregate({
            where: { creatorId: creator.id, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
            _sum: { amount: true }
        })

        const thisMonth = thisMonthAgg._sum.amount || 0
        const lastMonth = lastMonthAgg._sum.amount || 0

        // Revenue breakdown by sourceType
        const breakdownGroups = await prisma.creatorEarnings.groupBy({
            by: ['sourceType'],
            where: { creatorId: creator.id },
            _sum: { amount: true }
        })

        const breakdown: any = {
            courseRevenue: 0,
            channelRevenue: 0,
            liveSessionRevenue: 0
        }

        for (const row of breakdownGroups) {
            if (row.sourceType === 'COURSE_ENROLLMENT') breakdown.courseRevenue = row._sum.amount || 0
            if (row.sourceType === 'CHANNEL_SUBSCRIPTION') breakdown.channelRevenue = row._sum.amount || 0
            if (row.sourceType === 'MEETING_BOOKING') breakdown.liveSessionRevenue = row._sum.amount || 0
        }

        // Recent payouts
        const payouts = await prisma.creatorPayout.findMany({
            where: { creatorId: creator.id },
            orderBy: { requestedAt: 'desc' },
            take: 50
        })

        return NextResponse.json({
            stats: {
                totalEarnings,
                availableBalance,
                pendingEarnings,
                lifetimeEarnings: totalEarnings,
                thisMonth,
                lastMonth
            },
            breakdown,
            payouts
        })
    } catch (error) {
        console.error('GET /api/creator/earnings error', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
