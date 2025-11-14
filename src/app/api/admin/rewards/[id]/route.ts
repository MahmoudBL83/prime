import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
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
    if (title && title.length < 10) {
      return NextResponse.json(
        { error: 'Title must be at least 10 characters' },
        { status: 400 }
      );
    }

    if (description && description.length < 20) {
      return NextResponse.json(
        { error: 'Description must be at least 20 characters' },
        { status: 400 }
      );
    }

    // Update reward
    const reward = await prisma.reward.update({
      where: { id: resolvedParams.id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(type && { type }),
        ...(value !== undefined && { value: value ? parseFloat(value) : null }),
        ...(currency && { currency }),
        ...(maxWinners !== undefined && {
          maxWinners: maxWinners ? parseInt(maxWinners) : null,
        }),
        ...(startDate !== undefined && {
          startDate: startDate ? new Date(startDate) : null,
        }),
        ...(endDate !== undefined && {
          endDate: endDate ? new Date(endDate) : null,
        }),
        ...(requirements && { requirements }),
        ...(courseId !== undefined && { courseId }),
        ...(imageUrl !== undefined && { imageUrl }),
      },
    });

    return NextResponse.json({ reward });
  } catch (error) {
    console.error('Error updating reward:', error);
    return NextResponse.json(
      { error: 'Failed to update reward' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if reward has winners
    const winnersCount = await prisma.rewardWinner.count({
      where: { rewardId: resolvedParams.id },
    });

    if (winnersCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete reward with existing winners' },
        { status: 400 }
      );
    }

    // Delete reward
    await prisma.reward.delete({
      where: { id: resolvedParams.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting reward:', error);
    return NextResponse.json(
      { error: 'Failed to delete reward' },
      { status: 500 }
    );
  }
}
