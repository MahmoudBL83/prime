import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { subDays, format, startOfDay, endOfDay } from 'date-fns';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const days = parseInt(searchParams.get('days') || '30', 10);
        const startDate = startOfDay(subDays(new Date(), days));
        const endDate = endOfDay(new Date());

        // Platform Overview Metrics
        const [
            totalUsers,
            totalCreators,
            totalCourses,
            totalEnrollments,
            publishedCourses,
            pendingCourses,
            rejectedCourses,
            verifiedCreators,
            pendingCreators,
        ] = await Promise.all([
            // Total Users
            prisma.user.count(),

            // Total Creators
            prisma.creator.count(),

            // Total Courses
            prisma.course.count(),

            // Total Enrollments
            prisma.enrollment.count(),

            // Published Courses
            prisma.course.count({
                where: { status: 'PUBLISHED' }
            }),

            // Pending Courses
            prisma.course.count({
                where: { status: 'UNDER_REVIEW' }
            }),

            // Rejected Courses
            prisma.course.count({
                where: { status: 'REJECTED' }
            }),

            // Verified Creators
            prisma.creator.count({
                where: { kycStatus: 'VERIFIED' }
            }),

            // Pending Creators
            prisma.creator.count({
                where: { kycStatus: 'PENDING' }
            }),
        ]);

        // Growth Metrics (last 30 days)
        const growthMetrics = await Promise.all([
            // New Users
            prisma.user.count({
                where: {
                    createdAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
            }),

            // New Creators
            prisma.creator.count({
                where: {
                    createdAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
            }),

            // New Courses
            prisma.course.count({
                where: {
                    createdAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
            }),

            // New Enrollments
            prisma.enrollment.count({
                where: {
                    createdAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
            }),
        ]);

        // Revenue Metrics
        const revenueData = await prisma.course.aggregate({
            _sum: {
                price: true,
            },
            where: {
                status: 'PUBLISHED',
                price: {
                    gt: 0,
                },
            },
        });

        const enrollmentRevenue = await prisma.enrollment.findMany({
            include: {
                course: {
                    select: {
                        price: true,
                    },
                },
            },
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });

        const totalRevenue = enrollmentRevenue.reduce((sum, enrollment) => {
            return sum + (enrollment.course.price || 0);
        }, 0);

        // Daily Metrics for Charts (last 30 days)
        const dailyMetrics = [];
        for (let i = days - 1; i >= 0; i--) {
            const day = subDays(new Date(), i);
            const dayStart = startOfDay(day);
            const dayEnd = endOfDay(day);

            const [newUsers, newEnrollments, newCourses] = await Promise.all([
                prisma.user.count({
                    where: {
                        createdAt: {
                            gte: dayStart,
                            lte: dayEnd,
                        },
                    },
                }),
                prisma.enrollment.count({
                    where: {
                        createdAt: {
                            gte: dayStart,
                            lte: dayEnd,
                        },
                    },
                }),
                prisma.course.count({
                    where: {
                        createdAt: {
                            gte: dayStart,
                            lte: dayEnd,
                        },
                    },
                }),
            ]);

            const dayRevenue = enrollmentRevenue
                .filter(enrollment => {
                    const enrollmentDate = new Date(enrollment.createdAt);
                    return enrollmentDate >= dayStart && enrollmentDate <= dayEnd;
                })
                .reduce((sum, enrollment) => sum + (enrollment.course.price || 0), 0);

            dailyMetrics.push({
                date: format(day, 'yyyy-MM-dd'),
                users: newUsers,
                enrollments: newEnrollments,
                courses: newCourses,
                revenue: dayRevenue,
            });
        }

        // Course Status Distribution
        const courseStatusDistribution = [
            { status: 'Published', count: publishedCourses },
            { status: 'Under Review', count: pendingCourses },
            { status: 'Rejected', count: rejectedCourses },
            { status: 'Draft', count: totalCourses - publishedCourses - pendingCourses - rejectedCourses },
        ];

        // Creator Verification Status
        const creatorVerificationStatus = [
            { status: 'Verified', count: verifiedCreators },
            { status: 'Pending', count: pendingCreators },
            { status: 'Not Started', count: totalCreators - verifiedCreators - pendingCreators },
        ];

        // Top Performing Courses
        const topCourses = await prisma.course.findMany({
            take: 10,
            orderBy: {
                totalEnrollments: 'desc',
            },
            include: {
                creator: {
                    include: {
                        user: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
            where: {
                status: 'PUBLISHED',
            },
        });

        // Recent Activity
        const recentActivity = await prisma.course.findMany({
            take: 10,
            orderBy: {
                updatedAt: 'desc',
            },
            include: {
                creator: {
                    include: {
                        user: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        return NextResponse.json({
            overview: {
                totalUsers,
                totalCreators,
                totalCourses,
                totalEnrollments,
                totalRevenue,
                publishedCourses,
                pendingCourses,
            },
            growth: {
                newUsers: growthMetrics[0],
                newCreators: growthMetrics[1],
                newCourses: growthMetrics[2],
                newEnrollments: growthMetrics[3],
                periodDays: days,
            },
            charts: {
                dailyMetrics,
                courseStatusDistribution,
                creatorVerificationStatus,
            },
            insights: {
                topCourses: topCourses.map(course => ({
                    id: course.id,
                    title: course.title,
                    enrollments: course.totalEnrollments,
                    rating: course.rating,
                    creator: course.creator.user.name,
                    status: course.status,
                })),
                recentActivity: recentActivity.map(course => ({
                    id: course.id,
                    title: course.title,
                    status: course.status,
                    creator: course.creator.user.name,
                    updatedAt: course.updatedAt,
                })),
            },
        });
    } catch (error) {
        console.error('Error fetching platform analytics:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
