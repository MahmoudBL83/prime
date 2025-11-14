import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/my-learning/recommendations - Get personalized course recommendations
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's enrolled courses to understand their interests
        const enrollments = await prisma.enrollment.findMany({
            where: { userId: session.user.id },
            select: {
                courseId: true,
                completedAt: true,
                course: {
                    select: {
                        category: true,
                        skillLevel: true,
                    },
                },
            },
        });

        // Get completed courses
        const completedCourses = enrollments
            .filter(e => e.completedAt)
            .map(e => e.courseId);

        // Extract user's categories and levels
        // @ts-ignore - TypeScript has issues with Prisma select inference
        const userCategories = [...new Set(enrollments.map(e => e.course.category).filter(Boolean) as string[])];
        // @ts-ignore - TypeScript has issues with Prisma select inference
        const userLevels = [...new Set(enrollments.map(e => e.course.skillLevel).filter(Boolean) as string[])];

        // Get recommendations based on:
        // 1. Same category but not enrolled
        // 2. Similar level
        // 3. Highly rated
        // 4. Popular (many enrollments)
        const recommendations = await prisma.course.findMany({
            where: {
                AND: [
                    // Not already enrolled
                    {
                        id: {
                            notIn: enrollments.map(e => e.courseId),
                        },
                    },
                    // Published only
                    { status: 'PUBLISHED' },
                    // Match user's interests (categories)
                    userCategories.length > 0 ? {
                        OR: [
                            { category: { in: userCategories } },
                            { skillLevel: { in: userLevels } },
                        ],
                    } : {},
                ],
            },
            include: {
                creator: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                arabicName: true,
                                profileImage: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        enrollments: true,
                        reviews: true,
                    },
                },
            },
            orderBy: [
                { rating: 'desc' },
            ],
            take: 12,
        });

        // Format recommendations
        const formattedRecommendations = recommendations.map(course => ({
            id: course.id,
            title: course.title,
            titleAr: course.titleAr,
            description: course.description,
            descriptionAr: course.descriptionAr,
            thumbnail: course.thumbnail,
            level: course.skillLevel,
            category: course.category,
            price: course.price,
            rating: course.rating,
            instructor: {
                name: course.creator.user.name || '',
                arabicName: course.creator.user.arabicName,
                image: course.creator.user.profileImage,
            },
            studentsCount: course._count.enrollments,
            reviewsCount: course._count.reviews,
            reason: getRecommendationReason(course, userCategories, userLevels),
        }));

        return NextResponse.json({
            recommendations: formattedRecommendations,
            basedOn: {
                enrolledCourses: enrollments.length,
                completedCourses: completedCourses.length,
                categories: userCategories,
                levels: userLevels,
            },
        });
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        return NextResponse.json(
            { error: 'Failed to fetch recommendations' },
            { status: 500 }
        );
    }
}

function getRecommendationReason(
    course: any,
    userCategories: string[],
    userLevels: string[]
): string {
    if (userCategories.includes(course.category)) {
        return 'Based on your interests';
    }
    if (userLevels.includes(course.skillLevel)) {
        return 'Matches your skill level';
    }
    if (course.rating && course.rating >= 4.5) {
        return 'Highly rated';
    }
    if (course._count.enrollments > 1000) {
        return 'Popular choice';
    }
    return 'Recommended for you';
}
