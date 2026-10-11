import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canViewPost, getViewerAccess, requiredRankForPost } from '@/lib/content-access'

async function getCommentAccess(postId: string, viewerId?: string) {
    const post = await prisma.channelPost.findUnique({
        where: { id: postId },
        select: { tier: true, channelId: true, publishedAt: true, channel: { select: { creator: { select: { id: true, userId: true } } } } },
    })
    if (!post) return { exists: false, allowed: false }
    const isOwner = post.channel.creator.userId === viewerId
    if (!isOwner && (!post.publishedAt || post.publishedAt > new Date())) return { exists: false, allowed: false }
    const access = !isOwner && requiredRankForPost(post.tier) > 0 ? await getViewerAccess(viewerId) : null
    return {
        exists: true,
        allowed: canViewPost(post.tier, access?.rankFor(post.channel.creator.id, post.channelId) ?? -1, isOwner),
    }
}


// Get comments for a post
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const [session, { id: postId }] = await Promise.all([getServerSession(authOptions), params])
        const visibility = await getCommentAccess(postId, session?.user?.id)
        if (!visibility.exists) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
        if (!visibility.allowed) return NextResponse.json({ error: 'Subscription required' }, { status: 403 })

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

        return NextResponse.json({ comments }, { headers: { 'Cache-Control': 'private, no-store' } })
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

        if ((typeof content !== 'string' && content != null) || (typeof imageUrl !== 'string' && imageUrl != null) || (typeof content === 'string' && content.length > 5000) || (!content?.trim() && !imageUrl)) {
            return NextResponse.json(
                { error: 'Comment content or image is required' },
                { status: 400 }
            )
        }

        const visibility = await getCommentAccess(postId, session.user.id)
        if (!visibility.exists) {
            return NextResponse.json(
                { error: 'Post not found' },
                { status: 404 }
            )
        }

        if (!visibility.allowed) {
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
