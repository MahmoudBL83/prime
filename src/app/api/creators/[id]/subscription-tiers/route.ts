import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/creators/[id]/subscription-tiers - Get creator's subscription pricing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const creator = await prisma.creator.findUnique({
      where: { id },
      select: {
        id: true,
        basicMonthlyPrice: true,
        basicYearlyPrice: true,
        premiumMonthlyPrice: true,
        premiumYearlyPrice: true,
        vipMonthlyPrice: true,
        vipYearlyPrice: true,
        subscriptionBenefits: true,
        user: {
          select: {
            name: true,
            arabicName: true,
            profileImage: true,
          },
        },
      },
    });

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    // Define default benefits for each tier
    const defaultBenefits = {
      BASIC: {
        monthlyMessages: 10,
        monthlyMeetings: 1,
        meetingDuration: 30,
        accessToContent: true,
        prioritySupport: false,
      },
      PREMIUM: {
        monthlyMessages: 50,
        monthlyMeetings: 4,
        meetingDuration: 60,
        accessToContent: true,
        prioritySupport: true,
      },
      VIP: {
        monthlyMessages: null, // Unlimited
        monthlyMeetings: null, // Unlimited
        meetingDuration: 90,
        accessToContent: true,
        prioritySupport: true,
      },
    };

    // Merge with custom benefits if provided
    const customBenefits = creator.subscriptionBenefits as any || {};
    const benefits = {
      BASIC: { ...defaultBenefits.BASIC, ...(customBenefits.BASIC || {}) },
      PREMIUM: { ...defaultBenefits.PREMIUM, ...(customBenefits.PREMIUM || {}) },
      VIP: { ...defaultBenefits.VIP, ...(customBenefits.VIP || {}) },
    };

    // Build subscription tiers response
    const tiers = [
      {
        tier: 'BASIC',
        name: 'Basic',
        nameAr: 'أساسي',
        monthlyPrice: creator.basicMonthlyPrice || 99,
        yearlyPrice: creator.basicYearlyPrice || 999,
        yearlySavings: ((creator.basicMonthlyPrice || 99) * 12) - (creator.basicYearlyPrice || 999),
        benefits: benefits.BASIC,
      },
      {
        tier: 'PREMIUM',
        name: 'Premium',
        nameAr: 'متميز',
        monthlyPrice: creator.premiumMonthlyPrice || 199,
        yearlyPrice: creator.premiumYearlyPrice || 1999,
        yearlySavings: ((creator.premiumMonthlyPrice || 199) * 12) - (creator.premiumYearlyPrice || 1999),
        benefits: benefits.PREMIUM,
      },
      {
        tier: 'VIP',
        name: 'VIP',
        nameAr: 'كبار الشخصيات',
        monthlyPrice: creator.vipMonthlyPrice || 499,
        yearlyPrice: creator.vipYearlyPrice || 4999,
        yearlySavings: ((creator.vipMonthlyPrice || 499) * 12) - (creator.vipYearlyPrice || 4999),
        benefits: benefits.VIP,
      },
    ];

    return NextResponse.json({
      creatorId: creator.id,
      creatorName: creator.user.name,
      creatorNameAr: creator.user.arabicName,
      creatorImage: creator.user.profileImage,
      tiers,
    });
  } catch (error) {
    console.error('Error fetching subscription tiers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription tiers' },
      { status: 500 }
    );
  }
}
