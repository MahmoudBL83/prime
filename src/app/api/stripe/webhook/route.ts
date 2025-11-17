import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe, STRIPE_CONFIG } from '@/config/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
import { sendSubscriptionWelcomeEmail, sendPaymentReceiptEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = (await headers()).get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_CONFIG.webhookSecret
    );
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { userId, subscriptionType, billingCycle, locale } = session.metadata || {};

  if (!userId || !subscriptionType) {
    console.error('Missing metadata in checkout session');
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  );

  // Calculate price per month
  const totalAmount = subscription.items.data[0].price.unit_amount || 0;
  const pricePerMonth = billingCycle === 'yearly' 
    ? Math.round(totalAmount / 12 / 100)
    : Math.round(totalAmount / 100);

  // Create subscription in database with auto-enrollment
  let coursesCount = 0;
  let user: any = null;

  await prisma.$transaction(async (tx) => {
    // Get user details
    user = await tx.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Create subscription record
    const dbSubscription = await tx.subscription.create({
      data: {
        userId: userId,
        type: subscriptionType as any,
        status: 'ACTIVE',
        startDate: new Date(subscription.current_period_start * 1000),
        endDate: typeof subscription.current_period_end === 'number'
          ? new Date(subscription.current_period_end * 1000)
          : null,
        pricePerMonth: pricePerMonth,
        billingCycle: billingCycle as any,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
      },
    });

    // Auto-enroll in courses
    coursesCount = await autoEnrollUser(userId, subscriptionType, tx);

    console.log(`Created subscription ${dbSubscription.id} with ${coursesCount} enrollments`);
  });

  // Send welcome email
  if (user?.email) {
    try {
      await sendSubscriptionWelcomeEmail({
        userEmail: user.email,
        userName: user.name || 'Student',
        subscriptionType: subscriptionType,
        coursesCount: coursesCount,
        locale: locale || 'en',
      });
      console.log(`Sent welcome email to ${user.email}`);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't throw - email failure shouldn't fail the webhook
    }
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const dbSubscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!dbSubscription) {
    console.error('Subscription not found in database');
    return;
  }

  // Update subscription status
  const status = subscription.status === 'active' ? 'ACTIVE' 
    : subscription.status === 'canceled' ? 'CANCELLED'
    : subscription.status === 'past_due' ? 'PAST_DUE'
    : 'EXPIRED';

  await prisma.subscription.update({
    where: { id: dbSubscription.id },
    data: {
      status: status as any,
      endDate: new Date(subscription.current_period_end * 1000),
    },
  });

  console.log(`Updated subscription ${dbSubscription.id} to status ${status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const dbSubscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!dbSubscription) {
    console.error('Subscription not found in database');
    return;
  }

  await prisma.subscription.update({
    where: { id: dbSubscription.id },
    data: {
      status: 'CANCELLED',
      endDate: new Date(),
    },
  });

  console.log(`Cancelled subscription ${dbSubscription.id}`);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(
      invoice.subscription as string
    );
    
    await handleSubscriptionUpdated(subscription);
    
    // Send payment receipt email
    try {
      const dbSubscription = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: subscription.id },
        include: { user: { select: { email: true, name: true } } },
      });

      if (dbSubscription?.user?.email) {
        const nextBillingDate = new Date(subscription.current_period_end * 1000);
        
        await sendPaymentReceiptEmail({
          userEmail: dbSubscription.user.email,
          userName: dbSubscription.user.name || 'Student',
          amount: invoice.amount_paid / 100,
          currency: invoice.currency.toUpperCase(),
          subscriptionType: dbSubscription.type,
          billingCycle: dbSubscription.billingCycle || 'monthly',
          invoiceUrl: invoice.hosted_invoice_url || undefined,
          nextBillingDate: nextBillingDate.toLocaleDateString(),
          locale: 'en', // You can store this in user preferences
        });
        
        console.log(`Sent payment receipt to ${dbSubscription.user.email}`);
      }
    } catch (emailError) {
      console.error('Failed to send payment receipt:', emailError);
      // Don't throw - email failure shouldn't fail the webhook
    }
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.error(`Payment failed for invoice ${invoice.id}`);
  
  // TODO: Send payment failed email
  console.log(`TODO: Send payment failed email for invoice ${invoice.id}`);
}

// Auto-enrollment function
async function autoEnrollUser(
  userId: string,
  subscriptionType: string,
  tx: any
): Promise<number> {
  let courseCategories: string[] = [];

  if (subscriptionType === 'CATEGORY_A') {
    courseCategories = ['CATEGORY_A'];
  } else if (subscriptionType === 'CATEGORY_B') {
    courseCategories = ['CATEGORY_B'];
  } else if (subscriptionType === 'BUNDLE_AB') {
    courseCategories = ['CATEGORY_A', 'CATEGORY_B'];
  }

  // Get all published courses in the applicable categories
  const courses = await tx.course.findMany({
    where: {
      category: { in: courseCategories },
      published: true,
    },
    select: { id: true },
  });

  // Get existing enrollments to avoid duplicates
  const existingEnrollments = await tx.enrollment.findMany({
    where: {
      userId: userId,
      courseId: { in: courses.map((c: any) => c.id) },
    },
    select: { courseId: true },
  });

  const existingCourseIds = new Set(existingEnrollments.map((e: any) => e.courseId));

  // Create enrollments for courses not already enrolled
  const newEnrollments = courses
    .filter((course: any) => !existingCourseIds.has(course.id))
    .map((course: any) => ({
      userId: userId,
      courseId: course.id,
      progress: 0,
      enrolledAt: new Date(),
    }));

  if (newEnrollments.length > 0) {
    await tx.enrollment.createMany({
      data: newEnrollments,
      skipDuplicates: true,
    });
  }

  return newEnrollments.length;
}
