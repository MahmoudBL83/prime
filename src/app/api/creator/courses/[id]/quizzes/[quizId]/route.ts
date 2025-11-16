import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch a single quiz
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; quizId: string }> }
) {
    try {
        const { id, quizId } = await params
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const quiz = await prisma.quiz.findUnique({
            where: { id: quizId },
            include: {
                questions: {
                    orderBy: { order: 'asc' }
                },
                course: {
                    select: {
                        id: true,
                        title: true,
                        creatorId: true
                    }
                },
                lesson: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        })

        if (!quiz) {
            return NextResponse.json(
                { error: 'Quiz not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            quiz
        })

    } catch (error) {
        console.error('Failed to fetch quiz:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// PATCH - Update a quiz
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; quizId: string }> }
) {
    try {
        const { id, quizId } = await params
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()

        const {
            title,
            titleAr,
            description,
            descriptionAr,
            timeLimit,
            passingScore,
            maxAttempts,
            shuffleQuestions,
            questions
        } = body

        // Verify ownership
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

        const quiz = await prisma.quiz.findUnique({
            where: { id: quizId },
            include: {
                course: {
                    select: { creatorId: true }
                }
            }
        })

        if (!quiz) {
            return NextResponse.json(
                { error: 'Quiz not found' },
                { status: 404 }
            )
        }

        if (quiz.course.creatorId !== user.creator.id) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            )
        }

        // Update quiz
        const updateData: any = {}
        if (title) updateData.title = title
        if (titleAr) updateData.titleAr = titleAr
        if (description !== undefined) updateData.description = description
        if (descriptionAr !== undefined) updateData.descriptionAr = descriptionAr
        if (timeLimit !== undefined) updateData.timeLimit = timeLimit
        if (passingScore !== undefined) updateData.passingScore = passingScore
        if (maxAttempts !== undefined) updateData.maxAttempts = maxAttempts
        if (shuffleQuestions !== undefined) updateData.shuffleQuestions = shuffleQuestions

        // If questions are provided, update them
        if (questions) {
            // Delete old questions
            await prisma.question.deleteMany({
                where: { quizId }
            })

            // Create new questions
            updateData.questions = {
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
        }

        const updatedQuiz = await prisma.quiz.update({
            where: { id: quizId },
            data: updateData,
            include: {
                questions: {
                    orderBy: { order: 'asc' }
                }
            }
        })

        return NextResponse.json({
            success: true,
            quiz: updatedQuiz
        })

    } catch (error) {
        console.error('Failed to update quiz:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// DELETE - Delete a quiz
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; quizId: string }> }
) {
    try {
        const { id, quizId } = await params
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Verify ownership
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

        const quiz = await prisma.quiz.findUnique({
            where: { id: quizId },
            include: {
                course: {
                    select: { creatorId: true }
                }
            }
        })

        if (!quiz) {
            return NextResponse.json(
                { error: 'Quiz not found' },
                { status: 404 }
            )
        }

        if (quiz.course.creatorId !== user.creator.id) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            )
        }

        // Delete quiz (cascade will delete questions and attempts)
        await prisma.quiz.delete({
            where: { id: quizId }
        })

        return NextResponse.json({
            success: true,
            message: 'Quiz deleted successfully'
        })

    } catch (error) {
        console.error('Failed to delete quiz:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
