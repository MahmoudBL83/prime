import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch posts from a group
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const groupId = searchParams.get('groupId')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')

        if (!groupId) {
            return NextResponse.json(
                { error: 'Group ID is required' },
                { status: 400 }
            )
        }

        const skip = (page - 1) * limit

        // Verify access to group (creator or member)
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (creator) {
            // Verify creator owns the group's channel
            const group = await prisma.memberGroup.findFirst({
                where: {
                    id: groupId,
                    channel: {
                        creatorId: creator.id
                    }
                }
            })

            if (!group) {
                return NextResponse.json(
                    { error: 'Group not found or access denied' },
                    { status: 404 }
                )
            }
        } else {
            // Verify user is a member
            const membership = await prisma.channelGroupMember.findFirst({
                where: {
                    groupId,
                    userId: session.user.id
                }
            })

            if (!membership) {
                return NextResponse.json(
                    { error: 'You are not a member of this group' },
                    { status: 403 }
                )
            }
        }

        // Fetch posts
        const [posts, total] = await Promise.all([
            prisma.groupPost.findMany({
                where: { groupId },
                include: {
                    group: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                },
                orderBy: [
                    { isPinned: 'desc' },
                    { createdAt: 'desc' }
                ],
                skip,
                take: limit
            }),
            prisma.groupPost.count({ where: { groupId } })
        ])

        // Get user info for each post
        const postsWithUsers = await Promise.all(
            posts.map(async (post) => {
                const user = await prisma.user.findUnique({
                    where: { id: post.userId },
                    select: {
                        id: true,
                        name: true,
                        profileImage: true
                    }
                })

                return {
                    ...post,
                    author: user
                }
            })
        )

        return NextResponse.json({
            success: true,
            data: {
                posts: postsWithUsers,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
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

// POST - Create new post in group (creator or member)
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { groupId, content, mediaUrl } = body

        if (!groupId || !content) {
            return NextResponse.json(
                { error: 'Group ID and content are required' },
                { status: 400 }
            )
        }

        // Verify user is creator or member
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        let canPost = false

        if (creator) {
            // Check if creator owns the group
            const group = await prisma.memberGroup.findFirst({
                where: {
                    id: groupId,
                    channel: {
                        creatorId: creator.id
                    }
                }
            })
            canPost = !!group
        }

        if (!canPost) {
            // Check if user is a member
            const membership = await prisma.channelGroupMember.findFirst({
                where: {
                    groupId,
                    userId: session.user.id
                }
            })
            canPost = !!membership
        }

        if (!canPost) {
            return NextResponse.json(
                { error: 'You do not have permission to post in this group' },
                { status: 403 }
            )
        }

        // Create post
        const post = await prisma.groupPost.create({
            data: {
                groupId,
                userId: session.user.id,
                content,
                mediaUrl: mediaUrl || null
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Post created successfully',
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

// PUT - Update post or pin/unpin (creator/moderator only)
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { postId, content, mediaUrl, isPinned } = body

        if (!postId) {
            return NextResponse.json(
                { error: 'Post ID is required' },
                { status: 400 }
            )
        }

        // Get post
        const post = await prisma.groupPost.findUnique({
            where: { id: postId },
            include: {
                group: {
                    include: {
                        channel: true
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

        // Check permissions
        const isAuthor = post.userId === session.user.id
        
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })
        const isCreator = creator && post.group.channel.creatorId === creator.id

        const isModerator = await prisma.groupModerator.findFirst({
            where: {
                groupId: post.groupId,
                userId: session.user.id
            }
        })

        const canEdit = isAuthor || isCreator || !!isModerator
        const canPin = isCreator || !!isModerator

        if (!canEdit) {
            return NextResponse.json(
                { error: 'You do not have permission to edit this post' },
                { status: 403 }
            )
        }

        // Build update data
        const updateData: any = {}
        if (content !== undefined && isAuthor) updateData.content = content
        if (mediaUrl !== undefined && isAuthor) updateData.mediaUrl = mediaUrl
        if (isPinned !== undefined && canPin) updateData.isPinned = isPinned

        // Update post
        const updatedPost = await prisma.groupPost.update({
            where: { id: postId },
            data: updateData
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

// DELETE - Remove post (author, creator, or moderator)
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const postId = searchParams.get('postId')

        if (!postId) {
            return NextResponse.json(
                { error: 'Post ID is required' },
                { status: 400 }
            )
        }

        // Get post
        const post = await prisma.groupPost.findUnique({
            where: { id: postId },
            include: {
                group: {
                    include: {
                        channel: true
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

        // Check permissions
        const isAuthor = post.userId === session.user.id
        
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })
        const isCreator = creator && post.group.channel.creatorId === creator.id

        const isModerator = await prisma.groupModerator.findFirst({
            where: {
                groupId: post.groupId,
                userId: session.user.id
            }
        })

        const canDelete = isAuthor || isCreator || !!isModerator

        if (!canDelete) {
            return NextResponse.json(
                { error: 'You do not have permission to delete this post' },
                { status: 403 }
            )
        }

        // Delete post
        await prisma.groupPost.delete({
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
