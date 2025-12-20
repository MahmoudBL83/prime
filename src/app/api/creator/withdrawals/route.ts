import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch creator's withdrawals and balance info
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get creator profile
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id },
            include: {
                earnings: {
                    orderBy: { createdAt: 'desc' },
                    take: 50
                }
            }
        })

        if (!creator) {
            return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
        }

        // Get withdrawals
        const withdrawals = await prisma.creatorPayout.findMany({
            where: { creatorId: creator.id },
            orderBy: { requestedAt: 'desc' },
            take: 20
        })

        // Calculate balance
        const totalEarnings = creator.earnings.reduce((sum, e) => sum + e.amount, 0)
        const withdrawnAmount = withdrawals
            .filter(w => w.status === 'COMPLETED')
            .reduce((sum, w) => sum + w.amount, 0)
        const pendingWithdrawals = withdrawals
            .filter(w => w.status === 'PENDING' || w.status === 'PROCESSING')
            .reduce((sum, w) => sum + w.amount, 0)

        const availableBalance = totalEarnings - withdrawnAmount - pendingWithdrawals

        // Get monthly stats
        const now = new Date()
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

        const thisMonthEarnings = creator.earnings
            .filter(e => e.createdAt >= thisMonthStart)
            .reduce((sum, e) => sum + e.amount, 0)

        const lastMonthEarnings = creator.earnings
            .filter(e => e.createdAt >= lastMonthStart && e.createdAt <= lastMonthEnd)
            .reduce((sum, e) => sum + e.amount, 0)

        return NextResponse.json({
            balance: {
                total: totalEarnings,
                withdrawn: withdrawnAmount,
                pending: pendingWithdrawals,
                available: availableBalance
            },
            earnings: {
                thisMonth: thisMonthEarnings,
                lastMonth: lastMonthEarnings,
                total: totalEarnings
            },
            withdrawals: withdrawals.map(w => ({
                id: w.id,
                amount: w.amount,
                method: w.method,
                status: w.status,
                requestedAt: w.requestedAt.toISOString(),
                processedAt: w.processedAt?.toISOString(),
                completedAt: w.completedAt?.toISOString(),
                notes: w.notes
            })),
            minimumWithdrawal: 50, // EUR
            withdrawalMethods: [
                { id: 'bank_transfer', name: 'Bank Transfer', enabled: true },
                { id: 'paypal', name: 'PayPal', enabled: true },
                { id: 'vodafone_cash', name: 'Vodafone Cash', enabled: true },
                { id: 'instapay', name: 'InstaPay', enabled: true }
            ]
        })
    } catch (error) {
        console.error('Error fetching withdrawal info:', error)
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
    }
}

// POST - Request a new withdrawal
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { amount, method, accountDetails } = body

        if (!amount || !method || !accountDetails) {
            return NextResponse.json({ 
                error: 'Amount, method, and account details are required' 
            }, { status: 400 })
        }

        // Get creator profile
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id },
            include: {
                earnings: true
            }
        })

        if (!creator) {
            return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
        }

        // Calculate available balance
        const totalEarnings = creator.earnings.reduce((sum, e) => sum + e.amount, 0)
        const withdrawals = await prisma.creatorPayout.findMany({
            where: { creatorId: creator.id }
        })
        const withdrawnAmount = withdrawals
            .filter(w => w.status === 'COMPLETED')
            .reduce((sum, w) => sum + w.amount, 0)
        const pendingWithdrawals = withdrawals
            .filter(w => w.status === 'PENDING' || w.status === 'PROCESSING')
            .reduce((sum, w) => sum + w.amount, 0)

        const availableBalance = totalEarnings - withdrawnAmount - pendingWithdrawals

        // Validate amount
        const minimumWithdrawal = 50
        if (amount < minimumWithdrawal) {
            return NextResponse.json({ 
                error: `Minimum withdrawal amount is €${minimumWithdrawal}` 
            }, { status: 400 })
        }

        if (amount > availableBalance) {
            return NextResponse.json({ 
                error: `Insufficient balance. Available: €${availableBalance.toFixed(2)}` 
            }, { status: 400 })
        }

        // Create withdrawal request
        const withdrawal = await prisma.creatorPayout.create({
            data: {
                creatorId: creator.id,
                amount,
                method: method.toUpperCase(),
                accountDetails,
                status: 'PENDING'
            }
        })

        // Create notification for the creator (for confirmation)
        await prisma.notification.create({
            data: {
                userId: session.user.id,
                type: 'SYSTEM',
                title: 'Withdrawal Request Submitted',
                message: `Your withdrawal request of €${amount} via ${method} has been submitted and is pending review.`,
                data: {
                    withdrawalId: withdrawal.id,
                    creatorId: creator.id,
                    amount,
                    method
                }
            }
        })

        return NextResponse.json({
            success: true,
            withdrawal: {
                id: withdrawal.id,
                amount: withdrawal.amount,
                method: withdrawal.method,
                status: withdrawal.status,
                requestedAt: withdrawal.requestedAt.toISOString()
            },
            message: 'Withdrawal request submitted successfully. It will be processed within 2-3 business days.'
        })
    } catch (error) {
        console.error('Error creating withdrawal:', error)
        return NextResponse.json({ error: 'Failed to create withdrawal' }, { status: 500 })
    }
}
