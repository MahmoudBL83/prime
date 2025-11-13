import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/mentors/[id]/reviews - Get reviews for a mentor
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: mentorId } = await context.params

        // Get all courses by this mentor
        const mentor = await prisma.creator.findUnique({
            where: { id: mentorId },
            include: {
                courses: {
                    select: { id: true }
                }
            }
        })

        if (!mentor) {
            return NextResponse.json(
                { error: 'Mentor not found' },
                { status: 404 }
            )
        }

        const courseIds = mentor.courses.map(c => c.id)

        // Get all reviews for this mentor's courses
        const reviews = await prisma.review.findMany({
            where: {
                courseId: { in: courseIds }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        arabicName: true,
                        profileImage: true
                    }
                },
                course: {
                    select: {
                        id: true,
                        title: true,
                        titleAr: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        // Calculate average rating
        const averageRating = reviews.length > 0
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
            : 0

        return NextResponse.json({
            reviews,
            stats: {
                totalReviews: reviews.length,
                averageRating: parseFloat(averageRating.toFixed(1)),
                ratingDistribution: {
                    5: reviews.filter(r => r.rating === 5).length,
                    4: reviews.filter(r => r.rating === 4).length,
                    3: reviews.filter(r => r.rating === 3).length,
                    2: reviews.filter(r => r.rating === 2).length,
                    1: reviews.filter(r => r.rating === 1).length,
                }
            }
        })

    } catch (error) {
        console.error('Error fetching mentor reviews:', error)
        return NextResponse.json(
            { error: 'Failed to fetch reviews' },
            { status: 500 }
        )
    }
}

// POST /api/mentors/[id]/reviews - Create a review for a mentor (via their course)
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id: mentorId } = await context.params
        const body = await request.json()
        const { courseId, rating, title, comment } = body

        // Validate input
        if (!courseId || !rating || !comment) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        if (rating < 1 || rating > 5) {
            return NextResponse.json(
                { error: 'Rating must be between 1 and 5' },
                { status: 400 }
            )
        }

        // Verify the course belongs to this mentor
        const course = await prisma.course.findFirst({
            where: {
                id: courseId,
                creatorId: mentorId
            }
        })

        if (!course) {
            return NextResponse.json(
                { error: 'Course not found for this mentor' },
                { status: 404 }
            )
        }

        // Check if user is enrolled in the course
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: session.user.id,
                    courseId: courseId
                }
            }
        })

        const verified = !!enrollment

        // Create or update the review
        const review = await prisma.review.upsert({
            where: {
                userId_courseId: {
                    userId: session.user.id,
                    courseId: courseId
                }
            },
            update: {
                rating,
                title,
                comment,
                verified
            },
            create: {
                userId: session.user.id,
                courseId: courseId,
                rating,
                title,
                comment,
                verified
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        arabicName: true,
                        profileImage: true
                    }
                },
                course: {
                    select: {
                        id: true,
                        title: true,
                        titleAr: true
                    }
                }
            }
        })

        // Update course rating
        const allReviews = await prisma.review.findMany({
            where: { courseId }
        })

        const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length

        await prisma.course.update({
            where: { id: courseId },
            data: { rating: avgRating }
        })

        return NextResponse.json({
            review,
            message: 'Review submitted successfully'
        }, { status: 201 })

    } catch (error) {
        console.error('Error creating mentor review:', error)
        return NextResponse.json(
            { error: 'Failed to create review' },
            { status: 500 }
        )
    }
}
