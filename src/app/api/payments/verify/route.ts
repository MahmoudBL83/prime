import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripeKey = process.env.STRIPE_SECRET_KEY
const stripe = stripeKey ? new Stripe(stripeKey, {
  apiVersion: '2025-09-30.clover',
}) : null

export async function POST(request: Request) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment processing is not configured' },
        { status: 503 }
      )
    }

    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Check if payment link exists and is paid
    let paymentLink = await prisma.paymentLink.findUnique({
      where: {
        stripeSessionId: sessionId,
      },
    })

    let checkoutSession: Stripe.Checkout.Session | null = null

    if (!paymentLink) {
      // Attempt to retrieve from Stripe directly (safety net when webhook missed)
      checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)

      if (!checkoutSession?.metadata?.userId) {
        return NextResponse.json(
          { error: 'Payment not found' },
          { status: 404 }
        )
      }

      paymentLink = await prisma.paymentLink.create({
        data: {
          userId: checkoutSession.metadata.userId,
          email: checkoutSession.customer_details?.email || checkoutSession.customer_email || '',
          stripePaymentUrl: checkoutSession.url || '',
          stripeSessionId: checkoutSession.id,
          amount: checkoutSession.amount_total ? checkoutSession.amount_total / 100 : 0,
          currency: checkoutSession.currency || 'eur',
          description: checkoutSession.metadata?.description,
          status: checkoutSession.payment_status === 'paid' ? 'PAID' : 'PENDING',
          paidAt: checkoutSession.payment_status === 'paid' ? new Date() : null,
          expiresAt: checkoutSession.expires_at ? new Date(checkoutSession.expires_at * 1000) : null,
        },
      })
    }

    if (paymentLink.status !== 'PAID') {
      checkoutSession = checkoutSession ?? await stripe.checkout.sessions.retrieve(sessionId)

      if (checkoutSession.payment_status === 'paid') {
        paymentLink = await prisma.paymentLink.update({
          where: { id: paymentLink.id },
          data: {
            status: 'PAID',
            paidAt: new Date(),
          },
        })

        await activateSubscription(paymentLink.userId, checkoutSession.subscription as string | undefined)
      } else {
        return NextResponse.json(
          { error: 'Payment not completed', status: paymentLink.status },
          { status: 400 }
        )
      }
    }

    // Check if user has active subscription
    let subscription = await prisma.subscription.findFirst({
      where: {
        userId: paymentLink.userId,
        status: 'ACTIVE',
      },
    })

    if (!subscription) {
      await activateSubscription(paymentLink.userId)
      subscription = await prisma.subscription.findFirst({
        where: {
          userId: paymentLink.userId,
          status: 'ACTIVE',
        },
      })
    }

    return NextResponse.json({
      verified: true,
      userId: paymentLink.userId,
      paymentStatus: paymentLink.status,
      paidAt: paymentLink.paidAt,
      subscription: subscription ? {
        id: subscription.id,
        type: subscription.type,
        endDate: subscription.endDate,
      } : null,
    })
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}

async function activateSubscription(userId: string, stripeSubscriptionId?: string) {
  const existingSubscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
    },
  })

  if (!existingSubscription) {
    await prisma.subscription.create({
      data: {
        userId,
        type: 'BUNDLE_ABC',
        pricePerMonth: 28.99,
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        autoRenew: true,
        stripeSubscriptionId,
      },
    })
    return
  }

  await prisma.subscription.update({
    where: { id: existingSubscription.id },
    data: {
      status: 'ACTIVE',
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      stripeSubscriptionId: stripeSubscriptionId || existingSubscription.stripeSubscriptionId,
    },
  })
}
