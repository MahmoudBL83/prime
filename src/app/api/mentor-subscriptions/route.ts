import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/mentor-subscriptions - Get user's active subscriptions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const subscriptions = await prisma.mentorSubscription.findMany({
      where: {
        studentId: session.user.id,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            arabicName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Fetch creator details for each subscription
    const subscriptionsWithCreators = await Promise.all(
      subscriptions.map(async (subscription) => {
        const creator = await prisma.creator.findUnique({
          where: { id: subscription.creatorId },
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
                arabicName: true,
                profileImage: true,
                bio: true,
              },
            },
            expertise: true,
            hourlyRate: true,
            totalSubscribers: true,
          },
        });
        return { ...subscription, creator };
      })
    );

    return NextResponse.json(subscriptionsWithCreators);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

// POST /api/mentor-subscriptions - Create new subscription
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { creatorId, tier, billingPeriod } = body;

    // Validate required fields
    if (!creatorId || !tier || !billingPeriod) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already has an active subscription with this creator
    const existingSubscription = await prisma.mentorSubscription.findFirst({
      where: {
        studentId: session.user.id,
        creatorId,
        status: {
          in: ['ACTIVE', 'PAUSED'],
        },
      },
    });

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'You already have an active subscription with this mentor' },
        { status: 400 }
      );
    }

    // Get creator pricing
    const creatorPricing = await prisma.creator.findUnique({
      where: { id: creatorId },
      select: {
        basicMonthlyPrice: true,
        basicYearlyPrice: true,
        premiumMonthlyPrice: true,
        premiumYearlyPrice: true,
        vipMonthlyPrice: true,
        vipYearlyPrice: true,
        subscriptionBenefits: true,
      },
    });

    if (!creatorPricing) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    // Calculate price based on tier and billing period
    let price = 0;
    let monthlyMessages = null;
    let monthlyMeetings = null;
    let meetingDuration = null;
    let accessToContent = true;
    let prioritySupport = false;

    if (tier === 'BASIC') {
      price = billingPeriod === 'MONTHLY' 
        ? creatorPricing.basicMonthlyPrice || 99
        : creatorPricing.basicYearlyPrice || 999;
      monthlyMessages = 10;
      monthlyMeetings = 1;
      meetingDuration = 30;
    } else if (tier === 'PREMIUM') {
      price = billingPeriod === 'MONTHLY'
        ? creatorPricing.premiumMonthlyPrice || 199
        : creatorPricing.premiumYearlyPrice || 1999;
      monthlyMessages = 50;
      monthlyMeetings = 4;
      meetingDuration = 60;
      prioritySupport = true;
    } else if (tier === 'VIP') {
      price = billingPeriod === 'MONTHLY'
        ? creatorPricing.vipMonthlyPrice || 499
        : creatorPricing.vipYearlyPrice || 4999;
      monthlyMessages = null; // Unlimited
      monthlyMeetings = null; // Unlimited
      meetingDuration = 90;
      prioritySupport = true;
    }

    // Calculate end date
    const startDate = new Date();
    const endDate = new Date(startDate);
    if (billingPeriod === 'MONTHLY') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Create subscription
    const subscription = await prisma.mentorSubscription.create({
      data: {
        studentId: session.user.id,
        creatorId,
        tier,
        billingPeriod,
        price,
        status: 'ACTIVE',
        startDate,
        endDate,
        autoRenew: true,
        paymentStatus: 'PENDING', // In production, integrate with payment gateway
        monthlyMessages,
        monthlyMeetings,
        meetingDuration,
        accessToContent,
        prioritySupport,
      },
    });

    // Fetch creator details separately
    const creatorDetails = await prisma.creator.findUnique({
      where: { id: creatorId },
      select: {
        id: true,
        user: {
          select: {
            name: true,
            arabicName: true,
            profileImage: true,
          },
        },
      },
    });

    // Update creator's total subscribers count
    await prisma.creator.update({
      where: { id: creatorId },
      data: {
        totalSubscribers: {
          increment: 1,
        },
      },
    });

    // Return subscription with creator data
    return NextResponse.json({ ...subscription, creator: creatorDetails }, { status: 201 });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}

// PUT /api/mentor-subscriptions - Update subscription settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subscriptionId, autoRenew } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const subscription = await prisma.mentorSubscription.findFirst({
      where: {
        id: subscriptionId,
        studentId: session.user.id,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Update subscription
    const updatedSubscription = await prisma.mentorSubscription.update({
      where: { id: subscriptionId },
      data: {
        autoRenew: autoRenew ?? subscription.autoRenew,
      },
    });

    // Fetch creator details separately
    const creatorDetails = await prisma.creator.findUnique({
      where: { id: updatedSubscription.creatorId },
      select: {
        id: true,
        user: {
          select: {
            name: true,
            arabicName: true,
            profileImage: true,
          },
        },
      },
    });

    return NextResponse.json({ ...updatedSubscription, creator: creatorDetails });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

// DELETE /api/mentor-subscriptions - Cancel subscription
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('id');

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const subscription = await prisma.mentorSubscription.findFirst({
      where: {
        id: subscriptionId,
        studentId: session.user.id,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Cancel subscription (soft delete - change status)
    const cancelledSubscription = await prisma.mentorSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'CANCELLED',
        autoRenew: false,
      },
    });

    // Decrement creator's total subscribers count
    await prisma.creator.update({
      where: { id: subscription.creatorId },
      data: {
        totalSubscribers: {
          decrement: 1,
        },
      },
    });

    return NextResponse.json({
      message: 'Subscription cancelled successfully',
      subscription: cancelledSubscription,
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
