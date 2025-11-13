/**
 * GET /api/user/certificates
 * Get all certificates for the logged-in user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserCertificates } from '@/services/certificateService';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const certificates = await getUserCertificates(session.user.id);

    return NextResponse.json({
      success: true,
      certificates,
      count: certificates.length
    });

  } catch (error: any) {
    console.error('User certificates error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve certificates' },
      { status: 500 }
    );
  }
}
