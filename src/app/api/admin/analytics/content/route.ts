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
        const category = searchParams.get('category');
        const startDate = startOfDay(subDays(new Date(), days));
        const endDate = endOfDay(new Date());

        // Content Performance Metrics
        const contentMetrics = await prisma.course.findMany({
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
                _count: {
                    select: {
                        enrollments: true,
                        lessons: true,
                    },
                },
            },
            where: {
                status: 'PUBLISHED',
                ...(category && category !== 'all' ? { category } : {}),
            },
            orderBy: {
                totalEnrollments: 'desc',
            },
        });

        // Category Performance
        const categoryStats = await prisma.course.groupBy({
            by: ['category'],
            _count: {
                id: true,
            },
            _sum: {
                totalEnrollments: true,
                totalViews: true,
            },
            _avg: {
                rating: true,
            },
            where: {
                status: 'PUBLISHED',
            },
        });

        // Skill Level Distribution
        const skillLevelStats = await prisma.course.groupBy({
            by: ['skillLevel'],
            _count: {
                id: true,
            },
            _sum: {
                totalEnrollments: true,
            },
            where: {
                status: 'PUBLISHED',
            },
        });

        // Content Quality Metrics
        const qualityMetrics = {
            averageRating: await prisma.course.aggregate({
                _avg: {
                    rating: true,
                },
                where: {
                    status: 'PUBLISHED',
                    rating: {
                        gt: 0,
                    },
                },
            }),

            highRatedCourses: await prisma.course.count({
                where: {
                    status: 'PUBLISHED',
                    rating: {
                        gte: 4.0,
                    },
                },
            }),

            lowRatedCourses: await prisma.course.count({
                where: {
                    status: 'PUBLISHED',
                    rating: {
                        lt: 3.0,
                        gt: 0,
                    },
                },
            }),
        };

        // Engagement Metrics
        const engagementData = await prisma.course.findMany({
            select: {
                id: true,
                title: true,
                totalViews: true,
                totalEnrollments: true,
                rating: true,
                createdAt: true,
            },
            where: {
                status: 'PUBLISHED',
                totalViews: {
                    gt: 0,
                },
            },
            orderBy: {
                totalViews: 'desc',
            },
            take: 20,
        });

        // Calculate conversion rates (views to enrollments)
        const engagementWithConversion = engagementData.map(course => ({
            ...course,
            conversionRate: course.totalViews > 0
                ? (course.totalEnrollments / course.totalViews) * 100
                : 0,
        }));

        // Recent Content Performance
        const recentContent = await prisma.course.findMany({
            where: {
                status: 'PUBLISHED',
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
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
            orderBy: {
                totalEnrollments: 'desc',
            },
            take: 10,
        });

        // Content Moderation Stats
        const moderationStats = await Promise.all([
            prisma.course.count({
                where: {
                    status: 'UNDER_REVIEW',
                    createdAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
            }),

            prisma.course.count({
                where: {
                    status: 'PUBLISHED',
                    publishedAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
            }),

            prisma.course.count({
                where: {
                    status: 'REJECTED',
                    updatedAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
            }),
        ]);

        // Popular Topics/Tags Analysis
        const coursesByLanguage = await prisma.course.groupBy({
            by: ['language'],
            _count: {
                id: true,
            },
            _sum: {
                totalEnrollments: true,
            },
            where: {
                status: 'PUBLISHED',
            },
        });

        // Revenue by Content
        const revenueByContent = contentMetrics
            .filter(course => course.price && course.price > 0)
            .map(course => ({
                id: course.id,
                title: course.title,
                category: course.category,
                price: course.price,
                enrollments: course._count.enrollments,
                revenue: (course.price || 0) * course._count.enrollments,
                creator: course.creator.user.name,
            }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        return NextResponse.json({
            overview: {
                totalPublishedCourses: contentMetrics.length,
                averageRating: qualityMetrics.averageRating._avg.rating || 0,
                highRatedCourses: qualityMetrics.highRatedCourses,
                lowRatedCourses: qualityMetrics.lowRatedCourses,
                totalViews: contentMetrics.reduce((sum, course) => sum + course.totalViews, 0),
                totalEnrollments: contentMetrics.reduce((sum, course) => sum + course.totalEnrollments, 0),
            },

            categoryPerformance: categoryStats.map(cat => ({
                category: cat.category,
                courseCount: cat._count.id,
                totalEnrollments: cat._sum.totalEnrollments || 0,
                totalViews: cat._sum.totalViews || 0,
                averageRating: cat._avg.rating || 0,
            })),

            skillLevelDistribution: skillLevelStats.map(level => ({
                skillLevel: level.skillLevel,
                courseCount: level._count.id,
                totalEnrollments: level._sum.totalEnrollments || 0,
            })),

            languageDistribution: coursesByLanguage.map(lang => ({
                language: lang.language,
                courseCount: lang._count.id,
                totalEnrollments: lang._sum.totalEnrollments || 0,
            })),

            engagement: {
                topViewedCourses: engagementWithConversion.slice(0, 10),
                conversionRates: engagementWithConversion.map(course => ({
                    title: course.title,
                    conversionRate: course.conversionRate,
                    views: course.totalViews,
                    enrollments: course.totalEnrollments,
                })),
            },

            recentPerformance: recentContent.map(course => ({
                id: course.id,
                title: course.title,
                category: course.category,
                enrollments: course.totalEnrollments,
                views: course.totalViews,
                rating: course.rating,
                creator: course.creator.user.name,
                createdAt: course.createdAt,
            })),

            moderation: {
                pendingReview: moderationStats[0],
                recentlyApproved: moderationStats[1],
                recentlyRejected: moderationStats[2],
                periodDays: days,
            },

            revenue: {
                topEarningCourses: revenueByContent,
                totalRevenue: revenueByContent.reduce((sum, course) => sum + course.revenue, 0),
            },
        });
    } catch (error) {
        console.error('Error fetching content analytics:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
