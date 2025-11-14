/**
 * POST /api/study-buddy/swipe/action
 * Record a swipe action (LIKE or PASS)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { recordSwipe } from '@/services/swipeMatchingService';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { swipedId, action } = body;

    if (!swipedId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (action !== 'LIKE' && action !== 'PASS') {
      return NextResponse.json(
        { error: 'Invalid action. Must be LIKE or PASS' },
        { status: 400 }
      );
    }

    if (swipedId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot swipe on yourself' },
        { status: 400 }
      );
    }

    const result = await recordSwipe(
      session.user.id,
      swipedId,
      action
    );

    return NextResponse.json({
      success: true,
      action: result.swipeAction.action,
      matched: result.matched,
      match: result.matched ? result.match : undefined
    });

  } catch (error: any) {
    console.error('Swipe action error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record swipe' },
      { status: 500 }
    );
  }
}
