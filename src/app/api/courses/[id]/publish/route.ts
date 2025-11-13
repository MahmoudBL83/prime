import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

        // Check if course is in DRAFT status
        if (course.status !== 'DRAFT') {
            return NextResponse.json({
                error: 'Course can only be submitted from DRAFT status',
                currentStatus: course.status
            }, { status: 400 })
        }

        // Validate course is ready for submission
        const lessons = await prisma.lesson.findMany({
            where: { courseId: courseId }
        })

        if (lessons.length === 0) {
            return NextResponse.json({
                error: 'Course must have at least one lesson before submission'
            }, { status: 400 })
        }

        // Check if required fields are complete
        const requiredFields = ['title', 'titleAr', 'description', 'descriptionAr', 'category']
        const missingFields = requiredFields.filter(field => !course[field as keyof typeof course])

        if (missingFields.length > 0) {
            return NextResponse.json({
                error: 'Please complete all required fields before submission',
                missingFields
            }, { status: 400 })
        }

        // Update course status to UNDER_REVIEW
        const updatedCourse = await prisma.course.update({
            where: { id: courseId },
            data: {
                status: 'UNDER_REVIEW',
                updatedAt: new Date()
            }
        })

        // TODO: In a real app, you would:
        // 1. Send notification to admin team
        // 2. Create audit log entry
        // 3. Send email to creator confirming submission
        // 4. Update creator's dashboard stats

        return NextResponse.json({
            success: true,
            course: updatedCourse,
            message: 'Course submitted for review successfully'
        })

    } catch (error) {
        console.error('Course submission error:', error)
        return NextResponse.json({
            error: 'Failed to submit course for review'
        }, { status: 500 })
    }
}
