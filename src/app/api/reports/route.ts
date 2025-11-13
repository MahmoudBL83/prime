import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// POST /api/reports - Create a new report
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { type, targetId, reason } = await req.json();

        if (!type || !targetId || !reason) {
            return NextResponse.json(
                { error: 'Type, targetId, and reason are required' },
                { status: 400 }
            );
        }

        const validTypes = ['CONVERSATION', 'MESSAGE', 'USER', 'COURSE', 'COMMENT', 'POST'];
        if (!validTypes.includes(type)) {
            return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
        }

        // Create report
        const report = await prisma.report.create({
            data: {
                reporterId: session.user.id,
                type,
                targetId,
                reason: reason.trim(),
                status: 'PENDING',
            },
        });

        return NextResponse.json({ success: true, report }, { status: 201 });
    } catch (error) {
        console.error('Error creating report:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// GET /api/reports - Get reports (admin only)
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (user?.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');

        const reports = await prisma.report.findMany({
            where: status ? { status } : undefined,
            include: {
                reporter: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 50,
        });

        return NextResponse.json({ reports });
    } catch (error) {
        console.error('Error fetching reports:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
