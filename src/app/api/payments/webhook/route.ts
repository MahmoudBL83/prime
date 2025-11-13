import { NextRequest, NextResponse } from 'next/server'
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
        } = payload

        console.log('Processing webhook:', { transactionId, success, amountCents })

        // Find the pending subscription using the order ID
        const subscription = await prisma.subscription.findFirst({
            where: {
                status: 'pending',
                // We'll need to store the Paymob order ID in the subscription
                // For now, we'll find the most recent pending subscription
            },
            include: {
                user: true,
                channel: {
                    include: {
                        creator: true,
                    },
                },
            },
        })

        if (!subscription) {
            console.error('No pending subscription found for transaction:', transactionId)
            return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
        }

        // Process the payment result
        if (success) {
            // Calculate subscription end date (1 month from start)
            const startDate = new Date(subscription.startDate)
            const endDate = new Date(startDate)
            endDate.setMonth(endDate.getMonth() + 1)

            await prisma.$transaction(async (tx) => {
                // Update subscription status
                await tx.subscription.update({
                    where: { id: subscription.id },
                    data: {
                        status: 'active',
                        endDate,
                        paymentMethodId: sourceData?.sub_type || 'card',
                        subscriptionId: transactionId.toString(),
                    },
                })

                // Update creator earnings if it's a Category C subscription
                if (subscription.type === 'CATEGORY_C' && subscription.channel) {
                    const creatorEarnings = subscription.pricePerMonth * 0.7 // 70% to creator

                    await tx.creator.update({
                        where: { id: subscription.channel.creatorId },
                        data: {
                            totalEarnings: {
                                increment: creatorEarnings,
                            },
                            totalSubscribers: {
                                increment: 1,
                            },
                        },
                    })
                }

                // Log the successful payment
                await tx.payout.create({
                    data: {
                        creatorId: subscription.channel?.creatorId || '',
                        amount: subscription.pricePerMonth,
                        currency: currency || 'EGP',
                        status: 'pending',
                        periodStart: startDate,
                        periodEnd: endDate,
                        bankTransferId: transactionId.toString(),
                    },
                })

                // Create enrollment for Category A subscriptions
                if (subscription.type === 'CATEGORY_A') {
                    // Get all available courses for Category A
                    const courses = await tx.course.findMany({
                        where: {
                            category: 'CATEGORY_A',
                            status: 'PUBLISHED',
                        },
                    })

                    // Create enrollments for all courses
                    for (const course of courses) {
                        await tx.enrollment.upsert({
                            where: {
                                userId_courseId: {
                                    userId: subscription.userId,
                                    courseId: course.id,
                                },
                            },
                            update: {
                                lastAccessedAt: new Date(),
                            },
                            create: {
                                userId: subscription.userId,
                                courseId: course.id,
                                progress: 0,
                                lastAccessedAt: new Date(),
                            },
                        })
                    }
                }
            })

            console.log(`Payment successful for subscription ${subscription.id}`)
        } else {
            // Payment failed
            await prisma.subscription.update({
                where: { id: subscription.id },
                data: {
                    status: 'cancelled',
                    cancelledAt: new Date(),
                },
            })

            console.log(`Payment failed for subscription ${subscription.id}`)
        }

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
