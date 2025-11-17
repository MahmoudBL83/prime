import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/creator/analytics/courses
 * Get detailed analytics for each course
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Check if user is a creator
        const creator = await prisma.creator.findUnique({
            where: {
                userId: session.user.id
            }
        })

        if (!creator) {
            return NextResponse.json(
                { error: 'Creator profile not found' },
                { status: 404 }
            )
        }

        // Get all courses with detailed data
        const courses = await prisma.course.findMany({
            where: {
                creatorId: creator.id
            },
            include: {
                enrollments: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                profileImage: true
                            }
                        }
                    }
                },
                lessons: {
                    include: {
                        progress: {
                            where: {
                                completed: true
                            }
                        }
                    }
                },
                reviews: true,
                certificates: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        // Calculate metrics for each course
        const courseAnalytics = await Promise.all(
            courses.map(async (course) => {
                const enrollmentCount = course.enrollments.length
                const completionCount = course.certificates.length
                const completionRate = enrollmentCount > 0
                    ? (completionCount / enrollmentCount) * 100
                    : 0

                // Calculate average rating
                const avgRating = course.reviews.length > 0
                    ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length
                    : 0

                // Calculate revenue for this course (mock value since enrollment doesn't have price)
                const revenue = course.enrollments.length * (course.price || 0)

                // Get recent enrollments (last 30 days)
                const thirtyDaysAgo = new Date()
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

                const recentEnrollments = course.enrollments.filter(
                    e => e.createdAt >= thirtyDaysAgo
                ).length

                // Calculate total lesson completions
                const totalLessonCompletions = course.lessons.reduce(
                    (sum, lesson) => sum + lesson.progress.length,
                    0
                )

                // Get active students (simplified count)
                const activeLearners = course.enrollments.length

                return {
                    id: course.id,
                    title: course.title,
                    titleAr: course.titleAr,
                    thumbnail: course.thumbnail,
                    status: course.status,
                    category: course.category,
                    publishedAt: course.publishedAt,
                    metrics: {
                        totalEnrollments: enrollmentCount,
                        activeStudents: activeLearners,
                        completions: completionCount,
                        completionRate: Math.round(completionRate),
                        averageRating: Math.round(avgRating * 10) / 10,
                        totalReviews: course.reviews.length,
                        totalViews: course.totalViews || 0,
                        revenue: revenue,
                        recentEnrollments,
                        totalLessons: course.lessons.length,
                        totalLessonCompletions
                    }
                }
            })
        )

        // Sort by enrollment count (most popular first)
        courseAnalytics.sort((a, b) => b.metrics.totalEnrollments - a.metrics.totalEnrollments)

        return NextResponse.json({
            courses: courseAnalytics,
            total: courseAnalytics.length
        })

    } catch (error) {
        console.error('Error fetching course analytics:', error)
        return NextResponse.json(
            { error: 'Failed to fetch course analytics' },
            { status: 500 }
        )
    }
}
