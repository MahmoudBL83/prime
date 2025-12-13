import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

/**
 * Calculate creator's available balance from their subscriptions and completed transactions
 * Available = Total Earnings - Pending Payouts - Already Withdrawn
 */
async function calculateAvailableBalance(creatorId: string): Promise<{
    totalEarnings: number
    pendingPayouts: number
    alreadyWithdrawn: number
    available: number
}> {
    // Get creator's channels (they may have multiple)
    const creator = await prisma.creator.findUnique({
        where: { id: creatorId },
        include: { channels: true }
    })
    
    if (!creator?.channels?.length) {
        return { totalEarnings: 0, pendingPayouts: 0, alreadyWithdrawn: 0, available: 0 }
    }

    const channelIds = creator.channels.map(ch => ch.id)

    // Calculate total from subscription payments (completed transactions)
    const completedTransactions = await prisma.paymentTransaction.aggregate({
        where: {
            channelId: { in: channelIds },
            status: 'PAID'
        },
        _sum: { amount: true }
    })
    
    const totalEarnings = completedTransactions._sum?.amount || 0
    
    // Platform fee (typically 20%)
    const platformFee = totalEarnings * 0.20
    const creatorEarnings = totalEarnings - platformFee
    
    // Get pending withdrawals
    const pendingWithdrawals = await prisma.withdrawal.aggregate({
        where: {
            instructorId: creatorId,
            status: { in: ['PENDING', 'PROCESSING'] }
        },
        _sum: { amount: true }
    })
    const pendingPayouts = pendingWithdrawals._sum?.amount || 0
    
    // Get already withdrawn amount
    const completedWithdrawals = await prisma.withdrawal.aggregate({
        where: {
            instructorId: creatorId,
            status: 'COMPLETED'
        },
        _sum: { amount: true }
    })
    const alreadyWithdrawn = completedWithdrawals._sum?.amount || 0
    
    // Calculate available balance
    const available = Math.max(0, creatorEarnings - pendingPayouts - alreadyWithdrawn)
    
    return {
        totalEarnings: creatorEarnings,
        pendingPayouts,
        alreadyWithdrawn,
        available
    }
}

// POST - Request withdrawal
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { amount, method, accountDetails } = body

        if (!amount || amount <= 0) {
            return NextResponse.json(
                { error: 'Invalid withdrawal amount' },
                { status: 400 }
            )
        }

        // Minimum withdrawal amount (e.g., $10)
        const MIN_WITHDRAWAL = 10
        if (amount < MIN_WITHDRAWAL) {
            return NextResponse.json(
                { error: `Minimum withdrawal amount is $${MIN_WITHDRAWAL}` },
                { status: 400 }
            )
        }

        if (!method || !['BANK_TRANSFER', 'WALLET', 'PAYPAL'].includes(method)) {
            return NextResponse.json(
                { error: 'Invalid withdrawal method' },
                { status: 400 }
            )
        }

        // Check if user is a creator
        const instructor = await prisma.creator.findFirst({
            where: { userId: session.user.id }
        })

        if (!instructor) {
            return NextResponse.json(
                { error: 'Only creators can request withdrawals' },
                { status: 403 }
            )
        }

        // Calculate real available balance
        const balance = await calculateAvailableBalance(instructor.id)

        if (amount > balance.available) {
            return NextResponse.json(
                { 
                    error: 'Insufficient balance',
                    available: balance.available,
                    requested: amount
                },
                { status: 400 }
            )
        }

        // Create withdrawal request
        const withdrawal = await prisma.withdrawal.create({
            data: {
                instructorId: instructor.id,
                amount,
                method,
                accountDetails: JSON.stringify(accountDetails),
                status: 'PENDING',
                requestedAt: new Date()
            }
        })

        return NextResponse.json({
            success: true,
            withdrawal,
            message: 'Withdrawal request submitted successfully',
            balance: {
                available: balance.available - amount,
                pending: balance.pendingPayouts + amount
            }
        })
    } catch (error) {
        console.error('Error creating withdrawal:', error)
        return NextResponse.json(
            { error: 'Failed to create withdrawal request' },
            { status: 500 }
        )
    }
}

// GET - Get withdrawal history
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get instructor
        const instructor = await prisma.creator.findFirst({
            where: { userId: session.user.id }
        })

        if (!instructor) {
            return NextResponse.json(
                { error: 'Only creators can view withdrawals' },
                { status: 403 }
            )
        }

        const withdrawals = await prisma.withdrawal.findMany({
            where: {
                instructorId: instructor.id
            },
            orderBy: {
                requestedAt: 'desc'
            }
        })

        // Calculate current balance
        const balance = await calculateAvailableBalance(instructor.id)

        return NextResponse.json({ 
            withdrawals,
            balance
        })
    } catch (error) {
        console.error('Error fetching withdrawals:', error)
        return NextResponse.json(
            { error: 'Failed to fetch withdrawal history' },
            { status: 500 }
        )
    }
}
