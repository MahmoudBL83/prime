/**
 * POST /api/certificates/[certificateNumber]/share
 * Record social media share
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { recordShare } from '@/services/certificateService';

export async function POST(
  request: NextRequest,
  { params }: { params: { certificateNumber: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { platform } = body;

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform is required' },
        { status: 400 }
      );
    }

    const validPlatforms = ['linkedin', 'twitter', 'facebook', 'instagram', 'whatsapp'];
    if (!validPlatforms.includes(platform.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid platform' },
        { status: 400 }
      );
    }

    // Record the share
    const certificate = await recordShare(params.certificateNumber, platform);

    return NextResponse.json({
      success: true,
      message: 'Share recorded',
      certificate
    });

  } catch (error: any) {
    console.error('Certificate share error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record share' },
      { status: 500 }
    );
  }
}
