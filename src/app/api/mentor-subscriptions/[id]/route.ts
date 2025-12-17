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
        id: id,
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
        monthlyPrice: true, // Single tier in EUR
        basicMonthlyPrice: true, // Fallback
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

    // Fetch creator pricing
    const creatorPricing = await prisma.creator.findUnique({
      where: { id: subscription.creatorId },
      select: {
        monthlyPrice: true,  // Single subscription price
        basicMonthlyPrice: true, // Fallback
        basicYearlyPrice: true,
      },
    });

    // Prepare update data
    const updateData: any = {};

    // Single subscription model - no tier changes needed
    // All subscribers get full access with same pricing

    // If billing period is changing, recalculate price and end date
    if (billingPeriod && billingPeriod !== subscription.billingPeriod) {
      const monthlyPrice = creatorPricing?.monthlyPrice || creatorPricing?.basicMonthlyPrice || 49;
      const yearlyPrice = (creatorPricing?.basicYearlyPrice) || (monthlyPrice * 10); // 2 months free

      const price = billingPeriod === 'MONTHLY' ? monthlyPrice : yearlyPrice;

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
      where: { id: id },
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
      where: { id: id },
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
