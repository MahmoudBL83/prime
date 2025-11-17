import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/creator/analytics/revenue?period=30d|90d|1y|all
 * Get revenue analytics with time-series data
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

        // Get period from query params
        const { searchParams } = new URL(request.url)
        const period = searchParams.get('period') || '30d'

        // Calculate date range based on period
        const now = new Date()
        let startDate = new Date()

        switch (period) {
            case '30d':
                startDate.setDate(now.getDate() - 30)
                break
            case '90d':
                startDate.setDate(now.getDate() - 90)
                break
            case '1y':
                startDate.setFullYear(now.getFullYear() - 1)
                break
            case 'all':
                startDate = new Date(2020, 0, 1) // Platform start date
                break
            default:
                startDate.setDate(now.getDate() - 30)
        }

        // Get all creator's courses
        const courses = await prisma.course.findMany({
            where: {
                creatorId: creator.id
            },
            select: {
                id: true,
                title: true
            }
        })

        const courseIds = courses.map(c => c.id)

        // Get enrollments within period
        const enrollments = await prisma.enrollment.findMany({
            where: {
                courseId: {
                    in: courseIds
                },
                createdAt: {
                    gte: startDate
                }
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        price: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        })

        // Group by time period for chart data
        const revenueByPeriod: { [key: string]: number } = {}
        const enrollmentsByPeriod: { [key: string]: number } = {}

        enrollments.forEach(enrollment => {
            // Format date based on period granularity
            let periodKey: string
            const enrollDate = new Date(enrollment.createdAt)

            if (period === '30d') {
                // Group by day
                periodKey = enrollDate.toISOString().split('T')[0]
            } else if (period === '90d') {
                // Group by week
                const weekNum = Math.floor((enrollDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
                periodKey = `Week ${weekNum + 1}`
            } else {
                // Group by month
                periodKey = `${enrollDate.getFullYear()}-${String(enrollDate.getMonth() + 1).padStart(2, '0')}`
            }

            revenueByPeriod[periodKey] = (revenueByPeriod[periodKey] || 0) + (enrollment.course.price || 0)
            enrollmentsByPeriod[periodKey] = (enrollmentsByPeriod[periodKey] || 0) + 1
        })

        // Convert to array format for charts
        const chartData = Object.keys(revenueByPeriod).map(key => ({
            period: key,
            revenue: revenueByPeriod[key],
            enrollments: enrollmentsByPeriod[key]
        }))

        // Calculate total revenue
        const totalRevenue = enrollments.reduce((sum, e) => sum + (e.course.price || 0), 0)

        // Revenue by course
        const revenueByCourse: { [courseId: string]: { title: string, revenue: number, enrollments: number } } = {}

        enrollments.forEach(enrollment => {
            const courseId = enrollment.course.id
            if (!revenueByCourse[courseId]) {
                revenueByCourse[courseId] = {
                    title: enrollment.course.title,
                    revenue: 0,
                    enrollments: 0
                }
            }
            revenueByCourse[courseId].revenue += enrollment.course.price || 0
            revenueByCourse[courseId].enrollments += 1
        })

        // Convert to array and sort by revenue
        const topCourses = Object.entries(revenueByCourse)
            .map(([id, data]) => ({
                courseId: id,
                ...data
            }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5) // Top 5 courses

        // Calculate previous period for comparison
        const periodLength = now.getTime() - startDate.getTime()
        const previousStartDate = new Date(startDate.getTime() - periodLength)

        const previousEnrollments = await prisma.enrollment.count({
            where: {
                courseId: {
                    in: courseIds
                },
                createdAt: {
                    gte: previousStartDate,
                    lt: startDate
                }
            }
        })

        const previousEnrollmentsWithCourse = await prisma.enrollment.findMany({
            where: {
                courseId: {
                    in: courseIds
                },
                createdAt: {
                    gte: previousStartDate,
                    lt: startDate
                }
            },
            include: {
                course: {
                    select: {
                        price: true
                    }
                }
            }
        })

        const previousRevenue = previousEnrollmentsWithCourse.reduce((sum, e) => sum + (e.course.price || 0), 0)

        const revenueTrend = previousRevenue > 0
            ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
            : totalRevenue > 0 ? 100 : 0

        const enrollmentTrend = previousEnrollments > 0
            ? ((enrollments.length - previousEnrollments) / previousEnrollments) * 100
            : enrollments.length > 0 ? 100 : 0

        return NextResponse.json({
            summary: {
                totalRevenue,
                totalEnrollments: enrollments.length,
                averageRevenuePerEnrollment: enrollments.length > 0
                    ? totalRevenue / enrollments.length
                    : 0,
                trends: {
                    revenue: Math.round(revenueTrend),
                    enrollments: Math.round(enrollmentTrend)
                }
            },
            chartData,
            topCourses,
            period: {
                start: startDate.toISOString(),
                end: now.toISOString(),
                label: period
            }
        })

    } catch (error) {
        console.error('Error fetching revenue analytics:', error)
        return NextResponse.json(
            { error: 'Failed to fetch revenue analytics' },
            { status: 500 }
        )
    }
}
