import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { unstable_cache } from 'next/cache'
import { canViewPost, getViewerAccess, requiredRankForPost } from '@/lib/content-access'

/**
 * The post list itself is the same for every viewer (access is resolved per
 * viewer below), so it is cached briefly. Publishing routes call
 * revalidateTag('feed') so new posts appear immediately.
 */
const getRecentPosts = unstable_cache(
    async (limit: number) =>
        // Only the fields the feed renders - never whole creator rows
        prisma.channelPost.findMany({
            where: { publishedAt: { lte: new Date() } },
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
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    },
                },
            },
            orderBy: { publishedAt: 'desc' },
            take: limit,
        }),
    ['channel-feed-v1'],
    { revalidate: 20, tags: ['feed'] }
)

export async function GET(request: NextRequest) {
    try {
        const limit = Math.min(100, Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') || '50') || 50))

        const [session, posts] = await Promise.all([
            getServerSession(authOptions),
            getRecentPosts(limit),
        ])

        // One query for all of the viewer's subscriptions, only if anything is locked
        const viewerId = session?.user?.id
        const needsAccessCheck = posts.some((post) => requiredRankForPost(post.tier) > 0)
        const access = needsAccessCheck ? await getViewerAccess(viewerId) : null

        const postsWithAccess = posts.map((post) => {
            const creator = post.channel.creator
            const hasAccess = canViewPost(
                post.tier,
                access ? access.rankFor(creator.id, post.channelId) : -1,
                !!viewerId && creator.userId === viewerId
            )

            if (hasAccess) return { ...post, hasAccess }

            // Locked: send a teaser only, never the paid media itself
            return {
                ...post,
                hasAccess,
                mediaUrl: null,
                // A blurred image is still the image - only video teaser thumbnails are safe to send
                thumbnailUrl: post.type === 'VIDEO' ? post.thumbnailUrl : null,
                content: post.content.length > 140 ? `${post.content.slice(0, 140)}…` : post.content,
                contentAr: post.contentAr && post.contentAr.length > 140 ? `${post.contentAr.slice(0, 140)}…` : post.contentAr,
            }
        })

        return NextResponse.json({ posts: postsWithAccess })
    } catch (error) {
        console.error('Error fetching posts:', error)
        return NextResponse.json(
            { error: 'Failed to fetch posts' },
            { status: 500 }
        )
    }
}
