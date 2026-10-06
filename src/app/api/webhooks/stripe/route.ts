import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'
import { sendEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!secretKey || !webhookSecret) {
      return NextResponse.json(
        { error: 'Stripe webhook is not configured' },
        { status: 503 }
      )
    }

    const stripe = new Stripe(secretKey, {
      apiVersion: '2025-09-30.clover',
    })
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
  // Get user name for personalized email
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true }
  })
  
  const userName = user?.name || 'Valued Member'
  const baseUrl = process.env.NEXTAUTH_URL || 'https://primeplus.com'
  
  try {
    await sendEmail({
      to: email,
      subject: '🎉 Welcome to Prime! Your Subscription is Now Active',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #059669, #047857); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome to Prime!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 15px 0 0 0; font-size: 16px;">Your subscription is now active</p>
          </div>
          
          <div style="padding: 30px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px;">Hi ${userName},</p>
            
            <p style="color: #4B5563;">Congratulations! Your Prime subscription is now active and you have access to our entire library of premium content.</p>
            
            <div style="background: #F0FDF4; border: 1px solid #86EFAC; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <h3 style="margin: 0 0 15px 0; color: #166534;">✨ What's Included</h3>
              <ul style="margin: 0; padding-left: 20px; color: #4B5563;">
                <li style="margin-bottom: 8px;">📚 Unlimited access to all courses and learning paths</li>
                <li style="margin-bottom: 8px;">🎥 Live sessions with expert instructors</li>
                <li style="margin-bottom: 8px;">🛠️ Interactive tools and community features</li>
                <li style="margin-bottom: 8px;">🏆 Professional certificates upon completion</li>
                <li style="margin-bottom: 8px;">⭐ Priority support</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${baseUrl}/my-learning" style="display: inline-block; background: #059669; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">Start Learning Now</a>
            </div>
            
            <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin-top: 25px;">
              <p style="margin: 0; color: #6B7280; font-size: 14px;">
                <strong>📅 Renewal:</strong> Your subscription will automatically renew in 12 months. 
                You can manage your subscription anytime in your <a href="${baseUrl}/settings/subscription" style="color: #059669;">account settings</a>.
              </p>
            </div>
            
            <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
              Questions? Reply to this email or contact our support team.
            </p>
            
            <p style="margin-top: 30px;">
              Happy Learning! 🚀<br>
              <strong style="color: #059669;">The Prime Team</strong>
            </p>
          </div>
          
          <div style="padding: 20px; text-align: center; color: #9CA3AF; font-size: 12px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} Prime. All rights reserved.</p>
          </div>
        </div>
      `
    })
    
    console.log(`Subscription confirmation email sent to ${email}`)
  } catch (error) {
    console.error('Failed to send confirmation email:', error)
    // Don't throw - email failure shouldn't break the webhook
  }
}
