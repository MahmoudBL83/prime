import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { stripe, STRIPE_CONFIG, SUBSCRIPTION_PRICE_IDS } from '@/config/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login first.' },
        { status: 401 }
      );
    }

    const { type, billingCycle, locale = 'en' } = await req.json();

    // Validate subscription type
    if (!['CATEGORY_A', 'CATEGORY_B', 'BUNDLE_AB'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid subscription type' },
        { status: 400 }
      );
    }

    // Validate billing cycle
    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return NextResponse.json(
        { error: 'Invalid billing cycle. Must be monthly or yearly.' },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true, 
        email: true, 
        name: true,
        stripeCustomerId: true 
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check for existing active subscription of the same type
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        type: type,
        status: 'ACTIVE',
        endDate: {
          gte: new Date(),
        },
      },
    });

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'You already have an active subscription of this type' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    let stripeCustomerId = user.stripeCustomerId;
    
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });
      
      stripeCustomerId = customer.id;
      
      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId },
      });
    }

    // Get the price ID for the subscription
    const priceId = (SUBSCRIPTION_PRICE_IDS as any)[type][billingCycle];

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: STRIPE_CONFIG.getSuccessUrl(locale),
      cancel_url: STRIPE_CONFIG.getCancelUrl(locale),
      metadata: {
        userId: user.id,
        subscriptionType: type,
        billingCycle: billingCycle,
        locale: locale,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          subscriptionType: type,
          billingCycle: billingCycle,
          locale: locale,
        },
      },
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });

  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
