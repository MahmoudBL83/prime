import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createLessonSchema = z.object({
    title: z.string().min(3).max(200),
    titleAr: z.string().min(3).max(200),
    description: z.string().optional(),
    videoUrl: z.string().url(),
    duration: z.number().min(1),
    order: z.number().min(0),
    resources: z.any().optional(),
    transcript: z.string().optional()
})

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

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        const { id: courseId } = await params

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

        // Verify course ownership
        const course = await prisma.course.findFirst({
            where: {
                id: courseId,
                creatorId: creator.id
            }
        })

        if (!course) {
            return NextResponse.json({
                error: 'Course not found or access denied'
            }, { status: 404 })
        }

        const body = await req.json()
        const validation = createLessonSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json({
                error: 'Invalid input data',
                details: validation.error.issues
            }, { status: 400 })
        }

        // Get the next order number
        const lastLesson = await prisma.lesson.findFirst({
            where: { courseId },
            orderBy: { order: 'desc' }
        })

        const nextOrder = lastLesson ? lastLesson.order + 1 : 0

        // Create lesson
        const lesson = await prisma.lesson.create({
            data: {
                ...validation.data,
                courseId,
                order: validation.data.order ?? nextOrder
            }
        })

        return NextResponse.json({
            success: true,
            lesson,
            message: 'Lesson created successfully'
        })

    } catch (error) {
        console.error('Lesson creation error:', error)
        return NextResponse.json({
            error: 'Failed to create lesson'
        }, { status: 500 })
    }
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        const { id: courseId } = await params

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

        // Verify course ownership
        const course = await prisma.course.findFirst({
            where: {
                id: courseId,
                creatorId: creator.id
            }
        })

        if (!course) {
            return NextResponse.json({
                error: 'Course not found or access denied'
            }, { status: 404 })
        }

        // Get lessons for the course
        const lessons = await prisma.lesson.findMany({
            where: { courseId },
            orderBy: { order: 'asc' }
        })

        // Get video assets for each lesson separately
        const lessonsWithAssets = await Promise.all(
            lessons.map(async (lesson) => {
                const videoAssets = await prisma.videoAsset.findMany({
                    where: { lessonId: lesson.id },
                    select: {
                        id: true,
                        status: true,
                        muxPlaybackId: true,
                        duration: true,
                        thumbnailUrl: true
                    }
                })
                return {
                    ...lesson,
                    videoAssets
                }
            })
        )

        return NextResponse.json({
            success: true,
            lessons: lessonsWithAssets
        })

    } catch (error) {
        console.error('Lessons fetch error:', error)
        return NextResponse.json({
            error: 'Failed to fetch lessons'
        }, { status: 500 })
    }
}
