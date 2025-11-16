import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch all quizzes for a course
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const courseId = id

        // Verify course ownership
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { creator: true }
        })

        if (!user?.creator) {
            return NextResponse.json(
                { error: 'Creator profile not found' },
                { status: 404 }
            )
        }

        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: { creatorId: true }
        })

        if (!course) {
            return NextResponse.json(
                { error: 'Course not found' },
                { status: 404 }
            )
        }

        if (course.creatorId !== user.creator.id) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            )
        }

        // Fetch quizzes
        const quizzes = await prisma.quiz.findMany({
            where: { courseId },
            include: {
                lesson: {
                    select: {
                        id: true,
                        title: true,
                        titleAr: true
                    }
                },
                questions: {
                    select: {
                        id: true,
                        type: true,
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
            quizzes
        })

    } catch (error) {
        console.error('Failed to fetch quizzes:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// POST - Create a new quiz
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const courseId = id
        const body = await request.json()

        const {
            title,
            titleAr,
            description,
            descriptionAr,
            lessonId,
            timeLimit,
            passingScore,
            maxAttempts,
            shuffleQuestions,
            questions
        } = body

        // Validation
        if (!title || !questions || questions.length === 0) {
            return NextResponse.json(
                { error: 'Title and questions are required' },
                { status: 400 }
            )
        }

        // Verify course ownership
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { creator: true }
        })

        if (!user?.creator) {
            return NextResponse.json(
                { error: 'Creator profile not found' },
                { status: 404 }
            )
        }

        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: { creatorId: true }
        })

        if (!course) {
            return NextResponse.json(
                { error: 'Course not found' },
                { status: 404 }
            )
        }

        if (course.creatorId !== user.creator.id) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            )
        }

        // Create quiz with questions
        const quiz = await prisma.quiz.create({
            data: {
                courseId,
                lessonId: lessonId || null,
                title,
                titleAr: titleAr || null,
                description: description || null,
                descriptionAr: descriptionAr || null,
                timeLimit: timeLimit || null,
                passingScore: passingScore || 70,
                maxAttempts: maxAttempts || 3,
                shuffleQuestions: shuffleQuestions || false,
                questions: {
                    create: questions.map((q: any, index: number) => ({
                        type: q.type,
                        question: q.question,
                        questionAr: q.questionAr || null,
                        options: q.options || null,
                        correctAnswer: q.correctAnswer,
                        explanation: q.explanation || null,
                        explanationAr: q.explanationAr || null,
                        points: q.points || 1,
                        order: index
                    }))
                }
            },
            include: {
                questions: true
            }
        })

        return NextResponse.json({
            success: true,
            quiz
        })

    } catch (error) {
        console.error('Failed to create quiz:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
