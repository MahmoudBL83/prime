import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/creator/courses/[id]/submissions - Get all pending submissions for grading
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const filter = searchParams.get('filter') || 'all' // all, ungraded, graded

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

        // Build filter condition
        const filterCondition = filter === 'ungraded' 
            ? { score: null }
            : filter === 'graded'
            ? { score: { not: null } }
            : {}

        // Get assignment submissions
        const submissions = await prisma.assignmentSubmission.findMany({
            where: {
                assignment: {
                    courseId: params.id
                },
                ...filterCondition
            },
            include: {
                assignment: {
                    select: {
                        id: true,
                        title: true,
                        titleAr: true,
                        maxPoints: true,
                        description: true
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
            },
            orderBy: [
                { gradedAt: 'asc' }, // Ungraded first (null sorts first)
                { submittedAt: 'desc' }
            ]
        })

        // Note: Quiz attempts with essay questions would need manual grading
        // This would require adding a needsManualGrading field to QuizAttempt model
        // For now, focusing on assignment submissions only
        const quizAttempts: any[] = []

        return NextResponse.json({
            success: true,
            submissions: {
                assignments: submissions,
                quizzes: quizAttempts
            },
            stats: {
                totalAssignments: submissions.length,
                ungradedAssignments: submissions.filter(s => s.score === null).length,
                gradedAssignments: submissions.filter(s => s.score !== null).length,
                totalQuizAttempts: quizAttempts.length
            }
        })
    } catch (error) {
        console.error('Error fetching submissions:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
