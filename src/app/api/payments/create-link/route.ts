import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'
import nodemailer from 'nodemailer'

// Initialize Stripe only if the key is available
const stripeKey = process.env.STRIPE_SECRET_KEY
const stripe = stripeKey ? new Stripe(stripeKey, {
  apiVersion: '2025-09-30.clover',
}) : null

const gmailUser = process.env.GMAIL_USER
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD

const gmailTransporter = gmailUser && gmailAppPassword
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    })
  : null

export async function POST(request: Request) {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      console.error('Stripe is not configured. Please set STRIPE_SECRET_KEY in your environment variables.')
      return NextResponse.json(
        { error: 'Payment processing is not configured. Please contact support.' },
        { status: 503 }
      )
    }

    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { amount, description, successUrl, cancelUrl } = await request.json()

    // Create Stripe Checkout Session for payment link
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: session.user.email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: description || 'Prime Subscription',
              description: '€28.99/Mo For 12 Months - Unlimited access to all courses',
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
            recurring: {
              interval: 'month',
              interval_count: 1,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: session.user.id,
        subscriptionType: 'prime',
      },
      success_url: successUrl || `${process.env.NEXTAUTH_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXTAUTH_URL}/courses`,
      expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    })

    // Save payment link to database
    const paymentLink = await prisma.paymentLink.create({
      data: {
        userId: session.user.id,
        email: session.user.email,
        stripePaymentUrl: checkoutSession.url!,
        stripeSessionId: checkoutSession.id,
        amount,
        currency: 'eur',
        description,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    })

    // Send email with payment link (optional - don't fail if email fails)
    try {
      await sendPaymentEmail(session.user.email, checkoutSession.url!, session.user.name || 'Student')
    } catch (emailError) {
      console.error('Failed to send payment email:', emailError)
      // Continue anyway - payment link was created successfully
    }

    return NextResponse.json({
      success: true,
      paymentUrl: checkoutSession.url,
      paymentLinkId: paymentLink.id,
      expiresAt: paymentLink.expiresAt,
    })
  } catch (error) {
    console.error('Error creating payment link:', error)
    return NextResponse.json(
      { error: 'Failed to create payment link' },
      { status: 500 }
    )
  }
}

async function sendPaymentEmail(email: string, paymentUrl: string, userName: string) {
  if (!gmailTransporter || !gmailUser) {
    console.warn('Gmail credentials are not configured. Skipping payment email.')
    return
  }

  await gmailTransporter.sendMail({
    from: `Prime <${gmailUser}>`,
    to: email,
    subject: 'Complete Your Prime Subscription Payment',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #111;">
        <p style="font-size: 16px;">Hi ${userName},</p>
        <p style="margin: 16px 0;">Thank you for choosing Prime! To complete your subscription, click the secure payment link below:</p>
        <p style="margin: 24px 0;"><a href="${paymentUrl}" style="background: #0071e3; color: #fff; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: 600;">Complete Payment</a></p>
        <p style="margin: 16px 0;">This link expires in 24 hours.</p>
        <p style="margin: 16px 0;">Subscription details:</p>
        <ul style="margin: 0 0 16px 20px;">
          <li>€28.99/Mo for 12 Months</li>
          <li>Unlimited access to all courses</li>
          <li>Live sessions with expert instructors</li>
          <li>Certificates upon completion</li>
          <li>Cancel anytime</li>
        </ul>
        <p style="margin: 16px 0;">If you have any questions, reply to this email and our team will help.</p>
        <p style="margin-top: 24px;">Best regards,<br/>The Prime Team</p>
      </div>
    `,
    text: `Hi ${userName},\n\nThank you for choosing Prime! To complete your subscription, open the payment link below (expires in 24 hours):\n${paymentUrl}\n\nSubscription details:\n• €28.99/Mo for 12 Months\n• Unlimited access to all courses\n• Live sessions with expert instructors\n• Certificates upon completion\n• Cancel anytime\n\nIf you have any questions, reply to this email.\n\nBest regards,\nThe Prime Team`,
  })
}
