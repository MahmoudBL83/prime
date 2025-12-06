import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
        const status = searchParams.get('status')
        const page = parseInt(searchParams.get('page') || '1')
        const pageSize = parseInt(searchParams.get('pageSize') || '25')

        // Build where clause
        const where: any = {}
        if (status && status !== 'all') {
            where.status = status
        }

        // Fetch payouts with pagination
        const [payouts, totalCount, statusCounts] = await Promise.all([
            prisma.payout.findMany({
                where,
                take: pageSize,
                skip: (page - 1) * pageSize,
                orderBy: { createdAt: 'desc' },
                include: {
                    creator: {
                        include: {
                            user: {
                                select: { name: true, email: true }
                            }
                        }
                    }
                }
            }),
            prisma.payout.count({ where }),
            prisma.payout.groupBy({
                by: ['status'],
                _count: true,
                _sum: { amount: true }
            })
        ])

        // Format payouts for response
        const formattedPayouts = payouts.map(payout => ({
            id: payout.id,
            creatorId: payout.creatorId,
            creatorName: payout.creator?.user?.name || 'Unknown Creator',
            email: payout.creator?.user?.email || '',
            totalEarnings: payout.amount,
            platformFee: Math.round(payout.amount * 0.15), // 15% platform fee estimate
            processingFee: Math.round(payout.amount * 0.02), // 2% processing fee estimate
            netPayout: Math.round(payout.amount * 0.83),
            status: payout.status,
            periodStart: payout.periodStart.toISOString(),
            periodEnd: payout.periodEnd.toISOString(),
            createdAt: payout.createdAt.toISOString(),
            processedAt: payout.processedAt?.toISOString() || null,
            failureReason: payout.failureReason
        }))

        // Calculate stats
        const stats = {
            total: totalCount,
            pending: statusCounts.find(s => s.status === 'pending')?._count || 0,
            processing: statusCounts.find(s => s.status === 'processing')?._count || 0,
            completed: statusCounts.find(s => s.status === 'completed')?._count || 0,
            failed: statusCounts.find(s => s.status === 'failed')?._count || 0,
            totalAmount: statusCounts.reduce((sum, s) => sum + (s._sum.amount || 0), 0),
            pendingAmount: statusCounts.find(s => s.status === 'pending')?._sum?.amount || 0
        }

        return NextResponse.json({
            payouts: formattedPayouts,
            meta: {
                total: totalCount,
                page,
                pageSize,
                totalPages: Math.ceil(totalCount / pageSize)
            },
            stats
        })
    } catch (error) {
        console.error('Error fetching payouts:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await req.json()
        const { action, payoutId, payoutIds } = body

        if (action === 'approve' && payoutId) {
            const updated = await prisma.payout.update({
                where: { id: payoutId },
                data: { status: 'processing' }
            })
            return NextResponse.json({ success: true, payout: updated })
        }

        if (action === 'process' && payoutIds?.length) {
            const updated = await prisma.payout.updateMany({
                where: { id: { in: payoutIds } },
                data: { 
                    status: 'completed',
                    processedAt: new Date()
                }
            })
            return NextResponse.json({ success: true, count: updated.count })
        }

        if (action === 'fail' && payoutId) {
            const updated = await prisma.payout.update({
                where: { id: payoutId },
                data: { 
                    status: 'failed',
                    failureReason: body.reason || 'Unknown error'
                }
            })
            return NextResponse.json({ success: true, payout: updated })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    } catch (error) {
        console.error('Error processing payout action:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
