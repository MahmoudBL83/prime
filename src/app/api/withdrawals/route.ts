import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

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

        if (!method || !['BANK_TRANSFER', 'WALLET', 'PAYPAL'].includes(method)) {
            return NextResponse.json(
                { error: 'Invalid withdrawal method' },
                { status: 400 }
            )
        }

        // Check if user is a creator
        const instructor = await prisma.instructor.findFirst({
            where: { userId: session.user.id }
        })

        if (!instructor) {
            return NextResponse.json(
                { error: 'Only creators can request withdrawals' },
                { status: 403 }
            )
        }

        // TODO: Calculate available balance from subscriptions
        // For now, using a placeholder
        const availableBalance = 12450 // This should come from real calculations

        if (amount > availableBalance) {
            return NextResponse.json(
                { error: 'Insufficient balance' },
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
            message: 'Withdrawal request submitted successfully'
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
        const instructor = await prisma.instructor.findFirst({
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

        return NextResponse.json({ withdrawals })
    } catch (error) {
        console.error('Error fetching withdrawals:', error)
        return NextResponse.json(
            { error: 'Failed to fetch withdrawal history' },
            { status: 500 }
        )
    }
}
