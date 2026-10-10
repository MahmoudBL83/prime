import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'


export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        const { id: postId } = await params

        // Fetch post with all relations
        const post = await prisma.channelPost.findUnique({
            where: { id: postId },
            include: {
                channel: {
                    include: {
                        creator: {
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
                        }
                    }
                },
                likes: {
                    select: {
                        id: true,
                        userId: true,
                    }
                },
                comments: {
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
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    }
                }
            }
        })

        if (!post) {
            return NextResponse.json(
                { error: 'Post not found' },
                { status: 404 }
            )
        }

        // Check if user has access based on subscription tier
        let hasAccess = post.tier === 'BRONZE' // Bronze posts are free

        if (!hasAccess && session?.user?.id) {
            // Check if user has active subscription to the channel
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

            if (subscription) {
                // Check if subscription tier meets post requirement
                const tierHierarchy: { [key: string]: number } = {
                    BRONZE: 0,
                    SILVER: 1,
                    GOLD: 2,
                    VIP: 3,
                }

                const subscriptionTier = subscription.type === 'CATEGORY_C' 
                    ? (subscription.metadata ? JSON.parse(subscription.metadata).tier : 'BRONZE')
                    : 'BRONZE'

                hasAccess = tierHierarchy[subscriptionTier] >= tierHierarchy[post.tier]
            }
        }

        // Increment view count
        await prisma.channelPost.update({
            where: { id: postId },
            data: { viewCount: { increment: 1 } }
        })

        return NextResponse.json({
            post: {
                ...post,
                // Add user field to comments for consistency
                comments: post.comments.map(comment => ({
                    ...comment,
                    user: comment.user
                }))
            },
            hasAccess
        })
    } catch (error) {
        console.error('Error fetching post:', error)
        return NextResponse.json(
            { error: 'Failed to fetch post' },
            { status: 500 }
        )
    }
}
