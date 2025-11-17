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
        const replies = await prisma.videoComment.findMany({
            where: {
                parentId: id, // Parent comment is the discussion
                isHidden: false // Use isHidden instead of isDeleted
            },
            orderBy: [
                { isPinned: 'desc' },
                { likesCount: 'desc' }, // Use likesCount instead of upvotes
                { createdAt: 'asc' }
            ],
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        profileImage: true // Use profileImage instead of image
                    }
                },
                _count: {
                    select: {
                        likes: true // Count likes instead of upvotes
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

        // Verify discussion exists (main comment as discussion)
        const discussion = await prisma.videoComment.findUnique({
            where: { id: id },
            include: {
                videoAsset: {
                    include: {
                        course: {
                            select: {
                                id: true,
                                creatorId: true,
                                enrollments: {
                                    where: {
                                        userId: (session.user as any).id
                                        // Enrollment doesn't have status field, so just check if enrollment exists
                                    },
                                    select: { id: true }
                                }
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

        // Check access
        const isCreator = discussion?.videoAsset?.course?.creatorId === (session.user as any).id
        const isEnrolled = (discussion?.videoAsset?.course?.enrollments?.length || 0) > 0

        if (!isCreator && !isEnrolled) {
            return NextResponse.json(
                { error: 'You must be enrolled to reply' },
                { status: 403 }
            )
        }

        // If parentReplyId, verify it exists
        if (parentReplyId) {
            const parentReply = await prisma.videoComment.findFirst({
                where: {
                    id: parentReplyId,
                    parentId: id // Parent of the parent is the main discussion
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
        const reply = await prisma.videoComment.create({
            data: {
                content,
                videoAssetId: discussion.videoAssetId, // Use the same video asset
                userId: (session.user as any).id,
                parentId: parentReplyId || id, // If no parent, reply to main discussion
                timestamp: null, // No timestamp for discussion replies
                likesCount: 0,
                isEdited: false,
                isPinned: false,
                isHidden: false
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        profileImage: true
                    }
                }
            }
        })

        // Mark discussion as solved if instructor replies and marks it
        if (isCreator && body.markAsSolved) {
            await prisma.videoComment.update({
                where: { id: id },
                data: { 
                    // Note: VideoComment doesn't have isSolved field,
                    // we use isPinned as an alternative
                    isPinned: true 
                }
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
