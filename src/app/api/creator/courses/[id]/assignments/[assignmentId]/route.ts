import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/creator/courses/[id]/assignments/[assignmentId] - Get single assignment with submissions
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
    try {
        const { id, assignmentId } = await params
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Get creator profile
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json(
                { error: 'Creator profile not found' },
                { status: 403 }
            )
        }

        // Verify course ownership
        const course = await prisma.course.findFirst({
            where: {
                id,
                creatorId: creator.id
            }
        })

        if (!course) {
            return NextResponse.json(
                { error: 'Course not found or access denied' },
                { status: 404 }
            )
        }

        // Fetch assignment with submissions
        const assignment = await prisma.assignment.findFirst({
            where: {
                id: assignmentId,
                courseId: id
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        titleAr: true
                    }
                },
                lesson: {
                    select: {
                        id: true,
                        title: true,
                        titleAr: true
                    }
                },
                submissions: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                arabicName: true,
                                email: true
                            }
                        }
                    },
                    orderBy: {
                        submittedAt: 'desc'
                    }
                },
                _count: {
                    select: {
                        submissions: true
                    }
                }
            }
        })

        if (!assignment) {
            return NextResponse.json(
                { error: 'Assignment not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            assignment
        })
    } catch (error) {
        console.error('Error fetching assignment:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// PATCH /api/creator/courses/[id]/assignments/[assignmentId] - Update assignment
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
    try {
        const { id, assignmentId } = await params
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Get creator profile
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json(
                { error: 'Creator profile not found' },
                { status: 403 }
            )
        }

        // Verify course ownership
        const course = await prisma.course.findFirst({
            where: {
                id,
                creatorId: creator.id
            }
        })

        if (!course) {
            return NextResponse.json(
                { error: 'Course not found or access denied' },
                { status: 404 }
            )
        }

        // Verify assignment exists
        const existingAssignment = await prisma.assignment.findFirst({
            where: {
                id: assignmentId,
                courseId: id
            }
        })

        if (!existingAssignment) {
            return NextResponse.json(
                { error: 'Assignment not found' },
                { status: 404 }
            )
        }

        const body = await request.json()
        const {
            title,
            titleAr,
            description,
            descriptionAr,
            instructions,
            instructionsAr,
            dueDate,
            maxScore,
            allowLateSubmission,
            requireFile,
            acceptedFileTypes,
            maxFileSize,
            lessonId
        } = body

        // Update assignment
        const assignment = await prisma.assignment.update({
            where: {
                id: assignmentId
            },
            data: {
                title: title || existingAssignment.title,
                titleAr: titleAr !== undefined ? titleAr : existingAssignment.titleAr,
                description: description || existingAssignment.description,
                descriptionAr: descriptionAr !== undefined ? descriptionAr : existingAssignment.descriptionAr,
                instructions: instructions !== undefined ? instructions : existingAssignment.instructions,
                instructionsAr: instructionsAr !== undefined ? instructionsAr : existingAssignment.instructionsAr,
                dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : existingAssignment.dueDate,
                maxPoints: maxScore !== undefined ? maxScore : existingAssignment.maxPoints,
                allowLateSubmission: allowLateSubmission !== undefined ? allowLateSubmission : existingAssignment.allowLateSubmission,
                lessonId: lessonId !== undefined ? lessonId : existingAssignment.lessonId
            },
            include: {
                lesson: {
                    select: {
                        id: true,
                        title: true,
                        titleAr: true
                    }
                },
                _count: {
                    select: {
                        submissions: true
                    }
                }
            }
        })

        return NextResponse.json({
            success: true,
            assignment
        })
    } catch (error) {
        console.error('Error updating assignment:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// DELETE /api/creator/courses/[id]/assignments/[assignmentId] - Delete assignment
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
    try {
        const { id, assignmentId } = await params
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Get creator profile
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json(
                { error: 'Creator profile not found' },
                { status: 403 }
            )
        }

        // Verify course ownership
        const course = await prisma.course.findFirst({
            where: {
                id,
                creatorId: creator.id
            }
        })

        if (!course) {
            return NextResponse.json(
                { error: 'Course not found or access denied' },
                { status: 404 }
            )
        }

        // Verify assignment exists
        const assignment = await prisma.assignment.findFirst({
            where: {
                id: assignmentId,
                courseId: id
            }
        })

        if (!assignment) {
            return NextResponse.json(
                { error: 'Assignment not found' },
                { status: 404 }
            )
        }

        // Delete assignment (cascade will delete submissions)
        await prisma.assignment.delete({
            where: {
                id: assignmentId
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Assignment deleted successfully'
        })
    } catch (error) {
        console.error('Error deleting assignment:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
