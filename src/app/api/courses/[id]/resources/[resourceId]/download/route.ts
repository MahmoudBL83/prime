/**
 * Course Resource Download API - Handle resource downloads
 * Provides secure downloads for course resources
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const resourceParamsSchema = z.object({
  courseId: z.string(),
  resourceId: z.string(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; resourceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      );
    }

    const { courseId, resourceId } = await params;
    const validation = resourceParamsSchema.safeParse({ courseId, resourceId });
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: validation.error.issues },
        { status: 400 }
      );
    }

    // Verify user has access to this course
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: session.user.id,
        courseId: courseId,
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: 'غير مشترك في هذا الكورس' },
        { status: 403 }
      );
    }

    // For now, return a placeholder response
    // TODO: Implement actual file serving logic
    return NextResponse.json(
      { 
        message: 'تحميل الملفات سيتم تفعيله قريباً',
        resourceId,
        downloadUrl: '#' 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Failed to download resource:', error);
    return NextResponse.json(
      { error: 'فشل في تحميل الملف' },
      { status: 500 }
    );
  }
}
