import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: {
          in: ['ACTIVE', 'PAST_DUE', 'CANCELLED']
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        type: true,
        status: true,
        startDate: true,
        endDate: true,
        pricePerMonth: true,
        billingCycle: true,
        stripeSubscriptionId: true,
        stripeCustomerId: true,
      }
    });

    if (!subscription) {
      return NextResponse.json({
        subscription: null,
        message: 'No active subscription found'
      });
    }

    // Count available courses based on subscription type
    let coursesCount = 0;
    if (subscription.type === 'CATEGORY_A') {
      coursesCount = await prisma.course.count({
        where: {
          category: 'CATEGORY_A',
          published: true
        }
      });
    } else if (subscription.type === 'CATEGORY_B') {
      coursesCount = await prisma.course.count({
        where: {
          category: 'CATEGORY_B',
          published: true
        }
      });
    } else if (subscription.type === 'BUNDLE_AB') {
      coursesCount = await prisma.course.count({
        where: {
          category: {
            in: ['CATEGORY_A', 'CATEGORY_B']
          },
          published: true
        }
      });
    }

    return NextResponse.json({
      subscription: {
        ...subscription,
        coursesCount
      }
    });
  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}
