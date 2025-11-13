import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkAndGenerateCertificate } from '@/services/certificateService';

// GET /api/lessons/[id]/progress - Get user's progress for a lesson
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const lessonId = params.id;

        // Get existing progress
        const progress = await prisma.lessonProgress.findUnique({
            where: {
                userId_lessonId: {
                    userId: session.user.id,
                    lessonId,
                },
            },
            select: {
                id: true,
                completed: true,
                completedAt: true,
                lastPosition: true,
                watchTime: true,
                updatedAt: true,
            },
        });

        if (!progress) {
            return NextResponse.json({
                lastPosition: 0,
                watchTime: 0,
                completed: false,
                completedAt: null,
            });
        }

        return NextResponse.json(progress);
    } catch (error) {
        console.error('Error fetching lesson progress:', error);
        return NextResponse.json(
            { error: 'Failed to fetch progress' },
            { status: 500 }
        );
    }
}

// POST /api/lessons/[id]/progress - Save user's progress for a lesson
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const lessonId = params.id;
        const body = await req.json();
        const { lastPosition, watchTime, completed } = body;

        // Validate input
        if (typeof lastPosition !== 'number' || lastPosition < 0) {
            return NextResponse.json(
                { error: 'Invalid lastPosition' },
                { status: 400 }
            );
        }

        // Upsert progress
        const progress = await prisma.lessonProgress.upsert({
            where: {
                userId_lessonId: {
                    userId: session.user.id,
                    lessonId,
                },
            },
            update: {
                lastPosition,
                watchTime: watchTime || undefined,
                completed: completed !== undefined ? completed : undefined,
                completedAt: completed ? new Date() : undefined,
                updatedAt: new Date(),
            },
            create: {
                userId: session.user.id,
                lessonId,
                lastPosition,
                watchTime: watchTime || 0,
                completed: completed || false,
                completedAt: completed ? new Date() : null,
            },
        });

        // If completed, update enrollment progress
        if (completed) {
            // Get lesson's course
            const lesson = await prisma.lesson.findUnique({
                where: { id: lessonId },
                select: { courseId: true },
            });

            if (lesson) {
                // Get total lessons and completed lessons for this course
                const totalLessons = await prisma.lesson.count({
                    where: { courseId: lesson.courseId },
                });

                const completedLessons = await prisma.lessonProgress.count({
                    where: {
                        userId: session.user.id,
                        completed: true,
                        lesson: {
                            courseId: lesson.courseId,
                        },
                    },
                });

                // Calculate progress percentage
                const progressPercentage = (completedLessons / totalLessons) * 100;

                // Update enrollment
                await prisma.enrollment.updateMany({
                    where: {
                        userId: session.user.id,
                        courseId: lesson.courseId,
                    },
                    data: {
                        progress: progressPercentage,
                        completedAt: progressPercentage >= 100 ? new Date() : null,
                        lastAccessedAt: new Date(),
                    },
                });

                // If course is now 100% complete, generate certificate
                if (progressPercentage >= 100) {
                    try {
                        // Find the enrollment to get its ID
                        const enrollment = await prisma.enrollment.findFirst({
                            where: {
                                userId: session.user.id,
                                courseId: lesson.courseId,
                            },
                        });

                        if (enrollment) {
                            // Generate certificate asynchronously (don't block the response)
                            checkAndGenerateCertificate(enrollment.id).catch(error => {
                                console.error('Certificate generation failed:', error);
                            });
                        }
                    } catch (error) {
                        console.error('Error triggering certificate generation:', error);
                        // Don't fail the progress update if certificate generation fails
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            progress,
        });
    } catch (error) {
        console.error('Error saving lesson progress:', error);
        return NextResponse.json(
            { error: 'Failed to save progress' },
            { status: 500 }
        );
    }
}
