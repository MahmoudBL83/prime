import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/scheduled-posts - Get creator's scheduled posts
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(req.url)
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const status = searchParams.get('status') // 'scheduled' | 'published' | 'draft'
        const creatorIdParam = searchParams.get('creatorId') // Optional: view another creator's calendar

        // Get creator ID - either from param or from logged-in user
        let creator
        if (creatorIdParam) {
            // Viewing another creator's calendar
            creator = await prisma.creator.findUnique({
                where: { id: creatorIdParam }
            })
        } else {
            // Viewing own calendar
            creator = await prisma.creator.findFirst({
                where: { userId: session.user.id }
            })
        }

        if (!creator) {
            return NextResponse.json(
                { error: 'Creator not found' },
                { status: 404 }
            )
        }

        // Build where clause - filter by channel.creatorId instead of direct creatorId
        const where: any = {
            channel: {
                creatorId: creator.id
            }
        }

        if (status) {
            if (status === 'scheduled') {
                where.scheduledAt = { not: null }
                where.publishedAt = null
            } else if (status === 'published') {
                where.publishedAt = { not: null }
            } else if (status === 'draft') {
                where.scheduledAt = null
                where.publishedAt = null
            }
        }

        if (startDate && endDate) {
            where.OR = [
                {
                    scheduledAt: {
                        gte: new Date(startDate),
                        lte: new Date(endDate)
                    }
                },
                {
                    publishedAt: {
                        gte: new Date(startDate),
                        lte: new Date(endDate)
                    }
                }
            ]
        }

        // Get scheduled posts
        const posts = await prisma.channelPost.findMany({
            where,
            include: {
                channel: {
                    select: {
                        name: true,
                        coverImage: true
                    }
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true
                    }
                }
            },
            orderBy: [
                { scheduledAt: 'asc' },
                { createdAt: 'desc' }
            ],
            take: 100
        })

        // Format posts with stats
        const formattedPosts = posts.map(post => ({
            id: post.id,
            channelId: post.channelId,
            channelName: post.channel.name,
            title: post.title,
            content: post.content,
            type: post.type,
            mediaUrl: post.mediaUrl,
            thumbnailUrl: post.thumbnailUrl,
            duration: post.duration,
            tier: post.tier,
            isPinned: post.isPinned,
            scheduledAt: post.scheduledAt,
            publishedAt: post.publishedAt,
            viewCount: post.viewCount,
            likeCount: post._count.likes,
            commentCount: post._count.comments,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            status: post.publishedAt 
                ? 'published' 
                : post.scheduledAt 
                    ? 'scheduled' 
                    : 'draft'
        }))

        return NextResponse.json({
            posts: formattedPosts
        })

    } catch (error: any) {
        console.error('Failed to fetch scheduled posts:', error)
        console.error('Error details:', error.message, error.stack)
        return NextResponse.json(
            { error: 'Failed to fetch scheduled posts', details: error.message },
            { status: 500 }
        )
    }
}

