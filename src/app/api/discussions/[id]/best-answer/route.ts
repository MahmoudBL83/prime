/**
 * Best Answer API
 * POST /api/discussions/[id]/best-answer
 * 
 * Mark a reply as the best answer for a discussion
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { replyId } = body

        if (!replyId) {
            return NextResponse.json(
                { error: 'Reply ID is required' },
                { status: 400 }
            )
        }

        // Get discussion
        const discussion = await prisma.courseDiscussion.findUnique({
            where: { id },
            include: {
                course: {
                    select: {
                        creatorId: true
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

        // Check permissions (author or instructor can mark best answer)
        const isAuthor = discussion.authorId === session.user.id
        const isInstructor = discussion.course.creatorId === session.user.id

        if (!isAuthor && !isInstructor) {
            return NextResponse.json(
                { error: 'Only the discussion author or instructor can mark best answer' },
                { status: 403 }
            )
        }

        // Verify reply belongs to this discussion
        const reply = await prisma.discussionReply.findFirst({
            where: {
                id: replyId,
                discussionId: id
            }
        })

        if (!reply) {
            return NextResponse.json(
                { error: 'Reply not found in this discussion' },
                { status: 404 }
            )
        }

        // Remove previous best answer (if any)
        await prisma.discussionReply.updateMany({
            where: {
                discussionId: id,
                isBestAnswer: true
            },
            data: {
                isBestAnswer: false
            }
        })

        // Mark new best answer
        const updatedReply = await prisma.discussionReply.update({
            where: { id: replyId },
            data: {
                isBestAnswer: true,
                isPinned: true // Also pin it
            }
        })

        // Mark discussion as solved
        await prisma.courseDiscussion.update({
            where: { id },
            data: {
                isSolved: true
            }
        })

        // Send notification to reply author
        await fetch(`${process.env.NEXTAUTH_URL}/api/discussions/${id}/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'best_answer',
                replyId
            })
        }).catch(err => console.error('Notification failed:', err))

        return NextResponse.json({
            success: true,
            data: updatedReply
        })

    } catch (error) {
        console.error('Best answer error:', error)
        return NextResponse.json(
            { error: 'Failed to mark best answer' },
            { status: 500 }
        )
    }
}

// DELETE - Remove best answer
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const discussion = await prisma.courseDiscussion.findUnique({
            where: { id },
            include: {
                course: {
                    select: {
                        creatorId: true
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

        // Check permissions
        const isAuthor = discussion.authorId === session.user.id
        const isInstructor = discussion.course.creatorId === session.user.id

        if (!isAuthor && !isInstructor) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            )
        }

        // Remove best answer
        await prisma.discussionReply.updateMany({
            where: {
                discussionId: id,
                isBestAnswer: true
            },
            data: {
                isBestAnswer: false
            }
        })

        return NextResponse.json({
            success: true
        })

    } catch (error) {
        console.error('Remove best answer error:', error)
        return NextResponse.json(
            { error: 'Failed to remove best answer' },
            { status: 500 }
        )
    }
}
