import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        // Fetch published posts from all channels
        const posts = await prisma.channelPost.findMany({
            where: {
                publishedAt: {
                    lte: new Date() // Only published posts
                }
            },
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
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    }
                }
            },
            orderBy: {
                publishedAt: 'desc'
            },
            take: 50 // Limit to 50 most recent posts
        })

        // Check user's access to each post if logged in
        const postsWithAccess = await Promise.all(
            posts.map(async (post) => {
                let hasAccess = post.tier === 'BRONZE'

                if (!hasAccess && session?.user?.id) {
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

                return {
                    ...post,
                    hasAccess
                }
            })
        )

        return NextResponse.json({ posts: postsWithAccess })
    } catch (error) {
        console.error('Error fetching posts:', error)
        return NextResponse.json(
            { error: 'Failed to fetch posts' },
            { status: 500 }
        )
    }
}
