import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/creator/courses/[id]/students - Get all enrolled students with their progress
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

        // Get all enrollments with user details and progress
        const enrollments = await prisma.enrollment.findMany({
            where: {
                courseId: params.id
            },
            include: {
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
            orderBy: {
                createdAt: 'desc'
            }
        })

        // Get quiz attempts for all enrolled students
        const quizAttempts = await prisma.quizAttempt.findMany({
            where: {
                quiz: {
                    courseId: params.id
                }
            },
            include: {
                quiz: {
                    select: {
                        id: true,
                        title: true,
                        titleAr: true,
                        passingScore: true
                    }
                }
            }
        })

        // Get assignment submissions for all enrolled students
        const assignments = await prisma.assignment.findMany({
            where: {
                courseId: params.id
            },
            include: {
                submissions: {
                    select: {
                        id: true,
                        userId: true,
                        score: true,
                        submittedAt: true,
                        gradedAt: true
                    }
                }
            }
        })

        // Get total quizzes and assignments count
        const totalQuizzes = await prisma.quiz.count({ where: { courseId: params.id } })
        const totalAssignments = assignments.length

        // Aggregate progress data per student
        const studentsProgress = await Promise.all(enrollments.map(async (enrollment) => {
            const userId = enrollment.user.id

            // Quiz stats
            const studentQuizAttempts = quizAttempts.filter(attempt => attempt.userId === userId)
            const completedQuizzes = new Set(studentQuizAttempts.map(a => a.quizId)).size
            const averageQuizScore = studentQuizAttempts.length > 0
                ? studentQuizAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / studentQuizAttempts.length
                : 0

            // Assignment stats
            const studentSubmissions = assignments.flatMap(a => 
                a.submissions.filter(s => s.userId === userId)
            )
            const submittedAssignments = studentSubmissions.length
            const gradedAssignments = studentSubmissions.filter(s => s.score !== null).length
            const averageAssignmentScore = gradedAssignments > 0
                ? studentSubmissions
                    .filter(s => s.score !== null)
                    .reduce((sum, s) => sum + (s.score || 0), 0) / gradedAssignments
                : 0

            // Overall progress
            const totalItems = totalQuizzes + totalAssignments
            const completedItems = completedQuizzes + submittedAssignments
            const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0

            return {
                enrollment: {
                    id: enrollment.id,
                    enrolledAt: enrollment.createdAt,
                    progress: enrollment.progress
                },
                user: enrollment.user,
                stats: {
                    quizzes: {
                        total: totalQuizzes,
                        completed: completedQuizzes,
                        averageScore: Math.round(averageQuizScore)
                    },
                    assignments: {
                        total: totalAssignments,
                        submitted: submittedAssignments,
                        graded: gradedAssignments,
                        averageScore: Math.round(averageAssignmentScore)
                    },
                    overallProgress: Math.round(progressPercentage)
                },
                lastActivity: studentQuizAttempts.length > 0 || studentSubmissions.length > 0
                    ? new Date(Math.max(
                        ...studentQuizAttempts.map(a => a.completedAt?.getTime() || 0),
                        ...studentSubmissions.map(s => s.submittedAt.getTime())
                    ))
                    : enrollment.createdAt
            }
        }))

        return NextResponse.json({
            success: true,
            students: studentsProgress,
            summary: {
                totalStudents: enrollments.length,
                averageProgress: studentsProgress.reduce((sum, s) => sum + s.stats.overallProgress, 0) / (studentsProgress.length || 1),
                totalQuizzes: totalQuizzes,
                totalAssignments: totalAssignments
            }
        })
    } catch (error) {
        console.error('Error fetching student progress:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
