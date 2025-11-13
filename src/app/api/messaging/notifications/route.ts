import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const prisma = new PrismaClient();

const markReadSchema = z.object({
    notificationIds: z.array(z.string()).optional(),
    markAll: z.boolean().default(false),
});

// GET /api/messaging/notifications - Get user's notifications
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');
        const isRead = searchParams.get('isRead');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');

        const notifications = await prisma.notification.findMany({
            where: {
                userId: session.user.id,
                ...(type && { type: type as any }),
                ...(isRead !== null && { isRead: isRead === 'true' }),
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
            skip: offset,
        });

        // Get unread count
        const unreadCount = await prisma.notification.count({
            where: {
                userId: session.user.id,
                isRead: false,
            },
        });

        return NextResponse.json({
            notifications,
            unreadCount,
            hasMore: notifications.length === limit,
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT /api/messaging/notifications - Mark notifications as read
export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { notificationIds, markAll } = markReadSchema.parse(body);

        let updateData;

        if (markAll) {
            // Mark all notifications as read
            updateData = await prisma.notification.updateMany({
                where: {
                    userId: session.user.id,
                    isRead: false,
                },
                data: {
                    isRead: true,
                    readAt: new Date(),
                },
            });
        } else if (notificationIds && notificationIds.length > 0) {
            // Mark specific notifications as read
            updateData = await prisma.notification.updateMany({
                where: {
                    id: {
                        in: notificationIds,
                    },
                    userId: session.user.id,
                },
                data: {
                    isRead: true,
                    readAt: new Date(),
                },
            });
        } else {
            return NextResponse.json(
                { error: 'Either notificationIds or markAll must be provided' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            updatedCount: updateData.count,
        });
    } catch (error) {
        console.error('Error updating notifications:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input', details: error.issues },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}