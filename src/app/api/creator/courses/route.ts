import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/creator/courses
 * Fetch all courses for the authenticated creator
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Get creator profile
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            // Return empty array if creator profile doesn't exist yet
            return NextResponse.json({
                success: true,
                courses: [],
                message: 'Creator profile not found. Please complete your creator profile setup.'
            })
        }

        // Fetch all courses with related data
        const courses = await prisma.course.findMany({
            where: { creatorId: creator.id },
            include: {
                _count: {
                    select: {
                        enrollments: true,
                        reviews: true
                    }
                },
                reviews: {
                    select: {
                        rating: true
                    }
                },
                enrollments: {
                    select: {
                        id: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        // Transform courses data
        const transformedCourses = courses.map(course => {
            // Calculate average rating
            const avgRating = course.reviews.length > 0
                ? course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length
                : 0

            // Calculate total revenue (assuming price * enrollments)
            const totalRevenue = course.price * course._count.enrollments

            return {
                id: course.id,
                title: course.title,
                thumbnail: course.thumbnail,
                status: course.status,
                category: course.category,
                price: course.price,
                enrollments: course._count.enrollments,
                avgRating: avgRating,
                totalRevenue: totalRevenue,
                createdAt: course.createdAt.toISOString(),
                updatedAt: course.updatedAt.toISOString()
            }
        })

        return NextResponse.json({
            success: true,
            courses: transformedCourses
        })

    } catch (error) {
        console.error('Failed to fetch courses:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
