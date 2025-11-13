import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        // Get reviews for the course
        const reviews = await prisma.review.findMany({
            where: {
                courseId: id
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        arabicName: true,
                        profileImage: true
                    }
                }
            },
            orderBy: [
                { helpful: 'desc' },
                { createdAt: 'desc' }
            ],
            skip,
            take: limit
        });

        // Get total count for pagination
        const totalReviews = await prisma.review.count({
            where: {
                courseId: id
            }
        });

        // Get rating distribution
        const ratingDistribution = await prisma.review.groupBy({
            by: ['rating'],
            where: {
                courseId: id
            },
            _count: {
                rating: true
            }
        });

        // Calculate average rating and percentages
        const totalRatings = ratingDistribution.reduce((sum, item) => sum + item._count.rating, 0);
        const averageRating = totalRatings > 0 
            ? ratingDistribution.reduce((sum, item) => sum + (item.rating * item._count.rating), 0) / totalRatings
            : 0;

        // Format rating distribution for frontend
        const ratingBreakdown = [5, 4, 3, 2, 1].map(rating => {
            const found = ratingDistribution.find(item => item.rating === rating);
            const count = found ? found._count.rating : 0;
            const percentage = totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0;
            return { rating, count, percentage };
        });

        // Calculate recommendation percentage (4+ stars)
        const positiveReviews = ratingDistribution
            .filter(item => item.rating >= 4)
            .reduce((sum, item) => sum + item._count.rating, 0);
        const recommendationPercentage = totalRatings > 0 
            ? Math.round((positiveReviews / totalRatings) * 100) 
            : 0;

        return NextResponse.json({
            reviews,
            pagination: {
                page,
                limit,
                total: totalReviews,
                pages: Math.ceil(totalReviews / limit)
            },
            stats: {
                averageRating: Math.round(averageRating * 10) / 10,
                totalReviews,
                recommendationPercentage,
                ratingBreakdown
            }
        });
    } catch (error) {
        console.error('Reviews fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch reviews' },
            { status: 500 }
        );
    }
}