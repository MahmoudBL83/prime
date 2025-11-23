import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PaymentStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const checkStatusSchema = z.object({
    transactionId: z.string(),
})

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const validation = checkStatusSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues },
                { status: 400 }
            )
        }

        const { transactionId } = validation.data

        const transaction = await prisma.paymentTransaction.findFirst({
            where: {
                id: transactionId,
                userId: session.user.id,
            },
            include: {
                subscription: {
                    include: {
                        channel: {
                            include: {
                                creator: {
                                    include: { user: true },
                                },
                            },
                        },
                    },
                },
            },
        })

        if (!transaction) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
        }

        return NextResponse.json({
            transactionId: transaction.id,
            merchantOrderId: transaction.merchantOrderId,
            paymobOrderId: transaction.paymobOrderId,
            status: transaction.status,
            success: transaction.status === PaymentStatus.PAID,
            amount: transaction.amount,
            currency: transaction.currency,
            paidAt: transaction.paidAt,
            failedAt: transaction.failedAt,
            failureReason: transaction.failureReason,
            paymentMethod: transaction.paymentMethod,
            subscription: transaction.subscription
                ? {
                    id: transaction.subscription.id,
                    type: transaction.subscription.type,
                    status: transaction.subscription.status,
                    startDate: transaction.subscription.startDate,
                    endDate: transaction.subscription.endDate,
                    pricePerMonth: transaction.subscription.pricePerMonth,
                    channel: transaction.subscription.channel
                        ? {
                            id: transaction.subscription.channel.id,
                            name: transaction.subscription.channel.name,
                            nameAr: transaction.subscription.channel.nameAr,
                            creator: {
                                name: transaction.subscription.channel.creator.user.name,
                                arabicName: transaction.subscription.channel.creator.user.arabicName,
                            },
                        }
                        : null,
                }
                : null,
        })
    } catch (error) {
        console.error('Payment status check error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to check payment status' },
            { status: 500 }
        )
    }
}

// GET endpoint to check user's subscription status
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user's active subscriptions
        const subscriptions = await prisma.subscription.findMany({
            where: {
                userId: session.user.id,
                status: 'active',
                endDate: {
                    gte: new Date(), // Only active subscriptions
                },
            },
            include: {
                channel: {
                    include: {
                        creator: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        // Get recent payment transactions
        const recentTransactions = await prisma.paymentTransaction.findMany({
            where: {
                userId: session.user.id,
            },
            select: {
                id: true,
                status: true,
                amount: true,
                currency: true,
                merchantOrderId: true,
                paymobOrderId: true,
                paymobTransactionId: true,
                subscription: {
                    select: {
                        id: true,
                        type: true,
                        status: true,
                        channel: {
                            select: {
                                id: true,
                                name: true,
                                nameAr: true,
                            },
                        },
                    },
                },
                channel: {
                    select: {
                        id: true,
                        name: true,
                        nameAr: true,
                    },
                },
                createdAt: true,
                paidAt: true,
                failedAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 10,
        })

        return NextResponse.json({
            activeSubscriptions: subscriptions,
            recentTransactions,
            hasActiveSubscription: subscriptions.length > 0,
            subscriptionTypes: subscriptions.map(sub => sub.type),
        })
    } catch (error) {
        console.error('Subscription status fetch error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch subscription status' },
            { status: 500 }
        )
    }
}
