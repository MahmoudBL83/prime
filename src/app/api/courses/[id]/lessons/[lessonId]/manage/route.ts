import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateLessonSchema = z.object({
    title: z.string().min(3).max(200).optional(),
    titleAr: z.string().min(3).max(200).optional(),
    description: z.string().optional(),
    videoUrl: z.string().url().optional(),
    duration: z.number().min(1).optional(),
    order: z.number().min(0).optional(),
    resources: z.any().optional(),
    transcript: z.string().optional()
})

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        const { id: courseId, lessonId } = await params

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get creator profile
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json({
                error: 'Creator profile not found'
            }, { status: 403 })
        }

        // Verify course ownership and get lesson
        const lesson = await prisma.lesson.findFirst({
            where: {
                id: lessonId,
                courseId: courseId,
                course: {
                    creatorId: creator.id
                }
            }
        })

        if (!lesson) {
            return NextResponse.json({
                error: 'Lesson not found or access denied'
            }, { status: 404 })
        }

        // Get video assets for the lesson
        const videoAssets = await prisma.videoAsset.findMany({
            where: { lessonId: lesson.id },
            select: {
                id: true,
                status: true,
                muxPlaybackId: true,
                duration: true,
                thumbnailUrl: true,
                title: true,
                description: true
            }
        })

        return NextResponse.json({
            success: true,
            lesson: {
                ...lesson,
                videoAssets
            }
        })

    } catch (error) {
        console.error('Lesson fetch error:', error)
        return NextResponse.json({
            error: 'Failed to fetch lesson'
        }, { status: 500 })
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        const { id: courseId, lessonId } = await params

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get creator profile
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json({
                error: 'Creator profile not found'
            }, { status: 403 })
        }

        const body = await req.json()
        const validation = updateLessonSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json({
                error: 'Invalid input data',
                details: validation.error.issues
            }, { status: 400 })
        }

        // Verify lesson ownership
        const existingLesson = await prisma.lesson.findFirst({
            where: {
                id: lessonId,
                courseId: courseId,
                course: {
                    creatorId: creator.id
                }
            }
        })

        if (!existingLesson) {
            return NextResponse.json({
                error: 'Lesson not found or access denied'
            }, { status: 404 })
        }

        // Update lesson
        const updatedLesson = await prisma.lesson.update({
            where: { id: lessonId },
            data: {
                ...validation.data,
                updatedAt: new Date()
            }
        })

        return NextResponse.json({
            success: true,
            lesson: updatedLesson,
            message: 'Lesson updated successfully'
        })

    } catch (error) {
        console.error('Lesson update error:', error)
        return NextResponse.json({
            error: 'Failed to update lesson'
        }, { status: 500 })
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        const { id: courseId, lessonId } = await params

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get creator profile
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json({
                error: 'Creator profile not found'
            }, { status: 403 })
        }

        // Verify lesson ownership
        const lesson = await prisma.lesson.findFirst({
            where: {
                id: lessonId,
                courseId: courseId,
                course: {
                    creatorId: creator.id
                }
            }
        })

        if (!lesson) {
            return NextResponse.json({
                error: 'Lesson not found or access denied'
            }, { status: 404 })
        }

        // Delete lesson and related video assets
        await prisma.$transaction([
            // Delete video assets
            prisma.videoAsset.deleteMany({
                where: { lessonId: lessonId }
            }),
            // Delete lesson progress records
            prisma.lessonProgress.deleteMany({
                where: { lessonId: lessonId }
            }),
            // Delete lesson
            prisma.lesson.delete({
                where: { id: lessonId }
            })
        ])

        return NextResponse.json({
            success: true,
            message: 'Lesson deleted successfully'
        })

    } catch (error) {
        console.error('Lesson deletion error:', error)
        return NextResponse.json({
            error: 'Failed to delete lesson'
        }, { status: 500 })
    }
}
