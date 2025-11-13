import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

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

        // Get course with lessons and video assets
        const course = await prisma.course.findFirst({
            where: {
                id: courseId,
                creatorId: creator.id
            },
            include: {
                lessons: {
                    include: {
                        videoAssets: true
                    },
                    orderBy: { order: 'asc' }
                },
                _count: {
                    select: {
                        enrollments: true,
                        lessons: true
                    }
                }
            }
        })

        if (!course) {
            return NextResponse.json({
                error: 'Course not found or access denied'
            }, { status: 404 })
        }

        return NextResponse.json(course)

    } catch (error) {
        console.error('Course management fetch error:', error)
        return NextResponse.json({
            error: 'Failed to fetch course data'
        }, { status: 500 })
    }
}

const updateCourseSchema = z.object({
    title: z.string().min(3).max(200).optional(),
    titleAr: z.string().min(3).max(200).optional(),
    description: z.string().min(10).max(2000).optional(),
    descriptionAr: z.string().min(10).max(2000).optional(),
    category: z.string().optional(),
    skillLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
    language: z.string().optional(),
    price: z.number().min(0).optional(),
    duration: z.number().min(1).optional(),
    thumbnail: z.string().url().optional(),
})

export async function PUT(
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

        const body = await req.json()
        const validation = updateCourseSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json({
                error: 'Invalid input data',
                details: validation.error.issues
            }, { status: 400 })
        }

        // Verify course ownership
        const existingCourse = await prisma.course.findFirst({
            where: {
                id: courseId,
                creatorId: creator.id
            }
        })

        if (!existingCourse) {
            return NextResponse.json({
                error: 'Course not found or access denied'
            }, { status: 404 })
        }

        // Update course
        const updatedCourse = await prisma.course.update({
            where: { id: courseId },
            data: {
                ...validation.data,
                updatedAt: new Date()
            }
        })

        return NextResponse.json({
            success: true,
            course: updatedCourse,
            message: 'Course updated successfully'
        })

    } catch (error) {
        console.error('Course update error:', error)
        return NextResponse.json({
            error: 'Failed to update course'
        }, { status: 500 })
    }
}

export async function DELETE(
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

        // Verify course ownership and check if it's safe to delete
        const course = await prisma.course.findFirst({
            where: {
                id: courseId,
                creatorId: creator.id
            },
            include: {
                _count: {
                    select: {
                        enrollments: true
                    }
                }
            }
        })

        if (!course) {
            return NextResponse.json({
                error: 'Course not found or access denied'
            }, { status: 404 })
        }

        // Don't allow deletion if course has enrollments
        if (course._count.enrollments > 0) {
            return NextResponse.json({
                error: 'Cannot delete course with active enrollments'
            }, { status: 400 })
        }

        // Delete course and related data
        await prisma.$transaction([
            // Delete video assets
            prisma.videoAsset.deleteMany({
                where: { courseId: courseId }
            }),
            // Delete lessons
            prisma.lesson.deleteMany({
                where: { courseId: courseId }
            }),
            // Delete course
            prisma.course.delete({
                where: { id: courseId }
            })
        ])

        return NextResponse.json({
            success: true,
            message: 'Course deleted successfully'
        })

    } catch (error) {
        console.error('Course deletion error:', error)
        return NextResponse.json({
            error: 'Failed to delete course'
        }, { status: 500 })
    }
}
