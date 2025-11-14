import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/creator/analytics/overview
 * Get overview analytics for creator dashboard
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

        // Get all creator's courses
        const courses = await prisma.course.findMany({
            where: {
                creatorId: creator.id
            },
            include: {
                enrollments: true,
                lessons: {
                    include: {
                        progress: {
                            where: {
                                completed: true
                            }
                        }
                    }
                },
                reviews: true
            }
        })

        // Calculate total students (unique enrollments)
        const totalStudents = await prisma.enrollment.count({
            where: {
                courseId: {
                    in: courses.map(c => c.id)
                }
            }
        })

        // Calculate total revenue
        const totalRevenue = await prisma.enrollment.aggregate({
            where: {
                courseId: {
                    in: courses.map(c => c.id)
                },
                status: 'ACTIVE'
            },
            _sum: {
                price: true
            }
        })

        // Calculate total course completions
        const totalCompletions = await prisma.certificate.count({
            where: {
                courseId: {
                    in: courses.map(c => c.id)
                }
            }
        })

        // Calculate average rating
        const allReviews = courses.flatMap(c => c.reviews)
        const averageRating = allReviews.length > 0
            ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
            : 0

        // Calculate total video views
        const totalViews = courses.reduce((sum, c) => sum + (c.totalViews || 0), 0)

        // Get stats from last 30 days for trends
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const recentEnrollments = await prisma.enrollment.count({
            where: {
                courseId: {
                    in: courses.map(c => c.id)
                },
                createdAt: {
                    gte: thirtyDaysAgo
                }
            }
        })

        const recentCompletions = await prisma.certificate.count({
            where: {
                courseId: {
                    in: courses.map(c => c.id)
                },
                issueDate: {
                    gte: thirtyDaysAgo
                }
            }
        })

        // Calculate previous period for trend comparison
        const sixtyDaysAgo = new Date()
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

        const previousEnrollments = await prisma.enrollment.count({
            where: {
                courseId: {
                    in: courses.map(c => c.id)
                },
                createdAt: {
                    gte: sixtyDaysAgo,
                    lt: thirtyDaysAgo
                }
            }
        })

        const previousCompletions = await prisma.certificate.count({
            where: {
                courseId: {
                    in: courses.map(c => c.id)
                },
                issueDate: {
                    gte: sixtyDaysAgo,
                    lt: thirtyDaysAgo
                }
            }
        })

        // Calculate trends
        const enrollmentTrend = previousEnrollments > 0
            ? ((recentEnrollments - previousEnrollments) / previousEnrollments) * 100
            : recentEnrollments > 0 ? 100 : 0

        const completionTrend = previousCompletions > 0
            ? ((recentCompletions - previousCompletions) / previousCompletions) * 100
            : recentCompletions > 0 ? 100 : 0

        // Calculate average completion rate
        let totalCompletionRate = 0
        let coursesWithEnrollments = 0

        for (const course of courses) {
            const enrollmentCount = course.enrollments.length
            if (enrollmentCount > 0) {
                const completions = await prisma.certificate.count({
                    where: { courseId: course.id }
                })
                totalCompletionRate += (completions / enrollmentCount) * 100
                coursesWithEnrollments++
            }
        }

        const averageCompletionRate = coursesWithEnrollments > 0
            ? totalCompletionRate / coursesWithEnrollments
            : 0

        return NextResponse.json({
            overview: {
                totalCourses: courses.length,
                totalStudents,
                totalRevenue: totalRevenue._sum.price || 0,
                totalCompletions,
                averageRating: Math.round(averageRating * 10) / 10,
                totalViews,
                averageCompletionRate: Math.round(averageCompletionRate)
            },
            trends: {
                enrollments: {
                    current: recentEnrollments,
                    previous: previousEnrollments,
                    trend: Math.round(enrollmentTrend)
                },
                completions: {
                    current: recentCompletions,
                    previous: previousCompletions,
                    trend: Math.round(completionTrend)
                }
            },
            recentActivity: {
                last30Days: {
                    enrollments: recentEnrollments,
                    completions: recentCompletions
                }
            }
        })

    } catch (error) {
        console.error('Error fetching creator analytics:', error)
        return NextResponse.json(
            { error: 'Failed to fetch analytics' },
            { status: 500 }
        )
    }
}
