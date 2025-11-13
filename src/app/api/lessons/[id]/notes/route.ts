import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/lessons/[id]/notes - Get all notes for a lesson
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const lessonId = params.id;

        const notes = await prisma.videoNote.findMany({
            where: {
                userId: session.user.id,
                lessonId,
            },
            orderBy: {
                timestamp: 'asc',
            },
        });

        return NextResponse.json({ notes });
    } catch (error) {
        console.error('Error fetching notes:', error);
        return NextResponse.json(
            { error: 'Failed to fetch notes' },
            { status: 500 }
        );
    }
}

// POST /api/lessons/[id]/notes - Create a new note
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const lessonId = params.id;
        const body = await req.json();
        const { timestamp, content } = body;

        if (typeof timestamp !== 'number' || !content || typeof content !== 'string') {
            return NextResponse.json(
                { error: 'Invalid timestamp or content' },
                { status: 400 }
            );
        }

        const note = await prisma.videoNote.create({
            data: {
                userId: session.user.id,
                lessonId,
                timestamp,
                content,
            },
        });

        return NextResponse.json({ note });
    } catch (error) {
        console.error('Error creating note:', error);
        return NextResponse.json(
            { error: 'Failed to create note' },
            { status: 500 }
        );
    }
}

// PUT /api/lessons/[id]/notes - Update a note
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { noteId, content } = body;

        if (!noteId || !content) {
            return NextResponse.json(
                { error: 'Missing noteId or content' },
                { status: 400 }
            );
        }

        // Verify ownership
        const existingNote = await prisma.videoNote.findUnique({
            where: { id: noteId },
        });

        if (!existingNote || existingNote.userId !== session.user.id) {
            return NextResponse.json(
                { error: 'Note not found or unauthorized' },
                { status: 404 }
            );
        }

        const note = await prisma.videoNote.update({
            where: { id: noteId },
            data: { content },
        });

        return NextResponse.json({ note });
    } catch (error) {
        console.error('Error updating note:', error);
        return NextResponse.json(
            { error: 'Failed to update note' },
            { status: 500 }
        );
    }
}

// DELETE /api/lessons/[id]/notes - Delete a note
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const noteId = searchParams.get('noteId');

        if (!noteId) {
            return NextResponse.json(
                { error: 'Missing noteId' },
                { status: 400 }
            );
        }

        // Verify ownership
        const existingNote = await prisma.videoNote.findUnique({
            where: { id: noteId },
        });

        if (!existingNote || existingNote.userId !== session.user.id) {
            return NextResponse.json(
                { error: 'Note not found or unauthorized' },
                { status: 404 }
            );
        }

        await prisma.videoNote.delete({
            where: { id: noteId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting note:', error);
        return NextResponse.json(
            { error: 'Failed to delete note' },
            { status: 500 }
        );
    }
}