// POST /api/scheduled-posts - Create or update scheduled post
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await req.json()
        const { 
            postId, 
            channelId,
            title,
            content, 
            type,
            mediaUrl,
            thumbnailUrl,
            duration,
            tier,
            scheduledAt,
            action // 'create' | 'update' | 'reschedule' | 'publish' | 'cancel'
        } = body

        // Get creator
        const creator = await prisma.creator.findFirst({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json(
                { error: 'Creator not found' },
                { status: 404 }
            )
        }

        // Validate channel belongs to creator
        if (channelId) {
            const channel = await prisma.creatorChannel.findFirst({
                where: {
                    id: channelId,
                    creatorId: creator.id
                }
            })

            if (!channel) {
                return NextResponse.json(
                    { error: 'Channel not found or unauthorized' },
                    { status: 403 }
                )
            }
        }

        let post

        switch (action) {
            case 'create':
                // Create new scheduled post - single subscription model
                post = await prisma.channelPost.create({
                    data: {
                        channelId: channelId || (await getDefaultChannel(creator.id)),
                        title: title || null,
                        content: content || '',
                        type: type || 'TEXT',
                        mediaUrl: mediaUrl || null,
                        thumbnailUrl: thumbnailUrl || null,
                        duration: duration || null,
                        tier: 'SUBSCRIBER', // Single subscription tier
                        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
                        publishedAt: null
                    }
                })
                break

            case 'update':
                // Update existing post
                if (!postId) {
                    return NextResponse.json(
                        { error: 'Post ID required' },
                        { status: 400 }
                    )
                }

                post = await prisma.channelPost.update({
                    where: { id: postId },
                    data: {
                        title: title || undefined,
                        content: content || undefined,
                        type: type || undefined,
                        mediaUrl: mediaUrl || undefined,
                        thumbnailUrl: thumbnailUrl || undefined,
                        duration: duration || undefined,
                        tier: tier || undefined,
                        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined
                    }
                })
                break

            case 'reschedule':
                // Reschedule post
                if (!postId || !scheduledAt) {
                    return NextResponse.json(
                        { error: 'Post ID and scheduledAt required' },
                        { status: 400 }
                    )
                }

                post = await prisma.channelPost.update({
                    where: { id: postId },
                    data: {
                        scheduledAt: new Date(scheduledAt)
                    }
                })
                break

            case 'publish':
                // Publish post immediately
                if (!postId) {
                    return NextResponse.json(
                        { error: 'Post ID required' },
                        { status: 400 }
                    )
                }

                post = await prisma.channelPost.update({
                    where: { id: postId },
                    data: {
                        publishedAt: new Date(),
                        scheduledAt: null
                    }
                })
                break

            case 'cancel':
                // Cancel scheduled post (revert to draft)
                if (!postId) {
                    return NextResponse.json(
                        { error: 'Post ID required' },
                        { status: 400 }
                    )
                }

                post = await prisma.channelPost.update({
                    where: { id: postId },
                    data: {
                        scheduledAt: null
                    }
                })
                break

            default:
                return NextResponse.json(
                    { error: 'Invalid action' },
                    { status: 400 }
                )
        }

        return NextResponse.json({
            success: true,
            post: {
                id: post.id,
                scheduledAt: post.scheduledAt,
                publishedAt: post.publishedAt,
                status: post.publishedAt 
                    ? 'published' 
                    : post.scheduledAt 
                        ? 'scheduled' 
                        : 'draft'
            }
        })

    } catch (error) {
        console.error('Scheduled post error:', error)
        return NextResponse.json(
            { error: 'Failed to process scheduled post' },
            { status: 500 }
        )
    }
}

// DELETE /api/scheduled-posts - Delete scheduled post
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(req.url)
        const postId = searchParams.get('postId')

        if (!postId) {
            return NextResponse.json(
                { error: 'Post ID required' },
                { status: 400 }
            )
        }

        // Get creator
        const creator = await prisma.creator.findFirst({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json(
                { error: 'Creator not found' },
                { status: 404 }
            )
        }

        // Verify post belongs to creator
        const post = await prisma.channelPost.findFirst({
            where: {
                id: postId,
                channel: {
                    creatorId: creator.id
                }
            }
        })

        if (!post) {
            return NextResponse.json(
                { error: 'Post not found or unauthorized' },
                { status: 403 }
            )
        }

        // Delete post
        await prisma.channelPost.delete({
            where: { id: postId }
        })

        return NextResponse.json({
            success: true,
            message: 'Post deleted successfully'
        })

    } catch (error) {
        console.error('Delete post error:', error)
        return NextResponse.json(
            { error: 'Failed to delete post' },
            { status: 500 }
        )
    }
}

// Helper function to get or create default channel
async function getDefaultChannel(creatorId: string): Promise<string> {
    let channel = await prisma.creatorChannel.findFirst({
        where: { creatorId }
    })

    if (!channel) {
        channel = await prisma.creatorChannel.create({
            data: {
                creatorId,
                name: 'Main Channel',
                description: 'My main content channel',
                tiers: {
                    bronze: { price: 49, benefits: [] },
                    silver: { price: 99, benefits: [] },
                    gold: { price: 199, benefits: [] }
                }
            }
        })
    }

    return channel.id
}
