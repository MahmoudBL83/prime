import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkAndGenerateCertificate } from '@/services/certificateService';

// POST /api/lessons/[id]/complete - Mark lesson as complete
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const lessonId = id;

        // Mark lesson as complete
        const progress = await prisma.lessonProgress.upsert({
            where: {
                userId_lessonId: {
                    userId: session.user.id,
                    lessonId,
                },
            },
            update: {
                completed: true,
                completedAt: new Date(),
                updatedAt: new Date(),
            },
            create: {
                userId: session.user.id,
                lessonId,
                completed: true,
                completedAt: new Date(),
                lastPosition: 0,
                watchTime: 0,
            },
        });

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
            const courseCompleted = progressPercentage >= 100;

            // Get enrollment for this user and course
            const enrollment = await prisma.enrollment.findFirst({
                where: {
                    userId: session.user.id,
                    courseId: lesson.courseId,
                },
            });

            // Update enrollment
            await prisma.enrollment.updateMany({
                where: {
                    userId: session.user.id,
                    courseId: lesson.courseId,
                },
                data: {
                    progress: progressPercentage,
                    completedAt: courseCompleted ? new Date() : null,
                    lastAccessedAt: new Date(),
                },
            });

            // Auto-generate certificate if course is completed
            let certificate = null;
            if (courseCompleted && enrollment) {
                try {
                    certificate = await checkAndGenerateCertificate(enrollment.id);
                } catch (error) {
                    console.error('Error generating certificate:', error);
                    // Don't fail the lesson completion if certificate generation fails
                }
            }

            return NextResponse.json({
                success: true,
                progress,
                courseProgress: {
                    percentage: progressPercentage,
                    completedLessons,
                    totalLessons,
                    courseCompleted,
                },
                certificate: certificate ? {
                    id: certificate.id,
                    certificateNumber: certificate.certificateNumber,
                    issueDate: certificate.issueDate,
                    verificationUrl: certificate.credentialUrl,
                } : null,
            });
        }

        return NextResponse.json({
            success: true,
            progress,
        });
    } catch (error) {
        console.error('Error marking lesson complete:', error);
        return NextResponse.json(
            { error: 'Failed to mark lesson complete' },
            { status: 500 }
        );
    }
}
