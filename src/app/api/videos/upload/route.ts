import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MuxVideoService } from '@/lib/mux';
import { validateVideoFile } from '@/lib/video-utils';
import { z } from 'zod';

const uploadSchema = z.object({
    title: z.string().min(1, 'العنوان مطلوب'),
    titleAr: z.string().optional(),
    description: z.string().optional(),
    courseId: z.string().optional(),
    lessonId: z.string().optional(),
    fileName: z.string().min(1, 'اسم الملف مطلوب'),
    fileSize: z.number().positive('حجم الملف يجب أن يكون أكبر من صفر'),
    fileType: z.string().min(1, 'نوع الملف مطلوب'),
});

/**
 * Create a direct upload URL for video files
 * POST /api/videos/upload
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: 'يجب تسجيل الدخول لرفع الفيديوهات' },
                { status: 401 }
            );
        }

        // Check if user is a creator
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id },
        });

        if (!creator) {
            return NextResponse.json(
                { error: 'فقط المدربين يمكنهم رفع الفيديوهات' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const validation = uploadSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'بيانات غير صحيحة', details: validation.error.issues },
                { status: 400 }
            );
        }

        const { title, titleAr, description, courseId, lessonId, fileName, fileSize, fileType } = validation.data;

        // Validate file type and size
        const mockFile = { type: fileType, size: fileSize, name: fileName } as File;
        const fileValidation = validateVideoFile(mockFile);

        if (!fileValidation.valid) {
            return NextResponse.json(
                { error: fileValidation.error },
                { status: 400 }
            );
        }

        // Verify course ownership if courseId provided
        if (courseId) {
            const course = await prisma.course.findFirst({
                where: {
                    id: courseId,
                    creatorId: creator.id,
                },
            });

            if (!course) {
                return NextResponse.json(
                    { error: 'الكورس غير موجود أو ليس لديك صلاحية للتعديل عليه' },
                    { status: 404 }
                );
            }
        }

        // Verify lesson ownership if lessonId provided
        if (lessonId) {
            const lesson = await prisma.lesson.findFirst({
                where: {
                    id: lessonId,
                    course: {
                        creatorId: creator.id,
                    },
                },
                include: {
                    course: true,
                },
            });

            if (!lesson) {
                return NextResponse.json(
                    { error: 'الدرس غير موجود أو ليس لديك صلاحية للتعديل عليه' },
                    { status: 404 }
                );
            }
        }

        // Create Mux upload
        const muxUpload = await MuxVideoService.createDirectUpload({
            title,
            description,
            courseId: courseId || '',
            lessonId: lessonId || '',
            creatorId: creator.id,
        });

        // Create video asset record in database
        const videoAsset = await prisma.videoAsset.create({
            data: {
                muxAssetId: '', // Will be updated via webhook when asset is created
                uploadId: muxUpload.uploadId,
                status: 'UPLOADING',
                title,
                titleAr,
                description,
                originalFilename: fileName,
                fileSize,
                creatorId: creator.id,
                courseId,
                lessonId,
                metadata: {
                    originalFileType: fileType,
                    uploadSource: 'web',
                    uploadDate: new Date().toISOString(),
                },
            },
        });

        return NextResponse.json({
            uploadUrl: muxUpload.uploadUrl,
            uploadId: muxUpload.uploadId,
            videoAssetId: videoAsset.id,
            message: 'تم إنشاء رابط الرفع بنجاح',
        });

    } catch (error) {
        console.error('Video upload creation failed:', error);
        return NextResponse.json(
            { error: 'حدث خطأ أثناء إنشاء رابط الرفع' },
            { status: 500 }
        );
    }
}

/**
 * Get upload status
 * GET /api/videos/upload?uploadId=xxx
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: 'يجب تسجيل الدخول' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const uploadId = searchParams.get('uploadId');

        if (!uploadId) {
            return NextResponse.json(
                { error: 'معرف الرفع مطلوب' },
                { status: 400 }
            );
        }

        // Get video asset from database
        const videoAsset = await prisma.videoAsset.findFirst({
            where: {
                uploadId,
                creator: {
                    userId: session.user.id,
                },
            },
            include: {
                course: {
                    select: { id: true, title: true, titleAr: true },
                },
                lesson: {
                    select: { id: true, title: true, titleAr: true },
                },
            },
        });

        if (!videoAsset) {
            return NextResponse.json(
                { error: 'الفيديو غير موجود' },
                { status: 404 }
            );
        }

        // Get status from Mux
        const muxStatus = await MuxVideoService.getUploadStatus(uploadId);

        // Update database if status has changed
        if (muxStatus.assetId && !videoAsset.muxAssetId) {
            await prisma.videoAsset.update({
                where: { id: videoAsset.id },
                data: {
                    muxAssetId: muxStatus.assetId,
                    status: muxStatus.status === 'asset_created' ? 'PROCESSING' : 'UPLOADING',
                },
            });
        }

        return NextResponse.json({
            uploadId,
            videoAssetId: videoAsset.id,
            status: videoAsset.status,
            muxStatus: muxStatus.status,
            title: videoAsset.title,
            titleAr: videoAsset.titleAr,
            course: videoAsset.course,
            lesson: videoAsset.lesson,
            progress: muxStatus.status === 'asset_created' ? 50 :
                muxStatus.status === 'waiting' ? 25 :
                    muxStatus.status === 'errored' ? 0 : 100,
            error: muxStatus.error,
        });

    } catch (error) {
        console.error('Failed to get upload status:', error);
        return NextResponse.json(
            { error: 'فشل في الحصول على حالة الرفع' },
            { status: 500 }
        );
    }
}
