import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { paymobService } from '@/lib/paymob'
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

        // Check payment status with Paymob
        const paymentStatus = await paymobService.getPaymentStatus(transactionId)

        // Find the associated subscription
        const subscription = await prisma.subscription.findFirst({
            where: {
                subscriptionId: transactionId,
                userId: session.user.id,
            },
            include: {
                user: true,
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
        })

        if (!subscription) {
            return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
        }

        // Return comprehensive status information
        const statusResponse = {
            transactionId,
            success: paymentStatus.success,
            amount: paymentStatus.amount_cents / 100, // Convert from cents
            currency: paymentStatus.currency,
            status: paymentStatus.success ? 'completed' : 'failed',
            createdAt: paymentStatus.created_at,
            processedAt: paymentStatus.processed_at,
            subscription: {
                id: subscription.id,
                type: subscription.type,
                status: subscription.status,
                startDate: subscription.startDate,
                endDate: subscription.endDate,
                pricePerMonth: subscription.pricePerMonth,
                channel: subscription.channel
                    ? {
                        id: subscription.channel.id,
                        name: subscription.channel.name,
                        nameAr: subscription.channel.nameAr,
                        creator: {
                            name: subscription.channel.creator.user.name,
                            arabicName: subscription.channel.creator.user.arabicName,
                        },
                    }
                    : null,
            },
            paymentMethod: {
                type: paymentStatus.source_data?.type || 'card',
                subType: paymentStatus.source_data?.sub_type || 'unknown',
                pan: paymentStatus.source_data?.pan
                    ? `****${paymentStatus.source_data.pan.slice(-4)}`
                    : null,
            },
        }

        return NextResponse.json(statusResponse)
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
        const recentTransactions = await prisma.subscription.findMany({
            where: {
                userId: session.user.id,
                subscriptionId: {
                    not: null,
                },
            },
            select: {
                id: true,
                type: true,
                status: true,
                pricePerMonth: true,
                subscriptionId: true,
                startDate: true,
                endDate: true,
                createdAt: true,
                channel: {
                    select: {
                        id: true,
                        name: true,
                        nameAr: true,
                    },
                },
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
