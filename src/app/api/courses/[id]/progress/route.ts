import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params;
        const courseId = id
        const body = await request.json()
        const { lessonId, currentTime, progress } = body

        // Validate required fields
        if (!lessonId || currentTime === undefined || progress === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Check if user is enrolled in the course
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: session.user.id,
                    courseId: courseId
                }
            }
        })

        if (!enrollment) {
            return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 })
        }

        // Update enrollment progress
        const updatedEnrollment = await prisma.enrollment.update({
            where: {
                id: enrollment.id
            },
            data: {
                progress: progress,
                lastAccessedAt: new Date()
            }
        })

        return NextResponse.json({
            success: true,
            progress: updatedEnrollment.progress,
            message: 'Progress saved successfully'
        })
    } catch (error) {
        console.error('Error saving progress:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
