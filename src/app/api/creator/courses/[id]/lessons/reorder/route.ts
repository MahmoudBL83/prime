import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/creator/courses/[id]/lessons/reorder
 * Reorder lessons
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id: courseId } = await params

        // Get creator profile
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json(
                { error: 'Creator profile not found' },
                { status: 404 }
            )
        }

        // Verify course belongs to creator
        const course = await prisma.course.findUnique({
            where: { id: courseId }
        })

        if (!course) {
            return NextResponse.json(
                { error: 'Course not found' },
                { status: 404 }
            )
        }

        if (course.creatorId !== creator.id) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { lessonIds } = body // Array of lesson IDs in the new order

        if (!Array.isArray(lessonIds)) {
            return NextResponse.json(
                { error: 'Invalid request body' },
                { status: 400 }
            )
        }

        // Update the order of each lesson
        for (let i = 0; i < lessonIds.length; i++) {
            await prisma.lesson.update({
                where: { id: lessonIds[i] },
                data: { order: i + 1 }
            })
        }

        return NextResponse.json({
            success: true,
            message: 'Lessons reordered successfully'
        })

    } catch (error) {
        console.error('Failed to reorder lessons:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
