import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updatePostSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    content: z.string().min(1).optional(),
    type: z.enum(['TEXT', 'VIDEO', 'IMAGE', 'DOCUMENT', 'POLL', 'ANNOUNCEMENT']).optional(),
    tier: z.enum(['BRONZE', 'SILVER', 'GOLD', 'ALL']).optional(),
    scheduledFor: z.string().datetime().optional().nullable(),
    publish: z.boolean().optional(),
    mediaUrl: z.string().url().optional().nullable(),
    thumbnailUrl: z.string().url().optional().nullable(),
});

// GET - Fetch a single post
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'CREATOR') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        });

        if (!creator) {
            return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 });
        }

        const post = await prisma.channelPost.findFirst({
            where: {
                id,
                channel: {
                    creatorId: creator.id
                }
            },
            include: {
                channel: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true
                    }
                }
            }
        });

        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        return NextResponse.json({
            post: {
                id: post.id,
                title: post.title || 'Untitled',
                content: post.content,
                type: post.type,
                tier: post.tier,
                channelId: post.channelId,
                channelName: post.channel?.name,
                mediaUrl: post.mediaUrl,
                thumbnailUrl: post.thumbnailUrl,
                viewCount: post.viewCount,
                likesCount: post._count.likes,
                commentsCount: post._count.comments,
                publishedAt: post.publishedAt,
                scheduledFor: post.scheduledAt,
                createdAt: post.createdAt,
                updatedAt: post.updatedAt,
                isDraft: !post.publishedAt && !post.scheduledAt
            }
        });

    } catch (error) {
        console.error('Error fetching post:', error);
        return NextResponse.json(
            { error: 'Failed to fetch post' },
            { status: 500 }
        );
    }
}

// PATCH - Update a post
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'CREATOR') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validation = updatePostSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid request data', details: validation.error.issues },
                { status: 400 }
            );
        }

        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        });

        if (!creator) {
            return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 });
        }

        // Verify post ownership
        const existingPost = await prisma.channelPost.findFirst({
            where: {
                id,
                channel: {
                    creatorId: creator.id
                }
            }
        });

        if (!existingPost) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        const { publish, scheduledFor, ...updateData } = validation.data;

        // Prepare update object
        const updateObject: any = { ...updateData };

        // Handle publishing
        if (publish === true && !existingPost.publishedAt) {
            updateObject.publishedAt = new Date();
            updateObject.scheduledAt = null;
        }

        // Handle scheduling
        if (scheduledFor !== undefined) {
            updateObject.scheduledAt = scheduledFor ? new Date(scheduledFor) : null;
            if (scheduledFor && !existingPost.publishedAt) {
                updateObject.publishedAt = null; // Ensure it's not published if scheduling
            }
        }

        const updatedPost = await prisma.channelPost.update({
            where: { id },
            data: updateObject,
            include: {
                channel: {
                    select: {
                        name: true
                    }
                }
            }
        });

        return NextResponse.json({
            success: true,
            post: {
                id: updatedPost.id,
                title: updatedPost.title || 'Untitled',
                type: updatedPost.type,
                tier: updatedPost.tier,
                channelName: updatedPost.channel.name,
                publishedAt: updatedPost.publishedAt,
                scheduledFor: updatedPost.scheduledAt,
                isDraft: !updatedPost.publishedAt && !updatedPost.scheduledAt
            }
        });

    } catch (error) {
        console.error('Error updating post:', error);
        return NextResponse.json(
            { error: 'Failed to update post' },
            { status: 500 }
        );
    }
}

// DELETE - Delete a post
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'CREATOR') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        });

        if (!creator) {
            return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 });
        }

        // Verify post ownership
        const existingPost = await prisma.channelPost.findFirst({
            where: {
                id,
                channel: {
                    creatorId: creator.id
                }
            }
        });

        if (!existingPost) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        // Delete related data first
        await prisma.postComment.deleteMany({
            where: { postId: id }
        });

        await prisma.postLike.deleteMany({
            where: { postId: id }
        });

        // Delete the post
        await prisma.channelPost.delete({
            where: { id }
        });

        return NextResponse.json({
            success: true,
            message: 'Post deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting post:', error);
        return NextResponse.json(
            { error: 'Failed to delete post' },
            { status: 500 }
        );
    }
}
