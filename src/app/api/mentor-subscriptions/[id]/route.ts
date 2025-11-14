import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/mentor-subscriptions/[id] - Get subscription details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const subscription = await prisma.mentorSubscription.findFirst({
      where: {
        id: params.id,
        studentId: session.user.id,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            arabicName: true,
            email: true,
            profileImage: true,
          },
        },
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Fetch creator details separately
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
        basicMonthlyPrice: true,
        basicYearlyPrice: true,
        premiumMonthlyPrice: true,
        premiumYearlyPrice: true,
        vipMonthlyPrice: true,
        vipYearlyPrice: true,
        subscriptionBenefits: true,
      },
    });

    return NextResponse.json({ ...subscription, creator });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

// PUT /api/mentor-subscriptions/[id] - Upgrade/downgrade subscription
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const body = await request.json();
    const { tier, billingPeriod, autoRenew } = body;

    // Verify ownership
    const subscription = await prisma.mentorSubscription.findFirst({
      where: {
        id: params.id,
        studentId: session.user.id,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Fetch creator pricing
    const creatorPricing = await prisma.creator.findUnique({
      where: { id: subscription.creatorId },
      select: {
        basicMonthlyPrice: true,
        basicYearlyPrice: true,
        premiumMonthlyPrice: true,
        premiumYearlyPrice: true,
        vipMonthlyPrice: true,
        vipYearlyPrice: true,
      },
    });

    // Prepare update data
    const updateData: any = {};

    // If tier is changing, recalculate benefits and price
    if (tier && tier !== subscription.tier) {
      const newBillingPeriod = billingPeriod || subscription.billingPeriod;
      let price = 0;
      let monthlyMessages = null;
      let monthlyMeetings = null;
      let meetingDuration = null;
      let prioritySupport = false;

      if (tier === 'BASIC') {
        price = newBillingPeriod === 'MONTHLY'
          ? creatorPricing?.basicMonthlyPrice || 99
          : creatorPricing?.basicYearlyPrice || 999;
        monthlyMessages = 10;
        monthlyMeetings = 1;
        meetingDuration = 30;
      } else if (tier === 'PREMIUM') {
        price = newBillingPeriod === 'MONTHLY'
          ? creatorPricing?.premiumMonthlyPrice || 199
          : creatorPricing?.premiumYearlyPrice || 1999;
        monthlyMessages = 50;
        monthlyMeetings = 4;
        meetingDuration = 60;
        prioritySupport = true;
      } else if (tier === 'VIP') {
        price = newBillingPeriod === 'MONTHLY'
          ? creatorPricing?.vipMonthlyPrice || 499
          : creatorPricing?.vipYearlyPrice || 4999;
        monthlyMessages = null; // Unlimited
        monthlyMeetings = null; // Unlimited
        meetingDuration = 90;
        prioritySupport = true;
      }

      updateData.tier = tier;
      updateData.price = price;
      updateData.monthlyMessages = monthlyMessages;
      updateData.monthlyMeetings = monthlyMeetings;
      updateData.meetingDuration = meetingDuration;
      updateData.prioritySupport = prioritySupport;
    }

    // If billing period is changing, recalculate price and end date
    if (billingPeriod && billingPeriod !== subscription.billingPeriod) {
      const currentTier = tier || subscription.tier;
      let price = 0;

      if (currentTier === 'BASIC') {
        price = billingPeriod === 'MONTHLY'
          ? creatorPricing?.basicMonthlyPrice || 99
          : creatorPricing?.basicYearlyPrice || 999;
      } else if (currentTier === 'PREMIUM') {
        price = billingPeriod === 'MONTHLY'
          ? creatorPricing?.premiumMonthlyPrice || 199
          : creatorPricing?.premiumYearlyPrice || 1999;
      } else if (currentTier === 'VIP') {
        price = billingPeriod === 'MONTHLY'
          ? creatorPricing?.vipMonthlyPrice || 499
          : creatorPricing?.vipYearlyPrice || 4999;
      }

      const endDate = new Date();
      if (billingPeriod === 'MONTHLY') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      updateData.billingPeriod = billingPeriod;
      updateData.price = price;
      updateData.endDate = endDate;
    }

    // Update autoRenew if provided
    if (typeof autoRenew !== 'undefined') {
      updateData.autoRenew = autoRenew;
    }

    // Apply updates
    const updatedSubscription = await prisma.mentorSubscription.update({
      where: { id: params.id },
      data: updateData,
    });

    // Fetch creator details separately
    const creator = await prisma.creator.findUnique({
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

    return NextResponse.json({ ...updatedSubscription, creator });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

// DELETE /api/mentor-subscriptions/[id] - Cancel subscription
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    // Verify ownership
    const subscription = await prisma.mentorSubscription.findFirst({
      where: {
        id: id,
        studentId: session.user.id,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Cancel subscription
    const cancelledSubscription = await prisma.mentorSubscription.update({
      where: { id: params.id },
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
