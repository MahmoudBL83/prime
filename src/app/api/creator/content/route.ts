import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Get creator profile
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json(
                { error: 'Creator profile not found' },
                { status: 404 }
            )
        }

        // Get all channels with their posts
        const channels = await prisma.creatorChannel.findMany({
            where: { creatorId: creator.id },
            include: {
                posts: {
                    include: {
                        _count: {
                            select: {
                                likes: true,
                                comments: true,
                                bookmarks: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        })

        // Flatten all posts from all channels
        const allPosts = channels.flatMap(channel => 
            channel.posts.map(post => ({
                id: post.id,
                title: post.title || post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
                type: post.type,
                thumbnail: post.thumbnailUrl,
                mediaUrl: post.mediaUrl,
                views: post.viewCount,
                likes: post._count.likes,
                comments: post._count.comments,
                status: post.publishedAt ? 'PUBLISHED' : 'DRAFT',
                visibility: post.tier,
                publishedAt: post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : null,
                duration: post.duration,
                createdAt: post.createdAt
            }))
        )

        // Sort by creation date
        allPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        return NextResponse.json({
            success: true,
            content: allPosts
        })

    } catch (error) {
        console.error('Failed to fetch creator content:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
