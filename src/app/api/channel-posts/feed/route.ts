import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { unstable_cache } from 'next/cache'

const TIER_RANK: Record<string, number> = {
    BRONZE: 0,
    SILVER: 1,
    GOLD: 2,
    VIP: 3,
}

function subscriptionTier(subscription: { type: string; metadata: string | null }): string {
    if (subscription.type !== 'CATEGORY_C' || !subscription.metadata) return 'BRONZE'
    try {
        return JSON.parse(subscription.metadata).tier || 'BRONZE'
    } catch {
        return 'BRONZE'
    }
}

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
        const now = new Date()
        const limit = Math.min(100, Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') || '50') || 50))

        const [session, posts] = await Promise.all([
            getServerSession(authOptions),
            getRecentPosts(limit),
        ])

        // One query for all of the viewer's active subscriptions instead of one per post
        const tierByChannel = new Map<string, number>()
        const lockedChannelIds = [...new Set(posts.filter((p) => p.tier !== 'BRONZE').map((p) => p.channelId))]
        if (session?.user?.id && lockedChannelIds.length > 0) {
            const subscriptions = await prisma.subscription.findMany({
                where: {
                    userId: session.user.id,
                    channelId: { in: lockedChannelIds },
                    status: 'active',
                    OR: [{ endDate: null }, { endDate: { gte: now } }],
                },
                select: { channelId: true, type: true, metadata: true },
            })
            for (const subscription of subscriptions) {
                if (!subscription.channelId) continue
                const rank = TIER_RANK[subscriptionTier(subscription)] ?? 0
                tierByChannel.set(subscription.channelId, Math.max(rank, tierByChannel.get(subscription.channelId) ?? -1))
            }
        }

        const postsWithAccess = posts.map((post) => {
            const requiredRank = TIER_RANK[post.tier] ?? 0
            const hasAccess = requiredRank === 0 || (tierByChannel.get(post.channelId) ?? -1) >= requiredRank

            if (hasAccess) return { ...post, hasAccess }

            // Locked: send a teaser only, never the paid media itself
            return {
                ...post,
                hasAccess,
                mediaUrl: null,
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
