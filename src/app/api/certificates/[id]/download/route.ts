/**
 * GET /api/certificates/[certificateNumber]/download
 * Download certificate as PDF
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCertificateByNumber, incrementDownloadCount } from '@/services/certificateService';
import { generateCertificatePDF } from '@/services/pdfCertificateService';

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

    // Verify ownership
    if (certificate.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get locale from query params
    const { searchParams } = new URL(request.url);
    const locale = (searchParams.get('locale') || 'en') as 'en' | 'ar';

    // Increment download count
    await incrementDownloadCount(certificate.id);

    // Generate PDF
    const pdfBlob = await generateCertificatePDF({
      certificateNumber: certificate.certificateNumber,
      studentName: certificate.user.name || certificate.user.arabicName || 'Student',
      courseName: locale === 'ar' && certificate.course.titleAr
        ? certificate.course.titleAr
        : certificate.course.title,
      instructorName: certificate.course.creator.user.name ||
                     certificate.course.creator.user.arabicName ||
                     'Instructor',
      completionDate: new Date(certificate.completionDate),
      issueDate: new Date(certificate.issueDate),
      grade: certificate.grade || undefined,
      verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/verify/${certificate.certificateNumber}`
    }, locale);

    // Convert Blob to Buffer for Next.js response
    const buffer = Buffer.from(await pdfBlob.arrayBuffer());

    // Return PDF file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Certificate-${certificate.certificateNumber}.pdf"`,
      },
    });

  } catch (error: any) {
    console.error('Certificate download error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
