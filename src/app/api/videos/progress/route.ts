import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const progressSchema = z.object({
    videoAssetId: z.string().min(1, 'معرف الفيديو مطلوب'),
    currentTime: z.number().min(0, 'الوقت الحالي يجب أن يكون أكبر من أو يساوي صفر'),
    duration: z.number().positive('مدة الفيديو يجب أن تكون أكبر من صفر'),
    progress: z.number().min(0).max(100, 'التقدم يجب أن يكون بين 0 و 100'),
    completed: z.boolean(),
    courseId: z.string().optional(),
    lessonId: z.string().optional(),
    deviceInfo: z.object({
        userAgent: z.string().optional(),
        screenResolution: z.string().optional(),
        networkType: z.string().optional(),
    }).optional(),
});

/**
 * Save or update video progress for authenticated user
 * POST /api/videos/progress
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'يجب تسجيل الدخول لحفظ التقدم' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const validation = progressSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'بيانات غير صحيحة', details: validation.error.issues },
                { status: 400 }
            );
        }

        const {
            videoAssetId,
            currentTime,
            duration,
            progress,
            completed,
            courseId,
            lessonId,
            deviceInfo
        } = validation.data;

        // Verify video asset exists
        const videoAsset = await prisma.videoAsset.findUnique({
            where: { id: videoAssetId },
            include: {
                course: true,
                lesson: true,
            },
        });

        if (!videoAsset) {
            return NextResponse.json(
                { error: 'الفيديو غير موجود' },
                { status: 404 }
            );
        }

        // Check if user has access to this video (enrolled in course)
        if (videoAsset.courseId) {
            const enrollment = await prisma.enrollment.findFirst({
                where: {
                    userId: session.user.id,
                    courseId: videoAsset.courseId,
                },
            });

            if (!enrollment) {
                return NextResponse.json(
                    { error: 'ليس لديك صلاحية لمشاهدة هذا الفيديو' },
                    { status: 403 }
                );
            }
        }

        // Upsert video progress
        const videoProgress = await prisma.videoProgress.upsert({
            where: {
                userId_videoAssetId: {
                    userId: session.user.id,
                    videoAssetId,
                },
            },
            update: {
                currentTime,
                duration,
                progress,
                completed,
                lastWatched: new Date(),
                deviceInfo: deviceInfo || undefined,
            },
            create: {
                userId: session.user.id,
                videoAssetId,
                currentTime,
                duration,
                progress,
                completed,
                lastWatched: new Date(),
                deviceInfo: deviceInfo || undefined,
            },
        });

        // Update lesson completion if this is a lesson video and it's completed
        if (completed && videoAsset.lessonId) {
            // Check if this lesson is now completed
            const lessonProgress = await prisma.lessonProgress.findFirst({
                where: {
                    userId: session.user.id,
                    lessonId: videoAsset.lessonId,
                },
            });

            if (!lessonProgress) {
                // Create lesson progress record
                await prisma.lessonProgress.create({
                    data: {
                        userId: session.user.id,
                        lessonId: videoAsset.lessonId,
                        completed: true,
                        completedAt: new Date(),
                    },
                });
            } else if (!lessonProgress.completed) {
                // Update existing lesson progress
                await prisma.lessonProgress.update({
                    where: { id: lessonProgress.id },
                    data: {
                        completed: true,
                        completedAt: new Date(),
                    },
                });
            }
        }

        return NextResponse.json({
            success: true,
            progress: videoProgress,
            message: 'تم حفظ التقدم بنجاح',
        });

    } catch (error) {
        console.error('Failed to save video progress:', error);
        return NextResponse.json(
            { error: 'حدث خطأ أثناء حفظ التقدم' },
            { status: 500 }
        );
    }
}

/**
 * Get video progress for authenticated user
 * GET /api/videos/progress?videoAssetId=xxx
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'يجب تسجيل الدخول' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const videoAssetId = searchParams.get('videoAssetId');
        const courseId = searchParams.get('courseId');

        if (!videoAssetId && !courseId) {
            return NextResponse.json(
                { error: 'معرف الفيديو أو الكورس مطلوب' },
                { status: 400 }
            );
        }

        if (videoAssetId) {
            // Get progress for specific video
            const progress = await prisma.videoProgress.findUnique({
                where: {
                    userId_videoAssetId: {
                        userId: session.user.id,
                        videoAssetId,
                    },
                },
                include: {
                    videoAsset: {
                        select: {
                            id: true,
                            title: true,
                            titleAr: true,
                            duration: true,
                            thumbnailUrl: true,
                        },
                    },
                },
            });

            return NextResponse.json({
                progress,
                found: !!progress,
            });
        } else if (courseId) {
            // Get progress for all videos in course
            const courseProgress = await prisma.videoProgress.findMany({
                where: {
                    userId: session.user.id,
                    videoAsset: {
                        courseId,
                    },
                },
                include: {
                    videoAsset: {
                        select: {
                            id: true,
                            title: true,
                            titleAr: true,
                            duration: true,
                            thumbnailUrl: true,
                            lessonId: true,
                        },
                    },
                },
                orderBy: {
                    lastWatched: 'desc',
                },
            });

            return NextResponse.json({
                progress: courseProgress,
                totalVideos: courseProgress.length,
                completedVideos: courseProgress.filter(p => p.completed).length,
                totalWatchTime: courseProgress.reduce((sum, p) => sum + p.currentTime, 0),
            });
        }

    } catch (error) {
        console.error('Failed to get video progress:', error);
        return NextResponse.json(
            { error: 'فشل في جلب التقدم' },
            { status: 500 }
        );
    }
}
