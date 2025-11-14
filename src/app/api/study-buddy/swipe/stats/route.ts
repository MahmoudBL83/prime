/**
 * GET /api/study-buddy/swipe/stats
 * Get swipe statistics for the current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getSwipeStats } from '@/services/swipeMatchingService';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const stats = await getSwipeStats(session.user.id);

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error: any) {
    console.error('Get swipe stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get stats' },
      { status: 500 }
    );
  }
}
