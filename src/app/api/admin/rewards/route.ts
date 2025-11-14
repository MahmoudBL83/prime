import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rewards = await prisma.reward.findMany({
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
        winners: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const now = new Date();
    const transformedRewards = rewards.map((reward) => ({
      id: reward.id,
      title: reward.title,
      description: reward.description,
      type: reward.type,
      value: reward.value,
      currency: reward.currency,
      maxWinners: reward.maxWinners,
      startDate: reward.startDate?.toISOString(),
      endDate: reward.endDate?.toISOString(),
      isActive: reward.endDate ? reward.endDate > now : false,
      currentWinners: reward.winners.length,
      courseId: reward.courseId,
      courseTitle: reward.course?.title,
    }));

    return NextResponse.json({
      rewards: transformedRewards,
    });
  } catch (error) {
    console.error('Error fetching rewards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rewards' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      type,
      value,
      currency,
      maxWinners,
      startDate,
      endDate,
      requirements,
      courseId,
      imageUrl,
    } = body;

    // Validation
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    if (title.length < 10) {
      return NextResponse.json(
        { error: 'Title must be at least 10 characters' },
        { status: 400 }
      );
    }

    if (description.length < 20) {
      return NextResponse.json(
        { error: 'Description must be at least 20 characters' },
        { status: 400 }
      );
    }

    // Create reward
    const reward = await prisma.reward.create({
      data: {
        title,
        description,
        type: type || 'BADGE',
        value: value ? parseFloat(value) : null,
        currency: currency || 'EGP',
        maxWinners: maxWinners ? parseInt(maxWinners) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        requirements: requirements || '{}',
        courseId: courseId || null,
        imageUrl: imageUrl || null,
      },
    });

    return NextResponse.json({ reward }, { status: 201 });
  } catch (error) {
    console.error('Error creating reward:', error);
    return NextResponse.json(
      { error: 'Failed to create reward' },
      { status: 500 }
    );
  }
}
