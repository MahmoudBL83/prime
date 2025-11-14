import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch creator's posts across all channels or specific channel
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

        const { searchParams } = new URL(request.url)
        const channelId = searchParams.get('channelId')
        const status = searchParams.get('status') // 'scheduled', 'published', 'all'
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')

        const skip = (page - 1) * limit

        // Build where clause
        const where: any = {}
        
        if (channelId) {
            where.channelId = channelId
        } else {
            // Only get posts from creator's channels
            const creatorChannels = await prisma.creatorChannel.findMany({
                where: { creatorId: creator.id },
                select: { id: true }
            })
            where.channelId = { in: creatorChannels.map(c => c.id) }
        }

        const now = new Date()
        if (status === 'scheduled') {
            where.scheduledAt = { gt: now }
            where.publishedAt = null
        } else if (status === 'published') {
            where.publishedAt = { not: null, lte: now }
        }

        // Fetch posts
        const [posts, total] = await Promise.all([
            prisma.channelPost.findMany({
                where,
                include: {
                    channel: {
                        select: {
                            id: true,
                            name: true,
                            nameAr: true,
                            coverImage: true
                        }
                    },
                    likes: {
                        select: { id: true }
                    },
                    comments: {
                        select: { id: true }
                    }
                },
                orderBy: [
                    { isPinned: 'desc' },
                    { scheduledAt: 'desc' },
                    { createdAt: 'desc' }
                ],
                skip,
                take: limit
            }),
            prisma.channelPost.count({ where })
        ])

        // Calculate stats
        const stats = {
            totalPosts: total,
            scheduled: await prisma.channelPost.count({
                where: {
                    ...where,
                    scheduledAt: { gt: now },
                    publishedAt: null
                }
            }),
            published: await prisma.channelPost.count({
                where: {
                    ...where,
                    publishedAt: { not: null, lte: now }
                }
            }),
            draft: await prisma.channelPost.count({
                where: {
                    ...where,
                    publishedAt: null,
                    scheduledAt: null
                }
            })
        }

        return NextResponse.json({
            success: true,
            data: {
                posts: posts.map(post => ({
                    ...post,
                    likesCount: post.likes.length,
                    commentsCount: post.comments.length
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                },
                stats
            }
        })
    } catch (error) {
        console.error('Error fetching posts:', error)
        return NextResponse.json(
            { error: 'Failed to fetch posts' },
            { status: 500 }
        )
    }
}

// POST - Create new channel post
export async function POST(request: NextRequest) {
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

        const body = await request.json()
        const {
            channelId,
            title,
            titleAr,
            content,
            contentAr,
            type,
            mediaUrl,
            thumbnailUrl,
            duration,
            scheduledAt,
            tier,
            isPinned
        } = body

        // Validation
        if (!channelId || !content) {
            return NextResponse.json(
                { error: 'Channel ID and content are required' },
                { status: 400 }
            )
        }

        // Verify channel ownership
        const channel = await prisma.creatorChannel.findFirst({
            where: {
                id: channelId,
                creatorId: creator.id
            }
        })

        if (!channel) {
            return NextResponse.json(
                { error: 'Channel not found or access denied' },
                { status: 404 }
            )
        }

        // Validate tier
        const validTiers = ['BRONZE', 'SILVER', 'GOLD']
        if (tier && !validTiers.includes(tier)) {
            return NextResponse.json(
                { error: 'Invalid tier. Must be BRONZE, SILVER, or GOLD' },
                { status: 400 }
            )
        }

        // Validate post type
        const validTypes = ['TEXT', 'VIDEO', 'IMAGE', 'DOCUMENT', 'POLL', 'ANNOUNCEMENT']
        if (type && !validTypes.includes(type)) {
            return NextResponse.json(
                { error: 'Invalid post type' },
                { status: 400 }
            )
        }

        // Parse scheduled date if provided
        let scheduledDate = null
        let publishedDate = null

        if (scheduledAt) {
            scheduledDate = new Date(scheduledAt)
            if (scheduledDate <= new Date()) {
                // If scheduled time is in the past or now, publish immediately
                publishedDate = new Date()
                scheduledDate = null
            }
        } else {
            // No schedule = publish immediately
            publishedDate = new Date()
        }

        // Create post
        const post = await prisma.channelPost.create({
            data: {
                channelId,
                title: title || null,
                titleAr: titleAr || null,
                content,
                contentAr: contentAr || null,
                type: type || 'TEXT',
                mediaUrl: mediaUrl || null,
                thumbnailUrl: thumbnailUrl || null,
                duration: duration || null,
                scheduledAt: scheduledDate,
                publishedAt: publishedDate,
                tier: tier || 'BRONZE',
                isPinned: isPinned || false
            },
            include: {
                channel: {
                    select: {
                        id: true,
                        name: true,
                        coverImage: true,
                        totalSubscribers: true
                    }
                }
            }
        })

        return NextResponse.json({
            success: true,
            message: scheduledDate
                ? 'Post scheduled successfully'
                : 'Post published successfully',
            data: post
        })
    } catch (error) {
        console.error('Error creating post:', error)
        return NextResponse.json(
            { error: 'Failed to create post' },
            { status: 500 }
        )
    }
}

