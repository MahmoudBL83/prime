import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const questionSchema = z.object({
    type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY']),
    question: z.string().min(10),
    questionAr: z.string().optional(),
    options: z.array(z.string()).optional(), // For multiple choice
    correctAnswer: z.string().optional(),
    points: z.number().min(1).default(1),
    explanation: z.string().optional(),
    explanationAr: z.string().optional()
})

const quizSchema = z.object({
    courseId: z.string(),
    lessonId: z.string().optional(),
    title: z.string().min(3),
    titleAr: z.string().optional(),
    description: z.string().optional(),
    descriptionAr: z.string().optional(),
    duration: z.number().min(1).default(30), // minutes
    passingScore: z.number().min(0).max(100).default(70),
    maxAttempts: z.number().min(1).default(3),
    questions: z.array(questionSchema).min(1)
})

/**
 * POST /api/creator/quizzes
 * 
 * Create a new quiz for a course or lesson
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify creator
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 })
        }

        const body = await request.json()
        const data = quizSchema.parse(body)

        // Verify course ownership
        const course = await prisma.course.findUnique({
            where: { id: data.courseId }
        })

        if (!course || course.creatorId !== creator.id) {
            return NextResponse.json({ error: 'Course not found or unauthorized' }, { status: 404 })
        }

        // Create quiz
        const quiz = await prisma.quiz.create({
            data: {
                courseId: data.courseId,
                lessonId: data.lessonId,
                title: data.title,
                titleAr: data.titleAr,
                description: data.description,
                descriptionAr: data.descriptionAr,
                duration: data.duration,
                passingScore: data.passingScore,
                maxAttempts: data.maxAttempts,
                totalPoints: data.questions.reduce((sum, q) => sum + q.points, 0),
                questions: {
                    create: data.questions.map((q, index) => ({
                        type: q.type,
                        question: q.question,
                        questionAr: q.questionAr,
                        options: q.options ? JSON.stringify(q.options) : null,
                        correctAnswer: q.correctAnswer,
                        points: q.points,
                        explanation: q.explanation,
                        explanationAr: q.explanationAr,
                        order: index
                    }))
                }
            },
            include: {
                questions: {
                    orderBy: { order: 'asc' }
                }
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Quiz created successfully',
            quiz: {
                id: quiz.id,
                title: quiz.title,
                titleAr: quiz.titleAr,
                questionCount: quiz.questions.length,
                totalPoints: quiz.totalPoints,
                duration: quiz.duration,
                passingScore: quiz.passingScore
            }
        }, { status: 201 })

    } catch (error) {
        console.error('Quiz creation error:', error)
        
        if (error instanceof z.ZodError) {
            return NextResponse.json({
                error: 'Invalid request data',
                details: error.errors
            }, { status: 400 })
        }

        return NextResponse.json({
            error: 'Failed to create quiz'
        }, { status: 500 })
    }
}

/**
 * GET /api/creator/quizzes?courseId=xxx
 * 
 * Get all quizzes for a course
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const courseId = searchParams.get('courseId')
        const lessonId = searchParams.get('lessonId')

        if (!courseId) {
            return NextResponse.json({ error: 'Course ID required' }, { status: 400 })
        }

        // Verify creator
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 })
        }

        // Get course and verify ownership
        const course = await prisma.course.findUnique({
            where: { id: courseId }
        })

        if (!course || course.creatorId !== creator.id) {
            return NextResponse.json({ error: 'Course not found or unauthorized' }, { status: 404 })
        }

        // Build query
        const where: any = { courseId }
        if (lessonId) {
            where.lessonId = lessonId
        }

        // Get quizzes
        const quizzes = await prisma.quiz.findMany({
            where,
            include: {
                questions: {
                    orderBy: { order: 'asc' },
                    select: {
                        id: true,
                        type: true,
                        question: true,
                        questionAr: true,
                        points: true
                    }
                },
                _count: {
                    select: {
                        attempts: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({
            success: true,
            quizzes: quizzes.map(quiz => ({
                id: quiz.id,
                title: quiz.title,
                titleAr: quiz.titleAr,
                description: quiz.description,
                questionCount: quiz.questions.length,
                totalPoints: quiz.totalPoints,
                duration: quiz.duration,
                passingScore: quiz.passingScore,
                maxAttempts: quiz.maxAttempts,
                attemptCount: quiz._count.attempts,
                createdAt: quiz.createdAt
            }))
        })

    } catch (error) {
        console.error('Get quizzes error:', error)
        return NextResponse.json({
            error: 'Failed to get quizzes'
        }, { status: 500 })
    }
}

/**
 * DELETE /api/creator/quizzes?id=xxx
 * 
 * Delete a quiz
 */
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const quizId = searchParams.get('id')

        if (!quizId) {
            return NextResponse.json({ error: 'Quiz ID required' }, { status: 400 })
        }

        // Get quiz with course info
        const quiz = await prisma.quiz.findUnique({
            where: { id: quizId },
            include: {
                course: {
                    select: {
                        creatorId: true
                    }
                }
            }
        })

        if (!quiz) {
            return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
        }

        // Verify creator
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator || quiz.course.creatorId !== creator.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        // Delete quiz (will cascade delete questions)
        await prisma.quiz.delete({
            where: { id: quizId }
        })

        return NextResponse.json({
            success: true,
            message: 'Quiz deleted successfully'
        })

    } catch (error) {
        console.error('Delete quiz error:', error)
        return NextResponse.json({
            error: 'Failed to delete quiz'
        }, { status: 500 })
    }
}
