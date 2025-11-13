import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/mentors/[id]/discussions - Get discussions for a mentor's channel posts
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: mentorId } = await context.params
        const { searchParams } = new URL(request.url)
        const postId = searchParams.get('postId')

        // Get mentor's channel
        const mentor = await prisma.creator.findUnique({
            where: { id: mentorId },
            include: {
                channels: {
                    include: {
                        posts: {
                            select: { id: true }
                        }
                    }
                }
            }
        })

        if (!mentor || !mentor.channels[0]) {
            return NextResponse.json(
                { error: 'Mentor or channel not found' },
                { status: 404 }
            )
        }

        const channel = mentor.channels[0]
        const postIds = channel.posts.map(p => p.id)

        // Build where clause
        const where: any = {
            postId: postId ? postId : { in: postIds }
        }

        // Get comments (only top-level comments, no replies since PostComment doesn't have parentId)
        const comments = await prisma.postComment.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        arabicName: true,
                        profileImage: true
                    }
                },
                post: {
                    select: {
                        id: true,
                        title: true,
                        titleAr: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json({
            comments,
            total: comments.length
        })

    } catch (error) {
        console.error('Error fetching discussions:', error)
        return NextResponse.json(
            { error: 'Failed to fetch discussions' },
            { status: 500 }
        )
    }
}

// POST /api/mentors/[id]/discussions - Create a comment/discussion
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id: mentorId } = await context.params
        const body = await request.json()
        const { postId, content } = body

        if (!postId || !content) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Verify the post belongs to this mentor's channel
        const post = await prisma.channelPost.findFirst({
            where: {
                id: postId,
                channel: {
                    creatorId: mentorId
                }
            }
        })

        if (!post) {
            return NextResponse.json(
                { error: 'Post not found for this mentor' },
                { status: 404 }
            )
        }

        // Create the comment
        const comment = await prisma.postComment.create({
            data: {
                userId: session.user.id,
                postId: postId,
                content
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        arabicName: true,
                        profileImage: true
                    }
                },
                post: {
                    select: {
                        id: true,
                        title: true,
                        titleAr: true
                    }
                }
            }
        })

        return NextResponse.json({
            comment,
            message: 'Comment posted successfully'
        }, { status: 201 })

    } catch (error) {
        console.error('Error creating discussion:', error)
        return NextResponse.json(
            { error: 'Failed to create comment' },
            { status: 500 }
        )
    }
}

// DELETE /api/mentors/[id]/discussions - Delete a comment
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const commentId = searchParams.get('commentId')

        if (!commentId) {
            return NextResponse.json(
                { error: 'Comment ID required' },
                { status: 400 }
            )
        }

        // Check if user owns the comment
        const comment = await prisma.postComment.findUnique({
            where: { id: commentId }
        })

        if (!comment) {
            return NextResponse.json(
                { error: 'Comment not found' },
                { status: 404 }
            )
        }

        if (comment.userId !== session.user.id) {
            return NextResponse.json(
                { error: 'Unauthorized to delete this comment' },
                { status: 403 }
            )
        }

        // Delete the comment
        await prisma.postComment.delete({
            where: { id: commentId }
        })

        return NextResponse.json({
            message: 'Comment deleted successfully'
        })

    } catch (error) {
        console.error('Error deleting discussion:', error)
        return NextResponse.json(
            { error: 'Failed to delete comment' },
            { status: 500 }
        )
    }
}
