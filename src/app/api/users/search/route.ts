import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// GET /api/users/search - Search for users by name or email
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q');
        const limit = parseInt(searchParams.get('limit') || '20');

        // If no query provided, return random users for suggestions
        if (!query || query.trim().length === 0) {
            const users = await prisma.user.findMany({
                where: {
                    id: {
                        not: session.user.id,
                    },
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profileImage: true,
                    role: true,
                },
                take: limit,
                orderBy: {
                    createdAt: 'desc', // Get recent users for suggestions
                },
            });

            return NextResponse.json(users);
        }

        if (query.trim().length < 2) {
            return NextResponse.json([]);
        }

        const users = await prisma.user.findMany({
            where: {
                AND: [
                    {
                        id: {
                            not: session.user.id, // Exclude current user
                        },
                    },
                    {
                        OR: [
                            {
                                name: {
                                    contains: query,
                                },
                            },
                            {
                                email: {
                                    contains: query,
                                },
                            },
                        ],
                    },
                ],
            },
            select: {
                id: true,
                name: true,
                email: true,
                profileImage: true,
                role: true,
            },
            take: limit,
            orderBy: {
                name: 'asc',
            },
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error('Error searching users:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}