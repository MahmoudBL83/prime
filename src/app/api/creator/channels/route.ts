import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch creator's channels
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify creator
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 })
        }

        // Fetch channels with statistics
        const channels = await prisma.creatorChannel.findMany({
            where: { creatorId: creator.id },
            include: {
                _count: {
                    select: {
                        posts: true,
                        liveSessions: true,
                        memberGroups: true,
                        subscriptions: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        // Calculate additional stats for each channel
        const channelsWithStats = await Promise.all(
            channels.map(async (channel) => {
                const [activeSubscribers, recentPosts, upcomingLiveSessions] = await Promise.all([
                    prisma.subscription.count({
                        where: {
                            channelId: channel.id,
                            status: 'ACTIVE'
                        }
                    }),
                    prisma.channelPost.count({
                        where: {
                            channelId: channel.id,
                            publishedAt: { not: null },
                            createdAt: {
                                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                            }
                        }
                    }),
                    prisma.liveSession.count({
                        where: {
                            channelId: channel.id,
                            status: 'SCHEDULED',
                            scheduledAt: { gte: new Date() }
                        }
                    })
                ])

                return {
                    ...channel,
                    stats: {
                        activeSubscribers,
                        recentPosts,
                        upcomingLiveSessions,
                        totalPosts: channel._count.posts,
                        totalLiveSessions: channel._count.liveSessions,
                        totalGroups: channel._count.memberGroups
                    }
                }
            })
        )

        return NextResponse.json({
            success: true,
            data: {
                channels: channelsWithStats,
                totalChannels: channels.length
            }
        })
    } catch (error) {
        console.error('Error fetching channels:', error)
        return NextResponse.json(
            { error: 'Failed to fetch channels' },
            { status: 500 }
        )
    }
}
