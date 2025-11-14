import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/lessons/[id]/bookmarks - Get all bookmarks for a lesson
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const lessonId = id;

        const bookmarks = await prisma.videoBookmark.findMany({
            where: {
                userId: session.user.id,
                lessonId,
            },
            orderBy: {
                timestamp: 'asc',
            },
        });

        return NextResponse.json({ bookmarks });
    } catch (error) {
        console.error('Error fetching bookmarks:', error);
        return NextResponse.json(
            { error: 'Failed to fetch bookmarks' },
            { status: 500 }
        );
    }
}

// POST /api/lessons/[id]/bookmarks - Create a new bookmark
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const lessonId = id;
        const body = await req.json();
        const { timestamp, title } = body;

        if (typeof timestamp !== 'number' || !title || typeof title !== 'string') {
            return NextResponse.json(
                { error: 'Invalid timestamp or title' },
                { status: 400 }
            );
        }

        const bookmark = await prisma.videoBookmark.create({
            data: {
                userId: session.user.id,
                lessonId,
                timestamp,
                title,
            },
        });

        return NextResponse.json({ bookmark });
    } catch (error) {
        console.error('Error creating bookmark:', error);
        return NextResponse.json(
            { error: 'Failed to create bookmark' },
            { status: 500 }
        );
    }
}

// DELETE /api/lessons/[id]/bookmarks - Delete a bookmark
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
        const { searchParams } = new URL(req.url);
        const bookmarkId = searchParams.get('bookmarkId');

        if (!bookmarkId) {
            return NextResponse.json(
                { error: 'Missing bookmarkId' },
                { status: 400 }
            );
        }

        // Verify ownership
        const existingBookmark = await prisma.videoBookmark.findUnique({
            where: { id: bookmarkId },
        });

        if (!existingBookmark || existingBookmark.userId !== session.user.id) {
            return NextResponse.json(
                { error: 'Bookmark not found or unauthorized' },
                { status: 404 }
            );
        }

        await prisma.videoBookmark.delete({
            where: { id: bookmarkId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting bookmark:', error);
        return NextResponse.json(
            { error: 'Failed to delete bookmark' },
            { status: 500 }
        );
    }
}
