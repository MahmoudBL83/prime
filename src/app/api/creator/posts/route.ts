import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createPostSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200).optional(),
    content: z.string().min(1, 'Content is required'),
    type: z.enum(['TEXT', 'VIDEO', 'IMAGE', 'DOCUMENT', 'POLL', 'ANNOUNCEMENT']),
    tier: z.enum(['BRONZE', 'SILVER', 'GOLD', 'ALL']),
    channelId: z.string().optional(),
    scheduledFor: z.string().datetime().optional(),
    isDraft: z.boolean().default(false),
    mediaUrl: z.string().url().optional(),
    thumbnailUrl: z.string().url().optional(),
});

// GET - Fetch all posts for the creator
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'CREATOR') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status'); // 'draft', 'scheduled', 'published'
        const channelId = searchParams.get('channelId');

        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        });

        if (!creator) {
            return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 });
        }

        // Build query filters
        const where: any = {
            channel: {
                creatorId: creator.id
            }
        };

        if (channelId) {
            where.channelId = channelId;
        }

        if (status === 'draft') {
            where.publishedAt = null;
            where.scheduledAt = null;
        } else if (status === 'scheduled') {
            where.publishedAt = null;
            where.scheduledAt = { not: null };
        } else if (status === 'published') {
            where.publishedAt = { not: null };
        }

        const posts = await prisma.channelPost.findMany({
            where,
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
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            posts: posts.map(post => ({
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
            }))
        });

    } catch (error) {
        console.error('Error fetching posts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch posts' },
            { status: 500 }
        );
    }
}

// POST - Create a new post
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'CREATOR') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validation = createPostSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid request data', details: validation.error.issues },
                { status: 400 }
            );
        }

        const { title, content, type, tier, channelId, scheduledFor, isDraft, mediaUrl, thumbnailUrl } = validation.data;

        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id },
            include: {
                channels: true
            }
        });

        if (!creator) {
            return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 });
        }

        // If channelId not provided, use creator's first channel or create one
        let targetChannelId = channelId;
        if (!targetChannelId) {
            if (creator.channels.length > 0) {
                targetChannelId = creator.channels[0].id;
            } else {
                // Create a default channel for the creator
                const newChannel = await prisma.creatorChannel.create({
                    data: {
                        name: `${session.user.name}'s Channel`,
                        description: 'Your exclusive content channel',
                        creatorId: creator.id,
                        monthlyPrice: 0,
                        isActive: true
                    }
                });
                targetChannelId = newChannel.id;
            }
        }

        // Verify creator owns the channel
        const channelOwnership = await prisma.creatorChannel.findFirst({
            where: {
                id: targetChannelId,
                creatorId: creator.id
            }
        });

        if (!channelOwnership) {
            return NextResponse.json(
                { error: 'You do not own this channel' },
                { status: 403 }
            );
        }

        // Create the post
        const post = await prisma.channelPost.create({
            data: {
                title,
                content,
                type,
                tier,
                channelId: targetChannelId,
                mediaUrl,
                thumbnailUrl,
                scheduledAt: scheduledFor ? new Date(scheduledFor) : null,
                publishedAt: isDraft || scheduledFor ? null : new Date(),
                viewCount: 0
            },
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
                id: post.id,
                title: post.title || 'Untitled',
                type: post.type,
                tier: post.tier,
                channelName: post.channel.name,
                publishedAt: post.publishedAt,
                scheduledFor: post.scheduledAt,
                isDraft: !post.publishedAt && !post.scheduledAt
            }
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating post:', error);
        return NextResponse.json(
            { error: 'Failed to create post' },
            { status: 500 }
        );
    }
}
