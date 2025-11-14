import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
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
    const { isActive } = body;

    // Get current reward
    const reward = await prisma.reward.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
    }

    // Toggle by updating end date
    // If activating: set end date to future (or keep existing if valid)
    // If deactivating: set end date to past
    const now = new Date();
    let newEndDate = reward.endDate;

    if (isActive && (!reward.endDate || reward.endDate < now)) {
      // Activate: set end date to 30 days from now if not already set
      newEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    } else if (!isActive) {
      // Deactivate: set end date to yesterday
      newEndDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Update reward
    const updatedReward = await prisma.reward.update({
      where: { id: resolvedParams.id },
      data: {
        endDate: newEndDate,
      },
    });

    return NextResponse.json({ reward: updatedReward });
  } catch (error) {
    console.error('Error toggling reward:', error);
    return NextResponse.json(
      { error: 'Failed to toggle reward' },
      { status: 500 }
    );
  }
}
