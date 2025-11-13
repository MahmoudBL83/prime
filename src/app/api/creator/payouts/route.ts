import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const creator = await prisma.creator.findUnique({ where: { userId: session.user.id } })
        if (!creator) return NextResponse.json({ error: 'Creator not found' }, { status: 404 })

        const payouts = await prisma.creatorPayout.findMany({
            where: { creatorId: creator.id },
            orderBy: { requestedAt: 'desc' }
        })

        return NextResponse.json({ payouts })
    } catch (error) {
        console.error('GET /api/creator/payouts error', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const creator = await prisma.creator.findUnique({ where: { userId: session.user.id } })
        if (!creator) return NextResponse.json({ error: 'Creator not found' }, { status: 404 })

        const body = await request.json()
        const { amount, method, accountDetails } = body

        if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })

        // Calculate available balance (simple approach)
        const totalAgg = await prisma.creatorEarnings.aggregate({ where: { creatorId: creator.id }, _sum: { amount: true } })
        const totalEarnings = totalAgg._sum.amount || 0
        const payoutsAgg = await prisma.creatorPayout.aggregate({ where: { creatorId: creator.id, status: { not: 'CANCELLED' } }, _sum: { amount: true } })
        const reserved = payoutsAgg._sum.amount || 0
        const available = Math.max(0, totalEarnings - reserved)

        if (amount > available) return NextResponse.json({ error: 'Amount exceeds available balance' }, { status: 400 })

        // Minimal processing fee calculation (placeholder)
        const processingFee = 0
        const netAmount = amount - processingFee

        const payout = await prisma.creatorPayout.create({
            data: {
                creatorId: creator.id,
                amount,
                currency: 'EGP',
                status: 'PENDING',
                method: method || 'BANK_TRANSFER',
                accountDetails: accountDetails ? accountDetails : {},
                processingFee,
                netAmount
            }
        })

        return NextResponse.json({ payout }, { status: 201 })
    } catch (error) {
        console.error('POST /api/creator/payouts error', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
