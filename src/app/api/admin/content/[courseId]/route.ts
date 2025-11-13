import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ courseId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { courseId } = await params;

        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                creator: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                emailVerified: true,
                            },
                        },
                        _count: {
                            select: {
                                courses: true,
                            },
                        },
                    },
                },
                lessons: {
                    orderBy: { order: 'asc' },
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        order: true,
                        duration: true,
                        videoUrl: true,
                        createdAt: true,
                    },
                },
                _count: {
                    select: {
                        enrollments: true,
                        lessons: true,
                    },
                },
            },
        });

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        // Calculate creator statistics
        const creatorStats = await prisma.enrollment.count({
            where: {
                course: {
                    creatorId: course.creatorId,
                },
            },
        });

        // Calculate total earnings for creator from course prices
        const creatorCoursesWithEnrollments = await prisma.course.findMany({
            where: {
                creatorId: course.creatorId,
            },
            select: {
                price: true,
                _count: {
                    select: {
                        enrollments: true,
                    },
                },
            },
        });

        const totalEarnings = creatorCoursesWithEnrollments.reduce((sum, course) => {
            return sum + (course.price || 0) * course._count.enrollments;
        }, 0);

        // Format the response
        const formattedCourse = {
            ...course,
            creator: {
                id: course.creator.id,
                name: course.creator.user.name,
                email: course.creator.user.email,
                isVerified: !!course.creator.user.emailVerified,
                totalStudents: creatorStats,
                totalEarnings: totalEarnings,
            },
        };

        return NextResponse.json(formattedCourse);
    } catch (error) {
        console.error('Error fetching course details:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
