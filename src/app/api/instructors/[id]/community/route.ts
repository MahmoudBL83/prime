import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canViewPost, getViewerAccess } from '@/lib/content-access'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: creatorId } = await params;
        const creator = await prisma.creator.findUnique({ where: { id: creatorId }, select: { userId: true } })
        if (!creator) return NextResponse.json({ error: 'Instructor not found' }, { status: 404 })
        const isOwner = creator.userId === session.user.id
        const visibleWhere = {
            channel: { creatorId },
            ...(isOwner ? {} : { publishedAt: { lte: new Date() } }),
        }

        // Get community data for this instructor - posts from their channel
        const [communityPosts, communityStats] = await Promise.all([
            // Recent community posts
            prisma.channelPost.findMany({
                where: visibleWhere,
                select: {
                    id: true,
                    channelId: true,
                    title: true,
                    content: true,
                    createdAt: true,
                    viewCount: true,
                    tier: true,
                    likes: {
                        select: {
                            id: true
                        }
                    },
                    comments: {
                        select: {
                            id: true,
                            content: true,
                            createdAt: true,
                            user: {
                                select: {
                                    name: true,
                                    arabicName: true
                                }
                            }
                        },
                        take: 3,
                        orderBy: {
                            createdAt: 'desc'
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: 10
            }),
            
            // Community engagement stats
            prisma.channelPost.aggregate({
                where: visibleWhere,
                _count: { id: true },
                _sum: { viewCount: true }
            })
        ])

        // Calculate engagement metrics
        const totalPosts = communityStats._count.id || 0
        const totalViews = communityStats._sum.viewCount || 0
        const totalLikes = communityPosts.reduce((sum: number, post: any) => sum + (post.likes?.length || 0), 0)
        const totalComments = communityPosts.reduce((sum: number, post: any) => sum + (post.comments?.length || 0), 0)

        const access = isOwner ? null : await getViewerAccess(session.user.id)
        const visiblePosts = communityPosts.map((post) => {
            const allowed = canViewPost(post.tier, access?.rankFor(creatorId, post.channelId) ?? -1, isOwner)
            return allowed ? post : { ...post, content: '', comments: [] }
        })

        const communityData = {
            posts: visiblePosts,
            stats: {
                totalPosts,
                totalViews,
                totalLikes,
                totalComments,
                engagementRate: totalViews > 0 ? ((totalLikes + totalComments) / totalViews * 100).toFixed(2) : 0
            }
        }

        return NextResponse.json(communityData, { headers: { 'Cache-Control': 'private, no-store' } })
    } catch (error) {
        console.error('Get community data error:', error)
        return NextResponse.json(
            { error: 'Failed to get community data' },
            { status: 500 }
        )
    }
}
