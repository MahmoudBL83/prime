import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ContentStatus } from '@prisma/client';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ courseId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { courseId } = await params;
        const body = await request.json();
        const { status, reviewNote } = body;

        // Validate status
        if (!Object.values(ContentStatus).includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        // Update course status
        const updatedCourse = await prisma.course.update({
            where: { id: courseId },
            data: {
                status: status,
                publishedAt: status === 'PUBLISHED' ? new Date() : null,
                updatedAt: new Date(),
            },
        });

        // If there's a review note, you could store it in a separate table
        // For now, we'll just log it (in a real app, you'd want to store this)
        if (reviewNote) {
            console.log(`Review note for course ${courseId}: ${reviewNote}`);
        }

        return NextResponse.json({
            success: true,
            course: updatedCourse
        });
    } catch (error) {
        console.error('Error updating course status:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
