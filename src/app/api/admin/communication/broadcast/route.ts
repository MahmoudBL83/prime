import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // Adjust path if needed
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/services/NotificationService';
import { z } from 'zod';

const broadcastSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    message: z.string().min(1, 'Message is required'),
    type: z.enum(['SYSTEM', 'INFO', 'WARNING']).default('SYSTEM'),
    target: z.enum(['ALL', 'STUDENTS', 'INSTRUCTORS', 'CREATORS']).default('ALL'),
    actionUrl: z.string().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, message, type, target, actionUrl } = broadcastSchema.parse(body);

        let whereClause: any = {
            isActive: true, // Only active users
        };

        if (target === 'STUDENTS') {
            whereClause.role = 'USER';
        } else if (target === 'INSTRUCTORS' || target === 'CREATORS') {
            whereClause.role = 'CREATOR';
        }

        // Fetch target users
        // Optimization: limit fields to just ID
        const users = await prisma.user.findMany({
            where: whereClause,
            select: { id: true },
        });

        if (users.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'No users found for the selected target.'
            });
        }

        // Prepare notifications
        // Process in chunks of 500 to avoid memory issues/gigantic queries if userbase is large
        const CHUNK_SIZE = 500;
        let processed = 0;

        for (let i = 0; i < users.length; i += CHUNK_SIZE) {
            const chunk = users.slice(i, i + CHUNK_SIZE);
            const notifications = chunk.map(user => ({
                userId: user.id,
                type: 'SYSTEM' as const, // Force type to SYSTEM compliant with NotificationType
                title,
                message,
                data: {
                    priority: type === 'WARNING' ? 'high' : 'normal',
                    actionUrl,
                    broadcastType: type
                }
            }));

            await NotificationService.createMany(notifications);
            processed += chunk.length;
        }

        return NextResponse.json({
            success: true,
            message: `Successfully sent broadcast to ${processed} users.`,
            recipientCount: processed
        });

    } catch (error) {
        console.error('Broadcast API error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        return NextResponse.json(
            { error: 'Failed to send broadcast' },
            { status: 500 }
        );
    }
}
