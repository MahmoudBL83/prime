import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { subDays, startOfDay, endOfDay } from 'date-fns';

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

        // Creator Performance Metrics
        const creators = await prisma.creator.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        createdAt: true,
                    },
                },
                courses: {
                    include: {
                        _count: {
                            select: {
                                enrollments: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        courses: true,
                    },
                },
            },
        });

        // Calculate creator statistics
        const creatorStats = creators.map(creator => {
            const publishedCourses = creator.courses.filter(course => course.status === 'PUBLISHED');
            const totalEnrollments = creator.courses.reduce((sum, course) => sum + course.totalEnrollments, 0);
            const totalRevenue = creator.courses.reduce((sum, course) => {
                return sum + (course.price || 0) * course.totalEnrollments;
            }, 0);
            const averageRating = publishedCourses.length > 0
                ? publishedCourses.reduce((sum, course) => sum + course.rating, 0) / publishedCourses.length
                : 0;

            return {
                id: creator.id,
                name: creator.user.name,
                email: creator.user.email,
                kycStatus: creator.kycStatus,
                joinedAt: creator.user.createdAt,
                totalCourses: creator._count.courses,
                publishedCourses: publishedCourses.length,
                totalEnrollments,
                totalRevenue,
                averageRating,
                totalEarnings: creator.totalEarnings,
                totalSubscribers: creator.totalSubscribers,
            };
        });

        // Top Performers
        const topCreatorsByRevenue = [...creatorStats]
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, 10);

        const topCreatorsByEnrollments = [...creatorStats]
            .sort((a, b) => b.totalEnrollments - a.totalEnrollments)
            .slice(0, 10);

        const topCreatorsByRating = [...creatorStats]
            .filter(creator => creator.averageRating > 0)
            .sort((a, b) => b.averageRating - a.averageRating)
            .slice(0, 10);

        // KYC Status Distribution
        const kycStats = await prisma.creator.groupBy({
            by: ['kycStatus'],
            _count: {
                id: true,
            },
        });

        // Creator Growth Metrics
        const newCreators = await prisma.creator.count({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });

        const recentlyVerified = await prisma.creator.count({
            where: {
                kycStatus: 'VERIFIED',
                updatedAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });

        // Creator Activity Metrics
        const activeCreators = await prisma.creator.count({
            where: {
                courses: {
                    some: {
                        updatedAt: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                },
            },
        });

        // Course Creation Trends
        const courseCreationByCreator = await prisma.course.groupBy({
            by: ['creatorId'],
            _count: {
                id: true,
            },
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            orderBy: {
                _count: {
                    id: 'desc',
                },
            },
            take: 10,
        });

        // Get creator names for course creation trends
        const creatorIds = courseCreationByCreator.map(c => c.creatorId);
        const creatorNames = await prisma.creator.findMany({
            where: {
                id: {
                    in: creatorIds,
                },
            },
            include: {
                user: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        const courseCreationTrends = courseCreationByCreator.map(trend => {
            const creator = creatorNames.find(c => c.id === trend.creatorId);
            return {
                creatorId: trend.creatorId,
                creatorName: creator?.user.name || 'Unknown',
                coursesCreated: trend._count.id,
            };
        });

        // Revenue Distribution
        const revenueDistribution = {
            noRevenue: creatorStats.filter(c => c.totalRevenue === 0).length,
            lowRevenue: creatorStats.filter(c => c.totalRevenue > 0 && c.totalRevenue < 1000).length,
            mediumRevenue: creatorStats.filter(c => c.totalRevenue >= 1000 && c.totalRevenue < 5000).length,
            highRevenue: creatorStats.filter(c => c.totalRevenue >= 5000).length,
        };

        // Course Publication Success Rates
        const creatorSuccessRates = creatorStats
            .filter(creator => creator.totalCourses > 0)
            .map(creator => ({
                id: creator.id,
                name: creator.name,
                totalCourses: creator.totalCourses,
                publishedCourses: creator.publishedCourses,
                successRate: (creator.publishedCourses / creator.totalCourses) * 100,
            }))
            .sort((a, b) => b.successRate - a.successRate);

        // Most Recent Creator Activity
        const recentCreatorActivity = await prisma.creator.findMany({
            include: {
                user: {
                    select: {
                        name: true,
                    },
                },
                courses: {
                    orderBy: {
                        updatedAt: 'desc',
                    },
                    take: 1,
                    select: {
                        title: true,
                        status: true,
                        updatedAt: true,
                    },
                },
            },
            orderBy: {
                updatedAt: 'desc',
            },
            take: 10,
        });

        // Expertise Analysis
        const expertiseStats = await prisma.creator.groupBy({
            by: ['expertise'],
            _count: {
                id: true,
            },
            where: {
                expertise: {
                    not: null,
                },
            },
        });

        return NextResponse.json({
            overview: {
                totalCreators: creators.length,
                verifiedCreators: creatorStats.filter(c => c.kycStatus === 'VERIFIED').length,
                activeCreators,
                newCreators,
                recentlyVerified,
                averageCoursesPerCreator: creatorStats.length > 0
                    ? creatorStats.reduce((sum, c) => sum + c.totalCourses, 0) / creatorStats.length
                    : 0,
                totalRevenue: creatorStats.reduce((sum, c) => sum + c.totalRevenue, 0),
            },

            topPerformers: {
                byRevenue: topCreatorsByRevenue,
                byEnrollments: topCreatorsByEnrollments,
                byRating: topCreatorsByRating,
            },

            kycDistribution: kycStats.map(stat => ({
                status: stat.kycStatus,
                count: stat._count.id,
            })),

            revenueDistribution: [
                { range: 'No Revenue', count: revenueDistribution.noRevenue },
                { range: '$1-999', count: revenueDistribution.lowRevenue },
                { range: '$1,000-4,999', count: revenueDistribution.mediumRevenue },
                { range: '$5,000+', count: revenueDistribution.highRevenue },
            ],

            courseCreationTrends,

            successRates: creatorSuccessRates.slice(0, 10),

            expertiseDistribution: expertiseStats.map(stat => ({
                expertise: stat.expertise,
                count: stat._count.id,
            })),

            recentActivity: recentCreatorActivity.map(creator => ({
                id: creator.id,
                name: creator.user.name,
                kycStatus: creator.kycStatus,
                lastCourse: creator.courses[0] || null,
                updatedAt: creator.updatedAt,
            })),

            growth: {
                newCreators,
                recentlyVerified,
                activeCreators,
                periodDays: days,
            },
        });
    } catch (error) {
        console.error('Error fetching creator analytics:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
