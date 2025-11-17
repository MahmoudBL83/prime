import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/creator/questions - Get questions/comments from students
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 })
        }

        const searchParams = request.nextUrl.searchParams
        const status = searchParams.get('status') || 'unanswered'

        // Get comments on creator's video content (as questions)
        const comments = await prisma.videoComment.findMany({
            where: {
                videoAsset: {
                    lesson: {
                        course: {
                            creatorId: creator.id
                        }
                    }
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                videoAsset: {
                    select: {
                        id: true,
                        title: true,
                        lesson: {
                            select: {
                                id: true,
                                title: true,
                                titleAr: true,
                                course: {
                                    select: {
                                        id: true,
                                        title: true,
                                        titleAr: true
                                    }
                                }
                            }
                        }
                    }
                },
                replies: {
                    select: {
                        id: true,
                        content: true,
                        createdAt: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 100
        })

        // Filter by answered/unanswered
        const filtered = status === 'unanswered' 
            ? comments.filter((c: any) => c.replies.length === 0)
            : status === 'answered'
            ? comments.filter((c: any) => c.replies.length > 0)
            : comments

        return NextResponse.json({
            success: true,
            questions: filtered.map((q: any) => ({
                id: q.id,
                question: q.content,
                answer: q.replies.length > 0 ? q.replies[0].content : null,
                student: {
                    id: q.user.id,
                    name: q.user.name,
                    email: q.user.email
                },
                course: {
                    id: q.videoAsset.lesson?.course?.id,
                    title: q.videoAsset.lesson?.course?.title
                },
                lesson: {
                    id: q.videoAsset.lesson?.id,
                    title: q.videoAsset.lesson?.title
                },
                videoAsset: {
                    id: q.videoAsset.id,
                    title: q.videoAsset.title
                },
                timestamp: q.timestamp,
                createdAt: q.createdAt,
                answeredAt: q.replies.length > 0 ? q.replies[0].createdAt : null
            }))
        })

    } catch (error) {
        console.error('Error fetching questions:', error)
        return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
    }
}

// POST /api/creator/questions - Answer a question (reply to comment)
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 })
        }

        const body = await request.json()
        const { questionId, answer } = body

        if (!questionId || !answer) {
            return NextResponse.json({ error: 'Question ID and answer required' }, { status: 400 })
        }

        // Verify comment belongs to creator's course
        const comment = await prisma.videoComment.findFirst({
            where: {
                id: questionId,
                videoAsset: {
                    lesson: {
                        course: {
                            creatorId: creator.id
                        }
                    }
                }
            }
        })

        if (!comment) {
            return NextResponse.json({ error: 'Question not found' }, { status: 404 })
        }

        // Create reply
        const reply = await prisma.videoComment.create({
            data: {
                videoAssetId: comment.videoAssetId,
                userId: session.user.id,
                content: answer,
                parentId: questionId
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Answer posted successfully',
            reply
        })

    } catch (error) {
        console.error('Error answering question:', error)
        return NextResponse.json({ error: 'Failed to post answer' }, { status: 500 })
    }
}
