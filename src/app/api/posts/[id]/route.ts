import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canViewPost, getViewerAccess, requiredRankForPost } from '@/lib/content-access'

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const [session, { id: postId }] = await Promise.all([
            getServerSession(authOptions),
            params,
        ])
        const viewerId = session?.user?.id

        const post = await prisma.channelPost.findUnique({
            where: { id: postId },
            select: {
                id: true,
                channelId: true,
                title: true,
                titleAr: true,
                content: true,
                contentAr: true,
                type: true,
                mediaUrl: true,
                thumbnailUrl: true,
                duration: true,
                publishedAt: true,
                createdAt: true,
                tier: true,
                isPinned: true,
                viewCount: true,
                channel: {
                    select: {
                        id: true,
                        name: true,
                        nameAr: true,
                        creator: {
                            select: {
                                id: true,
                                userId: true,
                                expertise: true,
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        arabicName: true,
                                        profileImage: true,
                                    },
                                },
                            },
                        },
                    },
                },
                _count: { select: { likes: true, comments: true } },
            },
        })

        if (!post || ((!post.publishedAt || post.publishedAt > new Date()) && post.channel.creator.userId !== viewerId)) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 })
        }

        const isOwner = !!viewerId && post.channel.creator.userId === viewerId
        const access = !isOwner && requiredRankForPost(post.tier) > 0
            ? await getViewerAccess(viewerId)
            : null
        const hasAccess = canViewPost(
            post.tier,
            access?.rankFor(post.channel.creator.id, post.channelId) ?? -1,
            isOwner
        )

        const [likes, comments] = await Promise.all([
            viewerId
                ? prisma.postLike.findMany({
                    where: { postId, userId: viewerId },
                    select: { id: true, userId: true },
                })
                : Promise.resolve([]),
            hasAccess
                ? prisma.postComment.findMany({
                    where: { postId },
                    orderBy: { createdAt: 'desc' },
                    take: 50,
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                arabicName: true,
                                profileImage: true,
                            },
                        },
                    },
                })
                : Promise.resolve([]),
        ])

        // Do not send locked media, thumbnails of locked images, or paid text.
        const visiblePost = hasAccess ? post : {
            ...post,
            mediaUrl: null,
            thumbnailUrl: post.type === 'VIDEO' ? post.thumbnailUrl : null,
            content: post.content.slice(0, 140),
            contentAr: post.contentAr?.slice(0, 140) ?? null,
        }

        // A preview counts as a view; counter-only writes do not invalidate the feed cache.
        await prisma.channelPost.update({
            where: { id: postId },
            data: { viewCount: { increment: 1 } },
        })

        return NextResponse.json({
            post: { ...visiblePost, likes, comments },
            hasAccess,
        }, { headers: { 'Cache-Control': 'private, no-store' } })
    } catch (error) {
        console.error('Error fetching post:', error)
        return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 })
    }
}
