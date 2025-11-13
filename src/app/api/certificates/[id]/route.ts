/**
 * GET /api/certificates/[certificateNumber]
 * Get certificate details by certificate number
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCertificateByNumber } from '@/services/certificateService';

export async function GET(
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

    const certificate = await getCertificateByNumber(params.certificateNumber);

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      );
    }

    // Check if user owns the certificate or if it's public
    if (certificate.userId !== session.user.id && !certificate.isPublic) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      certificate
    });

  } catch (error: any) {
    console.error('Certificate retrieval error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve certificate' },
      { status: 500 }
    );
  }
}
