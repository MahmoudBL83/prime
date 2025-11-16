/**
 * Discussion Replies API
 * GET /api/discussions/[id]/replies
 * POST /api/discussions/[id]/replies
 * 
 * Handle threaded replies to discussions
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get replies for a discussion
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const replies = await prisma.discussionReply.findMany({
            where: {
                discussionId: id,
                isDeleted: false
            },
            orderBy: [
                { isPinned: 'desc' },
                { upvotes: 'desc' },
                { createdAt: 'asc' }
            ],
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        image: true
                    }
                },
                _count: {
                    select: {
                        upvotes: true
                    }
                }
            }
        })

        return NextResponse.json({
            success: true,
            data: replies
        })

    } catch (error) {
        console.error('Get replies error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch replies' },
            { status: 500 }
        )
    }
}

// POST - Create a reply
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const { id } = await params;

        const body = await request.json()
        const { content, parentReplyId } = body

        // Validation
        if (!content || content.length < 10) {
            return NextResponse.json(
                { error: 'Reply must be at least 10 characters' },
                { status: 400 }
            )
        }

        // Verify discussion exists
        const discussion = await prisma.courseDiscussion.findUnique({
            where: { id: id },
            include: {
                course: {
                    select: {
                        id: true,
                        creatorId: true,
                        enrollments: {
                            where: {
                                userId: session.user.id,
                                status: 'ACTIVE'
                            },
                            select: { id: true }
                        }
                    }
                }
            }
        })

        if (!discussion) {
            return NextResponse.json(
                { error: 'Discussion not found' },
                { status: 404 }
            )
        }

        // Check access
        const isCreator = discussion.course.creatorId === session.user.id
        const isEnrolled = discussion.course.enrollments.length > 0

        if (!isCreator && !isEnrolled) {
            return NextResponse.json(
                { error: 'You must be enrolled to reply' },
                { status: 403 }
            )
        }

        // If parentReplyId, verify it exists
        if (parentReplyId) {
            const parentReply = await prisma.discussionReply.findFirst({
                where: {
                    id: parentReplyId,
                    discussionId: id
                }
            })

            if (!parentReply) {
                return NextResponse.json(
                    { error: 'Parent reply not found' },
                    { status: 404 }
                )
            }
        }

        // Create reply
        const reply = await prisma.discussionReply.create({
            data: {
                content,
                discussionId: id,
                authorId: session.user.id,
                parentReplyId: parentReplyId || null,
                upvotes: 0,
                isInstructorReply: isCreator,
                isPinned: false,
                isDeleted: false
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        image: true
                    }
                }
            }
        })

        // Mark discussion as solved if instructor replies and marks it
        if (isCreator && body.markAsSolved) {
            await prisma.courseDiscussion.update({
                where: { id: id },
                data: { isSolved: true }
            })
        }

        return NextResponse.json({
            success: true,
            data: reply
        }, { status: 201 })

    } catch (error) {
        console.error('Create reply error:', error)
        return NextResponse.json(
            { error: 'Failed to create reply' },
            { status: 500 }
        )
    }
}
