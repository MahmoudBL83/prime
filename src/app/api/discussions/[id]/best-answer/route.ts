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

        // Get discussion (using VideoComment as base discussion)
        const discussion = await prisma.videoComment.findUnique({
            where: { id },
            include: {
                videoAsset: {
                    select: {
                        course: {
                            select: {
                                creatorId: true
                            }
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

        // Check if video asset and course exist
        if (!discussion.videoAsset || !discussion.videoAsset.course) {
            return NextResponse.json(
                { error: 'Invalid discussion - missing video asset or course' },
                { status: 400 }
            )
        }

        // Check permissions (author or instructor can mark best answer)
        const isAuthor = discussion.userId === (session.user as any).id
        const isInstructor = discussion.videoAsset.course.creatorId === (session.user as any).id

        if (!isAuthor && !isInstructor) {
            return NextResponse.json(
                { error: 'Only the discussion author or instructor can mark best answer' },
                { status: 403 }
            )
        }

        // Verify reply belongs to this discussion (using VideoComment for replies)
        const reply = await prisma.videoComment.findFirst({
            where: {
                id: replyId,
                parentId: id // Parent comment is the discussion
            }
        })

        if (!reply) {
            return NextResponse.json(
                { error: 'Reply not found in this discussion' },
                { status: 404 }
            )
        }

        // Remove previous best answer (if any) - using custom field approach
        await prisma.videoComment.updateMany({
            where: {
                parentId: id,
                // Note: VideoComment doesn't have isBestAnswer field, 
                // we'll need to track this differently
            },
            data: {
                isPinned: false // Remove pinned status from previous best answer
            }
        })

        // Mark new best answer
        const updatedReply = await prisma.videoComment.update({
            where: { id: replyId },
            data: {
                isPinned: true // Use pinned status as best answer marker
            }
        })

        // Mark discussion as solved (using isHidden field as solved marker)
        await prisma.videoComment.update({
            where: { id },
            data: {
                // Note: VideoComment doesn't have isSolved field,
                // we could use a custom approach or extend the model
                isHidden: false // Keep discussion visible when solved
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

        const discussion = await prisma.videoComment.findUnique({
            where: { id },
            include: {
                videoAsset: {
                    select: {
                        course: {
                            select: {
                                creatorId: true
                            }
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

        // Check if video asset and course exist
        if (!discussion.videoAsset || !discussion.videoAsset.course) {
            return NextResponse.json(
                { error: 'Invalid discussion - missing video asset or course' },
                { status: 400 }
            )
        }

        // Check permissions
        const isAuthor = discussion.userId === (session.user as any).id
        const isInstructor = discussion.videoAsset.course.creatorId === (session.user as any).id

        if (!isAuthor && !isInstructor) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            )
        }

        // Remove best answer (unpin all replies)
        await prisma.videoComment.updateMany({
            where: {
                parentId: id,
                isPinned: true
            },
            data: {
                isPinned: false
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
