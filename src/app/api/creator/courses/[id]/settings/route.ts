import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: courseId } = await params
        const { maxStudents, enrollmentEndDate } = await request.json()

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

        // Verify the creator owns this course
        const course = await prisma.course.findUnique({
            where: { 
                id: courseId,
                creatorId: creator.id
            }
        })

        if (!course) {
            return NextResponse.json(
                { error: 'Course not found or unauthorized' },
                { status: 404 }
            )
        }

        // Validate inputs
        if (maxStudents !== null && maxStudents !== undefined) {
            if (maxStudents < 1) {
                return NextResponse.json(
                    { error: 'Maximum students must be at least 1' },
                    { status: 400 }
                )
            }
        }

        if (enrollmentEndDate) {
            const endDate = new Date(enrollmentEndDate)
            const now = new Date()
            if (endDate < now) {
                return NextResponse.json(
                    { error: 'Enrollment end date must be in the future' },
                    { status: 400 }
                )
            }
        }

        // Update enrollment settings
        const updatedCourse = await prisma.course.update({
            where: { id: courseId },
            data: {
                maxStudents: maxStudents || null,
                enrollmentEndDate: enrollmentEndDate ? new Date(enrollmentEndDate) : null
            }
        })

        return NextResponse.json({ 
            success: true,
            course: updatedCourse
        })
    } catch (error) {
        console.error('Failed to update enrollment settings:', error)
        return NextResponse.json(
            { error: 'Failed to update enrollment settings' },
            { status: 500 }
        )
    }
}