// PUT - Update existing post
export async function PUT(request: NextRequest) {
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

        const body = await request.json()
        const {
            postId,
            title,
            titleAr,
            content,
            contentAr,
            mediaUrl,
            thumbnailUrl,
            duration,
            scheduledAt,
            tier,
            isPinned
        } = body

        if (!postId) {
            return NextResponse.json(
                { error: 'Post ID is required' },
                { status: 400 }
            )
        }

        // Verify post ownership
        const existingPost = await prisma.channelPost.findFirst({
            where: {
                id: postId,
                channel: {
                    creatorId: creator.id
                }
            }
        })

        if (!existingPost) {
            return NextResponse.json(
                { error: 'Post not found or access denied' },
                { status: 404 }
            )
        }

        // Build update data
        const updateData: any = {}
        if (title !== undefined) updateData.title = title
        if (titleAr !== undefined) updateData.titleAr = titleAr
        if (content !== undefined) updateData.content = content
        if (contentAr !== undefined) updateData.contentAr = contentAr
        if (mediaUrl !== undefined) updateData.mediaUrl = mediaUrl
        if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl
        if (duration !== undefined) updateData.duration = duration
        if (tier !== undefined) updateData.tier = tier
        if (isPinned !== undefined) updateData.isPinned = isPinned

        // Handle schedule changes
        if (scheduledAt !== undefined) {
            if (scheduledAt === null) {
                // Remove schedule and publish now
                updateData.scheduledAt = null
                updateData.publishedAt = new Date()
            } else {
                const newSchedule = new Date(scheduledAt)
                if (newSchedule <= new Date()) {
                    // Scheduled time is now or past, publish immediately
                    updateData.scheduledAt = null
                    updateData.publishedAt = new Date()
                } else {
                    updateData.scheduledAt = newSchedule
                    updateData.publishedAt = null
                }
            }
        }

        // Update post
        const updatedPost = await prisma.channelPost.update({
            where: { id: postId },
            data: updateData,
            include: {
                channel: {
                    select: {
                        id: true,
                        name: true,
                        coverImage: true
                    }
                }
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Post updated successfully',
            data: updatedPost
        })
    } catch (error) {
        console.error('Error updating post:', error)
        return NextResponse.json(
            { error: 'Failed to update post' },
            { status: 500 }
        )
    }
}

// DELETE - Remove post
export async function DELETE(request: NextRequest) {
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

        const { searchParams } = new URL(request.url)
        const postId = searchParams.get('postId')

        if (!postId) {
            return NextResponse.json(
                { error: 'Post ID is required' },
                { status: 400 }
            )
        }

        // Verify post ownership
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
                { error: 'Post not found or access denied' },
                { status: 404 }
            )
        }

        // Delete post (cascade will handle likes and comments)
        await prisma.channelPost.delete({
            where: { id: postId }
        })

        return NextResponse.json({
            success: true,
            message: 'Post deleted successfully'
        })
    } catch (error) {
        console.error('Error deleting post:', error)
        return NextResponse.json(
            { error: 'Failed to delete post' },
            { status: 500 }
        )
    }
}
