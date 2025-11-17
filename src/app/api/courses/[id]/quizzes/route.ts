import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createQuizSchema = z.object({
    title: z.string().min(3).max(200),
    titleAr: z.string().min(3).max(200),
    description: z.string().optional(),
    lessonId: z.string().optional(),
    timeLimit: z.number().min(1).max(180).optional(), // 1-180 minutes
    passingScore: z.number().min(0).max(100).default(70),
    maxAttempts: z.number().min(1).max(10).default(3),
    shuffleQuestions: z.boolean().default(false),
    questions: z.array(z.object({
        type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER']),
        question: z.string().min(10),
        questionAr: z.string().min(10),
        options: z.array(z.string()).optional(),
        correctAnswer: z.string(),
        explanation: z.string().optional(),
        points: z.number().min(0.5).max(10).default(1)
    })).min(1)
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

        const body = await req.json()
        const validation = createQuizSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json({
                error: 'Invalid quiz data',
                details: validation.error.issues
            }, { status: 400 })
        }

        const { questions, ...quizData } = validation.data

        // Create quiz with questions in a transaction
        const quiz = await prisma.$transaction(async (tx) => {
            // Create quiz
            const newQuiz = await tx.quiz.create({
                data: {
                    ...quizData,
                    courseId,
                    lessonId: quizData.lessonId || null
                }
            })

            // Create questions
            const createdQuestions = await Promise.all(
                questions.map((question, index) =>
                    tx.question.create({
                        data: {
                            type: question.type,
                            question: question.question,
                            questionAr: question.questionAr,
                            correctAnswer: question.correctAnswer,
                            explanation: question.explanation,
                            points: question.points,
                            quizId: newQuiz.id,
                            order: index + 1,
                            options: question.options && Array.isArray(question.options) ? question.options : undefined
                        }
                    })
                )
            )

            return { ...newQuiz, questions: createdQuestions }
        })

        return NextResponse.json({
            success: true,
            quiz,
            message: 'Quiz created successfully'
        })

    } catch (error) {
        console.error('Quiz creation error:', error)
        return NextResponse.json({
            error: 'Failed to create quiz'
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

        // Check if user has access to course (creator or enrolled student)
        const [creator, enrollment] = await Promise.all([
            prisma.creator.findUnique({
                where: { userId: session.user.id }
            }),
            prisma.enrollment.findFirst({
                where: {
                    userId: session.user.id,
                    courseId: courseId
                }
            })
        ])

        const isCreator = creator && await prisma.course.findFirst({
            where: {
                id: courseId,
                creatorId: creator.id
            }
        })

        if (!isCreator && !enrollment) {
            return NextResponse.json({
                error: 'Access denied to course content'
            }, { status: 403 })
        }

        // Get quizzes for the course
        const quizzes = await prisma.quiz.findMany({
            where: { courseId },
            orderBy: { createdAt: 'asc' }
        })

        // If student, get their attempts
        let userAttempts: Array<{
            id: string;
            quizId: string;
            score: number;
            maxScore: number;
            passed: boolean;
            completedAt: Date | null;
        }> = []
        if (!isCreator) {
            userAttempts = await prisma.quizAttempt.findMany({
                where: {
                    userId: session.user.id,
                    quiz: { courseId }
                },
                select: {
                    id: true,
                    quizId: true,
                    score: true,
                    maxScore: true,
                    passed: true,
                    completedAt: true
                }
            })
        }

        return NextResponse.json({
            success: true,
            quizzes: quizzes.map(quiz => ({
                ...quiz,
                userAttempts: userAttempts.filter(attempt => attempt.quizId === quiz.id)
            }))
        })

    } catch (error) {
        console.error('Quiz fetch error:', error)
        return NextResponse.json({
            error: 'Failed to fetch quizzes'
        }, { status: 500 })
    }
}
