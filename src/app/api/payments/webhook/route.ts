import { NextRequest, NextResponse } from 'next/server'
import { PaymentStatus, Prisma, SubscriptionType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { paymobService } from '@/lib/paymob'

export async function POST(req: NextRequest) {
    try {
        // Get the HMAC signature from headers
        const hmac = req.headers.get('x-paymob-hmac') || req.headers.get('HMAC') || ''

        // Parse the webhook payload
        const payload = await req.json()

        // Verify the webhook signature
        const isValidSignature = paymobService.verifyWebhookSignature(payload, hmac)

        if (!isValidSignature) {
            console.error('Invalid webhook signature received')
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }

        // Extract transaction data
        const {
            id: transactionId,
            success,
            amount_cents: amountCents,
            currency,
            order: orderData,
            created_at: createdAt,
            source_data: sourceData,
            pending,
            error_occured: errorOccured,
        } = payload

        const merchantOrderId = payload.merchant_order_id || orderData?.merchant_order_id

        if (!merchantOrderId) {
            console.error('Missing merchant order id in webhook payload')
            return NextResponse.json({ error: 'Merchant order missing' }, { status: 400 })
        }

        const paymentTransaction = await prisma.paymentTransaction.findUnique({
            where: { merchantOrderId },
            include: {
                channel: {
                    include: { creator: true },
                },
            },
        })

        if (!paymentTransaction) {
            console.error('No pending payment transaction found for merchant order:', merchantOrderId)
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
        }

        if (!success) {
            await prisma.paymentTransaction.update({
                where: { id: paymentTransaction.id },
                data: {
                    status: PaymentStatus.FAILED,
                    failureReason: errorOccured ? 'Payment error reported by Paymob' : payload.data?.message ?? 'Payment failed',
                    failedAt: new Date(createdAt || Date.now()),
                    paymobTransactionId: transactionId?.toString(),
                },
            })

            return NextResponse.json({ success: false })
        }

        await prisma.$transaction(async (tx) => {
            const now = new Date()
            const subscriptionWhere: Prisma.SubscriptionWhereInput = {
                userId: paymentTransaction.userId,
                type: paymentTransaction.subscriptionType,
                status: 'active',
                endDate: { gte: new Date() },
            }

            subscriptionWhere.channelId = paymentTransaction.channelId ? paymentTransaction.channelId : null

            const activeSubscription = await tx.subscription.findFirst({
                where: subscriptionWhere,
            })

            let subscriptionId = activeSubscription?.id

            if (activeSubscription) {
                const extensionAnchor = activeSubscription.endDate && activeSubscription.endDate > now
                    ? activeSubscription.endDate
                    : now
                const newEndDate = new Date(extensionAnchor)
                newEndDate.setMonth(newEndDate.getMonth() + 1)

                await tx.subscription.update({
                    where: { id: activeSubscription.id },
                    data: {
                        endDate: newEndDate,
                        pricePerMonth: paymentTransaction.amount,
                        paymentMethodId: sourceData?.sub_type || sourceData?.type || 'card',
                        paymobOrderId: paymentTransaction.paymobOrderId,
                        paymobTransactionId: transactionId?.toString(),
                    },
                })
            } else {
                const startDate = now
                const endDate = new Date(startDate)
                endDate.setMonth(endDate.getMonth() + 1)

                const created = await tx.subscription.create({
                    data: {
                        userId: paymentTransaction.userId,
                        type: paymentTransaction.subscriptionType,
                        channelId: paymentTransaction.channelId ?? null,
                        pricePerMonth: paymentTransaction.amount,
                        status: 'active',
                        startDate,
                        endDate,
                        paymentMethodId: sourceData?.sub_type || sourceData?.type || 'card',
                        paymobOrderId: paymentTransaction.paymobOrderId,
                        paymobTransactionId: transactionId?.toString(),
                    },
                })
                subscriptionId = created.id

                // For Category A subscriptions grant enrollments
                if (paymentTransaction.subscriptionType === SubscriptionType.CATEGORY_A) {
                    const courses = await tx.course.findMany({
                        where: { category: 'CATEGORY_A', status: 'PUBLISHED' },
                        select: { id: true },
                    })

                    for (const course of courses) {
                        await tx.enrollment.upsert({
                            where: {
                                userId_courseId: {
                                    userId: paymentTransaction.userId,
                                    courseId: course.id,
                                },
                            },
                            update: { lastAccessedAt: now },
                            create: {
                                userId: paymentTransaction.userId,
                                courseId: course.id,
                                progress: 0,
                                lastAccessedAt: now,
                            },
                        })
                    }
                }
            }

            // Update payment transaction
            await tx.paymentTransaction.update({
                where: { id: paymentTransaction.id },
                data: {
                    status: PaymentStatus.PAID,
                    paidAt: new Date(createdAt || now),
                    paymobTransactionId: transactionId?.toString(),
                    paymentMethod: sourceData?.sub_type || sourceData?.type || 'card',
                    failureReason: null,
                    subscriptionId,
                },
            })

            // Creator earnings + payout placeholder
            if (paymentTransaction.subscriptionType === SubscriptionType.CATEGORY_C && paymentTransaction.channel) {
                const creatorEarnings = paymentTransaction.amount * 0.7

                await tx.creator.update({
                    where: { id: paymentTransaction.channel.creatorId },
                    data: {
                        totalEarnings: { increment: creatorEarnings },
                        totalSubscribers: { increment: 1 },
                    },
                })

                await tx.payout.create({
                    data: {
                        creatorId: paymentTransaction.channel.creatorId,
                        amount: creatorEarnings,
                        currency: currency || 'EGP',
                        status: 'pending',
                        periodStart: now,
                        periodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
                        bankTransferId: transactionId?.toString(),
                    },
                })
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Webhook processing error:', error)
        return NextResponse.json(
            { error: 'Failed to process webhook' },
            { status: 500 }
        )
    }
}

// Handle GET requests for webhook verification (optional)
export async function GET() {
    return NextResponse.json({ message: 'Webhook endpoint is active' })
}
