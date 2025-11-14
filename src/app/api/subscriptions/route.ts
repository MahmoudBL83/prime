import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PaymobService } from '@/lib/paymob'

// Egyptian pricing (in EGP cents)
const PRICING = {
    CATEGORY_A: {
        monthly: 9900, // 99 EGP
        quarterly: 26900, // 269 EGP (save 10%)
        yearly: 99900 // 999 EGP (save 15%)
    },
    CATEGORY_C: {
        monthly: 4900, // 49 EGP per creator channel
        quarterly: 13900, // 139 EGP (save 5%)
        yearly: 49900 // 499 EGP (save 15%)
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { subscriptionType, plan, channelId } = body

        // Validate input
        if (!subscriptionType || !['CATEGORY_A', 'CATEGORY_C'].includes(subscriptionType)) {
            return NextResponse.json({ error: 'Invalid subscription type' }, { status: 400 })
        }

        if (!plan || !['monthly', 'quarterly', 'yearly'].includes(plan)) {
            return NextResponse.json({ error: 'Invalid plan duration' }, { status: 400 })
        }

        if (subscriptionType === 'CATEGORY_C' && !channelId) {
            return NextResponse.json({ error: 'Channel ID required for creator subscriptions' }, { status: 400 })
        }

        // Check if user already has active subscription of this type
        const existingSubscription = await prisma.subscription.findFirst({
            where: {
                userId: session.user.id,
                type: subscriptionType,
                channelId: subscriptionType === 'CATEGORY_C' ? channelId : null,
                status: 'ACTIVE'
            }
        })

        if (existingSubscription) {
            return NextResponse.json({
                error: 'You already have an active subscription of this type'
            }, { status: 400 })
        }

        // Calculate price and end date
        const pricing = PRICING[subscriptionType as keyof typeof PRICING]
        const priceInCents = pricing[plan as keyof typeof pricing]
        const priceInEGP = priceInCents / 100

        // Calculate end date
        const startDate = new Date()
        const endDate = new Date(startDate)
        switch (plan) {
            case 'monthly':
                endDate.setMonth(endDate.getMonth() + 1)
                break
            case 'quarterly':
                endDate.setMonth(endDate.getMonth() + 3)
                break
            case 'yearly':
                endDate.setFullYear(endDate.getFullYear() + 1)
                break
        }

        // Generate unique order ID
        const orderId = `SUB_${subscriptionType}_${Date.now()}_${session.user.id}`

        // Get user details
        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Prepare payment request for Paymob
        const paymentRequest = {
            amount: priceInCents,
            currency: 'EGP',
            orderId,
            userEmail: user.email,
            userPhone: user.phone || '',
            billingData: {
                first_name: user.name.split(' ')[0] || 'User',
                last_name: user.name.split(' ').slice(1).join(' ') || 'Name',
                email: user.email,
                phone_number: user.phone || '+201000000000',
                city: 'Cairo',
                country: 'EG',
                apartment: '',
                floor: '',
                street: '',
                building: '',
                state: 'Cairo',
                postal_code: '11511'
            }
        }

        // Create payment with Paymob
        const paymobService = new PaymobService()
        const paymentResult = await paymobService.createPaymentRequest(paymentRequest)

        // Store pending subscription in database
        const subscription = await prisma.subscription.create({
            data: {
                userId: session.user.id,
                type: subscriptionType,
                channelId: subscriptionType === 'CATEGORY_C' ? channelId : null,
                pricePerMonth: priceInEGP,
                status: 'PENDING',
                startDate,
                endDate,
                paymentMethodId: paymentResult.paymentKey,
                subscriptionId: orderId
            }
        })

        return NextResponse.json({
            success: true,
            subscription: {
                id: subscription.id,
                type: subscriptionType,
                plan,
                price: priceInEGP,
                currency: 'EGP',
                endDate: endDate.toISOString()
            },
            payment: {
                paymentKey: paymentResult.paymentKey,
                iframeUrl: paymentResult.iframeUrl,
                orderId: paymentResult.orderId
            }
        })

    } catch (error) {
        console.error('Subscription creation error:', error)
        return NextResponse.json(
            { error: 'Failed to create subscription' },
            { status: 500 }
        )
    }
}

// GET endpoint to fetch user subscriptions
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const subscriptions = await prisma.subscription.findMany({
            where: {
                userId: session.user.id
            },
            include: {
                channel: {
                    include: {
                        creator: {
                            include: {
                                user: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json({ subscriptions })

    } catch (error) {
        console.error('Fetch subscriptions error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch subscriptions' },
            { status: 500 }
        )
    }
}
