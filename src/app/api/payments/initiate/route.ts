import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PaymentStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { paymobService } from '@/lib/paymob'
import { z } from 'zod'

const initiatePaymentSchema = z.object({
    subscriptionType: z.enum(['CATEGORY_A', 'CATEGORY_C']),
    channelId: z.string().optional(),
    amount: z.number().positive(),
    currency: z.string().default('EGP'),
})

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const validation = initiatePaymentSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues },
                { status: 400 }
            )
        }

        const { subscriptionType, channelId, amount, currency } = validation.data

        // Get user details
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Validate subscription type and channel
        if (subscriptionType === 'CATEGORY_C' && !channelId) {
            return NextResponse.json(
                { error: 'Channel ID is required for Category C subscriptions' },
                { status: 400 }
            )
        }

        if (subscriptionType === 'CATEGORY_C' && channelId) {
            const channel = await prisma.creatorChannel.findUnique({
                where: { id: channelId },
            })

            if (!channel) {
                return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
            }
        }

        // Generate unique merchant order ID (used to correlate webhook events)
        const merchantOrderId = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`

        // Split user name into first and last name
        const nameParts = user.name.split(' ')
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''

        // Create payment request
        const paymentRequest = {
            amount: Math.round(amount * 100), // Convert to cents
            currency,
            orderId: merchantOrderId,
            userEmail: user.email,
            userPhone: user.phone || undefined,
            billingData: {
                first_name: firstName,
                last_name: lastName,
                email: user.email,
                phone_number: user.phone || undefined,
                city: 'Cairo', // Default city, can be made configurable
                country: 'EG',
            },
        }

        // Create payment with Paymob
        const paymentResult = await paymobService.createPaymentRequest(paymentRequest)

        const transaction = await prisma.paymentTransaction.create({
            data: {
                userId: session.user.id,
                subscriptionType,
                channelId: subscriptionType === 'CATEGORY_C' ? channelId : null,
                amount,
                currency,
            status: PaymentStatus.PENDING,
                merchantOrderId,
                paymobOrderId: paymentResult.paymobOrderId,
                paymobPaymentKey: paymentResult.paymentKey,
                paymobIframeUrl: paymentResult.iframeUrl,
                metadata: {
                    userAgent: req.headers.get('user-agent') || undefined,
                    ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
                },
            },
        })

        return NextResponse.json({
            success: true,
            paymentKey: paymentResult.paymentKey,
            iframeUrl: paymentResult.iframeUrl,
            transactionId: transaction.id,
            merchantOrderId,
            paymobOrderId: paymentResult.paymobOrderId,
        })
    } catch (error) {
        console.error('Payment initiation error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to initiate payment' },
            { status: 500 }
        )
    }
}
