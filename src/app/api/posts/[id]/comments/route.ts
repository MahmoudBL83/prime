import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Get comments for a post
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: postId } = await params

        const comments = await prisma.postComment.findMany({
            where: { postId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        arabicName: true,
                        profileImage: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json({ comments })
    } catch (error) {
        console.error('Error fetching comments:', error)
        return NextResponse.json(
            { error: 'Failed to fetch comments' },
            { status: 500 }
        )
    }
}

// Create a comment
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id: postId } = await params
        const { content, imageUrl } = await request.json()

        if (!content?.trim() && !imageUrl) {
            return NextResponse.json(
                { error: 'Comment content or image is required' },
                { status: 400 }
            )
        }

        // Check if post exists
        const post = await prisma.channelPost.findUnique({
            where: { id: postId },
            include: {
                channel: true
            }
        })

        if (!post) {
            return NextResponse.json(
                { error: 'Post not found' },
                { status: 404 }
            )
        }

        // Check if user has access to comment - single subscription model
        // All subscribers can comment on all posts
        const subscription = await prisma.subscription.findFirst({
            where: {
                userId: session.user.id,
                channelId: post.channelId,
                status: 'active',
                OR: [
                    { endDate: null },
                    { endDate: { gte: new Date() } }
                ]
            }
        })

        if (!subscription) {
            return NextResponse.json(
                { error: 'Subscription required to comment' },
                { status: 403 }
            )
        }

        // Create comment
        const comment = await prisma.postComment.create({
            data: {
                postId,
                userId: session.user.id,
                content: content?.trim() || '',
                imageUrl: imageUrl || null
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        arabicName: true,
                        profileImage: true,
                    }
                }
            }
        })

        return NextResponse.json({ comment })
    } catch (error) {
        console.error('Error creating comment:', error)
        return NextResponse.json(
            { error: 'Failed to create comment' },
            { status: 500 }
        )
    }
}
