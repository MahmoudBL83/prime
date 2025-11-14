import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/creator/courses/[id]/submissions/[submissionId] - Grade a submission
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; submissionId: string }> }
) {
    try {
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
                id: params.id,
                creatorId: creator.id
            }
        })

        if (!course) {
            return NextResponse.json(
                { error: 'Course not found or access denied' },
                { status: 404 }
            )
        }

        const body = await request.json()
        const { score, feedback } = body

        // Validate score
        if (score === undefined || score === null) {
            return NextResponse.json(
                { error: 'Score is required' },
                { status: 400 }
            )
        }

        // Get the submission to check max points
        const submission = await prisma.assignmentSubmission.findFirst({
            where: {
                id: params.submissionId,
                assignment: {
                    courseId: params.id
                }
            },
            include: {
                assignment: {
                    select: {
                        maxPoints: true
                    }
                }
            }
        })

        if (!submission) {
            return NextResponse.json(
                { error: 'Submission not found' },
                { status: 404 }
            )
        }

        // Validate score is within range
        if (score < 0 || score > submission.assignment.maxPoints) {
            return NextResponse.json(
                { error: `Score must be between 0 and ${submission.assignment.maxPoints}` },
                { status: 400 }
            )
        }

        // Update submission with grade
        const gradedSubmission = await prisma.assignmentSubmission.update({
            where: {
                id: params.submissionId
            },
            data: {
                score: score,
                feedback: feedback || null,
                gradedAt: new Date()
            },
            include: {
                assignment: {
                    select: {
                        id: true,
                        title: true,
                        titleAr: true,
                        maxPoints: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        arabicName: true,
                        email: true
                    }
                }
            }
        })

        return NextResponse.json({
            success: true,
            submission: gradedSubmission
        })
    } catch (error) {
        console.error('Error grading submission:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// GET /api/creator/courses/[id]/submissions/[submissionId] - Get single submission details
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string; submissionId: string } }
) {
    try {
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

        // Verify course ownership and get submission
        const submission = await prisma.assignmentSubmission.findFirst({
            where: {
                id: params.submissionId,
                assignment: {
                    courseId: params.id,
                    course: {
                        creatorId: creator.id
                    }
                }
            },
            include: {
                assignment: {
                    select: {
                        id: true,
                        title: true,
                        titleAr: true,
                        description: true,
                        descriptionAr: true,
                        instructions: true,
                        instructionsAr: true,
                        maxPoints: true,
                        dueDate: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        arabicName: true,
                        email: true,
                        profileImage: true
                    }
                }
            }
        })

        if (!submission) {
            return NextResponse.json(
                { error: 'Submission not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            submission
        })
    } catch (error) {
        console.error('Error fetching submission:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
