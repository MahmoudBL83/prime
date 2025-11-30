import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Update payment link status
        const paymentLink = await prisma.paymentLink.findUnique({
          where: {
            stripeSessionId: session.id,
          },
        })

        if (paymentLink) {
          await prisma.paymentLink.update({
            where: {
              id: paymentLink.id,
            },
            data: {
              status: 'PAID',
              paidAt: new Date(),
            },
          })

          // Create or update subscription
          const userId = session.metadata?.userId
          if (userId) {
            // Check if user already has an active subscription
            const existingSubscription = await prisma.subscription.findFirst({
              where: {
                userId,
                status: 'ACTIVE',
              },
            })

            if (!existingSubscription) {
              // Create new subscription
              await prisma.subscription.create({
                data: {
                  userId,
                  type: 'BUNDLE_ABC', // Everything bundle (Prime subscription)
                  pricePerMonth: 0, // Will be updated based on Stripe subscription
                  status: 'ACTIVE',
                  startDate: new Date(),
                  endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
                  autoRenew: true,
                  stripeSubscriptionId: session.subscription as string,
                },
              })
            } else {
              // Update existing subscription
              await prisma.subscription.update({
                where: {
                  id: existingSubscription.id,
                },
                data: {
                  status: 'ACTIVE',
                  endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                  stripeSubscriptionId: session.subscription as string,
                },
              })
            }

            // Send confirmation email
            await sendConfirmationEmail(paymentLink.email, paymentLink.userId)
          }
        }
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session

        // Update payment link status to expired
        await prisma.paymentLink.updateMany({
          where: {
            stripeSessionId: session.id,
          },
          data: {
            status: 'EXPIRED',
          },
        })
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        // Update subscription status
        await prisma.subscription.updateMany({
          where: {
            stripeSubscriptionId: subscription.id,
          },
          data: {
            status: 'CANCELLED',
          },
        })
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function sendConfirmationEmail(email: string, userId: string) {
  // TODO: Send subscription confirmation email
  console.log(`
    ==================================================
    Subscription Confirmation Email
    ==================================================
    To: ${email}
    Subject: Welcome to Prime! Your Subscription is Active
    
    Congratulations! Your Prime subscription is now active.
    
    You now have unlimited access to:
    • All courses and learning paths
    • Live sessions with expert instructors
    • Interactive tools and community features
    • Professional certificates
    • Priority support
    
    Start learning: ${process.env.NEXTAUTH_URL}/my-learning
    
    Your subscription will automatically renew in 12 months.
    You can manage your subscription anytime in your account settings.
    
    Happy Learning!
    The Prime Team
    ==================================================
  `)
}
