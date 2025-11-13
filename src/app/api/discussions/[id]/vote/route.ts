/**
 * Discussion Voting API
 * POST /api/discussions/[id]/vote
 * 
 * Upvote/downvote discussions and replies
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { type, action } = body // type: 'discussion' | 'reply', action: 'upvote' | 'remove'

        if (!['discussion', 'reply'].includes(type)) {
            return NextResponse.json(
                { error: 'Invalid type. Must be "discussion" or "reply"' },
                { status: 400 }
            )
        }

        if (!['upvote', 'remove'].includes(action)) {
            return NextResponse.json(
                { error: 'Invalid action. Must be "upvote" or "remove"' },
                { status: 400 }
            )
        }

        if (type === 'discussion') {
            // Check if already voted
            const existingVote = await prisma.discussionVote.findFirst({
                where: {
                    discussionId: params.id,
                    userId: session.user.id
                }
            })

            if (action === 'upvote') {
                if (existingVote) {
                    return NextResponse.json({
                        success: true,
                        message: 'Already voted'
                    })
                }

                // Create vote and increment counter
                await prisma.$transaction([
                    prisma.discussionVote.create({
                        data: {
                            discussionId: params.id,
                            userId: session.user.id
                        }
                    }),
                    prisma.courseDiscussion.update({
                        where: { id: params.id },
                        data: {
                            upvotes: {
                                increment: 1
                            }
                        }
                    })
                ])
            } else {
                // Remove vote
                if (!existingVote) {
                    return NextResponse.json({
                        success: true,
                        message: 'Vote not found'
                    })
                }

                await prisma.$transaction([
                    prisma.discussionVote.delete({
                        where: { id: existingVote.id }
                    }),
                    prisma.courseDiscussion.update({
                        where: { id: params.id },
                        data: {
                            upvotes: {
                                decrement: 1
                            }
                        }
                    })
                ])
            }
        } else {
            // Reply voting
            const existingVote = await prisma.replyVote.findFirst({
                where: {
                    replyId: params.id,
                    userId: session.user.id
                }
            })

            if (action === 'upvote') {
                if (existingVote) {
                    return NextResponse.json({
                        success: true,
                        message: 'Already voted'
                    })
                }

                await prisma.$transaction([
                    prisma.replyVote.create({
                        data: {
                            replyId: params.id,
                            userId: session.user.id
                        }
                    }),
                    prisma.discussionReply.update({
                        where: { id: params.id },
                        data: {
                            upvotes: {
                                increment: 1
                            }
                        }
                    })
                ])
            } else {
                if (!existingVote) {
                    return NextResponse.json({
                        success: true,
                        message: 'Vote not found'
                    })
                }

                await prisma.$transaction([
                    prisma.replyVote.delete({
                        where: { id: existingVote.id }
                    }),
                    prisma.discussionReply.update({
                        where: { id: params.id },
                        data: {
                            upvotes: {
                                decrement: 1
                            }
                        }
                    })
                ])
            }
        }

        return NextResponse.json({
            success: true,
            action
        })

    } catch (error) {
        console.error('Vote error:', error)
        return NextResponse.json(
            { error: 'Failed to process vote' },
            { status: 500 }
        )
    }
}
