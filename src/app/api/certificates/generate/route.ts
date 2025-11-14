/**
 * POST /api/certificates/generate
 * Generate certificate for a completed course enrollment
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { generateCertificate } from '@/services/certificateService';

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
    const { enrollmentId, grade } = body;

    if (!enrollmentId) {
      return NextResponse.json(
        { error: 'Enrollment ID is required' },
        { status: 400 }
      );
    }

    // Generate certificate (will validate completion inside)
    const certificate = await generateCertificate({
      enrollmentId,
      userId: session.user.id,
      courseId: body.courseId, // Will be verified against enrollment
      completionDate: new Date(),
      grade
    });

    return NextResponse.json({
      success: true,
      certificate
    });

  } catch (error: any) {
    console.error('Certificate generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate certificate' },
      { status: 500 }
    );
  }
}
