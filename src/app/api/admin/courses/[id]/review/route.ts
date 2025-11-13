import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const reviewActionSchema = z.object({
    action: z.enum(['approve', 'reject']),
    feedback: z.string().optional(),
    publishDate: z.string().optional() // For scheduled publishing
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

        // Check if user is admin
        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        })

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({
                error: 'Admin access required'
            }, { status: 403 })
        }

        const body = await req.json()
        const validation = reviewActionSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json({
                error: 'Invalid action data',
                details: validation.error.issues
            }, { status: 400 })
        }

        const { action, feedback, publishDate } = validation.data

        // Verify course exists and is under review
        const course = await prisma.course.findFirst({
            where: {
                id: courseId,
                status: 'UNDER_REVIEW'
            },
            include: {
                creator: {
                    include: {
                        user: {
                            select: { email: true, name: true }
                        }
                    }
                }
            }
        })

        if (!course) {
            return NextResponse.json({
                error: 'Course not found or not under review'
            }, { status: 404 })
        }

        // Update course status based on action
        const newStatus = action === 'approve' ? 'PUBLISHED' : 'REJECTED'
        const publishedAt = action === 'approve' ?
            (publishDate ? new Date(publishDate) : new Date()) :
            null

        const updatedCourse = await prisma.course.update({
            where: { id: courseId },
            data: {
                status: newStatus,
                publishedAt: publishedAt,
                updatedAt: new Date()
            }
        })

        // TODO: In a real app, you'd send notifications here
        // - Email to creator about approval/rejection
        // - In-app notifications
        // - Slack/Discord notifications for team

        const responseMessage = action === 'approve'
            ? 'Course approved and published successfully'
            : 'Course rejected successfully'

        return NextResponse.json({
            success: true,
            action,
            course: updatedCourse,
            message: responseMessage,
            feedback: feedback || null,
            creator: {
                name: course.creator?.user.name,
                email: course.creator?.user.email
            }
        })

    } catch (error) {
        console.error('Course review action error:', error)
        return NextResponse.json({
            error: 'Failed to process review action'
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

        // Check if user is admin
        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        })

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({
                error: 'Admin access required'
            }, { status: 403 })
        }

        // Get detailed course information for review
        const course = await prisma.course.findUnique({
            where: { id: courseId }
        })

        if (!course) {
            return NextResponse.json({
                error: 'Course not found'
            }, { status: 404 })
        }

        // Get additional details
        const [creator, lessons, enrollments] = await Promise.all([
            prisma.creator.findUnique({
                where: { id: course.creatorId },
                include: {
                    user: {
                        select: { name: true, email: true }
                    }
                }
            }),
            prisma.lesson.findMany({
                where: { courseId: courseId },
                orderBy: { order: 'asc' }
            }),
            prisma.enrollment.count({
                where: { courseId: courseId }
            })
        ])

        return NextResponse.json({
            success: true,
            course: {
                ...course,
                creator,
                lessons,
                enrollmentCount: enrollments,
                stats: {
                    totalLessons: lessons.length,
                    totalVideos: 0, // Will be implemented when video assets work
                    readyVideos: 0,
                    totalDuration: 0
                }
            }
        })

    } catch (error) {
        console.error('Course review fetch error:', error)
        return NextResponse.json({
            error: 'Failed to fetch course details'
        }, { status: 500 })
    }
}
