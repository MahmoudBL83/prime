import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// DELETE /api/messaging/messages/[id] - Delete a message
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Check if message exists and user is the sender
        const message = await prisma.message.findUnique({
            where: { id },
            include: {
                conversation: {
                    include: {
                        participants: true,
                    },
                },
            },
        });

        if (!message) {
            return NextResponse.json({ error: 'Message not found' }, { status: 404 });
        }

        // Only sender can delete their own message
        if (message.senderId !== session.user.id) {
            return NextResponse.json(
                { error: 'You can only delete your own messages' },
                { status: 403 }
            );
        }

        // Soft delete - update content and mark as deleted
        const updatedMessage = await prisma.message.update({
            where: { id },
            data: {
                content: 'This message was deleted',
                isDeleted: true,
            },
        });

        return NextResponse.json(updatedMessage);
    } catch (error) {
        console.error('Error deleting message:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH /api/messaging/messages/[id] - Edit a message
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { content } = await req.json();

        if (!content || content.trim().length === 0) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        // Check if message exists and user is the sender
        const message = await prisma.message.findUnique({
            where: { id },
        });

        if (!message) {
            return NextResponse.json({ error: 'Message not found' }, { status: 404 });
        }

        if (message.senderId !== session.user.id) {
            return NextResponse.json(
                { error: 'You can only edit your own messages' },
                { status: 403 }
            );
        }

        // Update message
        const updatedMessage = await prisma.message.update({
            where: { id },
            data: {
                content: content.trim(),
                isEdited: true,
            },
        });

        return NextResponse.json(updatedMessage);
    } catch (error) {
        console.error('Error editing message:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
