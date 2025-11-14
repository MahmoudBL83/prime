/**
 * GET /api/study-buddy/swipe/candidates
 * Get potential study buddy candidates for swiping
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getSwipeCandidates } from '@/services/swipeMatchingService';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const candidates = await getSwipeCandidates(session.user.id, limit);

    return NextResponse.json({
      success: true,
      candidates,
      count: candidates.length
    });

  } catch (error: any) {
    console.error('Get candidates error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get candidates' },
      { status: 500 }
    );
  }
}
