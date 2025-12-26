import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Advanced Analytics API
 * Comprehensive analytics for admins and creators
 * GET /api/analytics/advanced
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type') || 'overview' // overview, engagement, revenue, content, users
        const period = searchParams.get('period') || '30d' // 7d, 30d, 90d, 1y
        const creatorId = searchParams.get('creatorId')

        // Calculate date range
        const now = new Date()
        let startDate: Date
        switch (period) {
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                break
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
                break
            case '1y':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
                break
            default: // 30d
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        }

        // Check authorization
        const isAdmin = session.user.role === 'ADMIN'
        let creator = null

        if (!isAdmin) {
            creator = await prisma.creator.findUnique({
                where: { userId: session.user.id }
            })
            if (!creator) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
            }
        }

        let analytics: any = {}

        switch (type) {
            case 'overview': {
                // General platform overview
                const [
                    totalUsers,
                    newUsers,
                    totalCourses,
                    totalEnrollments,
                    totalRevenue,
                    activeSubscriptions
                ] = await Promise.all([
                    prisma.user.count(),
                    prisma.user.count({ where: { createdAt: { gte: startDate } } }),
                    creator ? prisma.course.count({ where: { creatorId: creator.id } }) : prisma.course.count(),
                    prisma.enrollment.count({
                        where: {
                            createdAt: { gte: startDate },
                            ...(creator ? { course: { creatorId: creator.id } } : {})
                        }
                    }),
                    prisma.paymentTransaction.aggregate({
                        where: {
                            paidAt: { gte: startDate },
                            status: 'PAID'
                        },
                        _sum: { amount: true }
                    }),
                    prisma.subscription.count({
                        where: { status: 'ACTIVE' }
                    })
                ])

                analytics = {
                    totalUsers,
                    newUsers,
                    userGrowth: totalUsers > 0 ? ((newUsers / totalUsers) * 100).toFixed(1) : 0,
                    totalCourses,
                    totalEnrollments,
                    totalRevenue: totalRevenue._sum.amount || 0,
                    activeSubscriptions
                }
                break
            }

            case 'engagement': {
                // User engagement metrics
                const [
                    videoViews,
                    avgWatchTime,
                    completionRates,
                    quizAttempts,
                    certificatesIssued
                ] = await Promise.all([
                    prisma.videoAnalytics.count({
                        where: {
                            createdAt: { gte: startDate },
                            ...(creator ? { lesson: { course: { creatorId: creator.id } } } : {})
                        }
                    }),
                    prisma.videoAnalytics.aggregate({
                        where: { createdAt: { gte: startDate } },
                        _avg: { duration: true }
                    }),
                    prisma.enrollment.count({
                        where: {
                            updatedAt: { gte: startDate },
                            progress: 100
                        }
                    }),
                    prisma.quizAttempt.count({
                        where: { createdAt: { gte: startDate } }
                    }),
                    prisma.certificate.count({
                        where: { issueDate: { gte: startDate } }
                    })
                ])

                analytics = {
                    videoViews,
                    avgWatchTimeMinutes: Math.round((avgWatchTime._avg.duration || 0) / 60),
                    coursesCompleted: completionRates,
                    quizAttempts,
                    certificatesIssued,
                    engagementScore: Math.round(
                        (videoViews * 0.3 + completionRates * 0.4 + quizAttempts * 0.3) / 100
                    )
                }
                break
            }

            case 'revenue': {
                // Revenue analytics
                const transactions = await prisma.paymentTransaction.groupBy({
                    by: ['subscriptionType'],
                    where: {
                        paidAt: { gte: startDate },
                        status: 'PAID'
                    },
                    _sum: { amount: true },
                    _count: true
                })

                const dailyRevenue = await prisma.$queryRaw`
                    SELECT DATE(\`paidAt\`) as date, SUM(\`amount\`) as revenue, COUNT(*) as transactions
                    FROM \`PaymentTransaction\`
                    WHERE \`paidAt\` >= ${startDate} AND \`status\` = 'PAID'
                    GROUP BY DATE(\`paidAt\`)
                    ORDER BY date ASC
                ` as any[]

                const topCourses = await prisma.enrollment.groupBy({
                    by: ['courseId'],
                    where: {
                        createdAt: { gte: startDate },
                        ...(creator ? { course: { creatorId: creator.id } } : {})
                    },
                    _count: true,
                    orderBy: { _count: { courseId: 'desc' } },
                    take: 5
                })

                // Get course details
                const courseIds = topCourses.map(c => c.courseId)
                const courses = await prisma.course.findMany({
                    where: { id: { in: courseIds } },
                    select: { id: true, title: true, price: true }
                })

                analytics = {
                    bySubscriptionType: transactions.map(t => ({
                        type: t.subscriptionType,
                        revenue: t._sum.amount,
                        transactions: t._count
                    })),
                    totalRevenue: transactions.reduce((sum, t) => sum + (t._sum.amount || 0), 0),
                    dailyRevenue: dailyRevenue || [],
                    topCourses: topCourses.map(tc => {
                        const course = courses.find(c => c.id === tc.courseId)
                        return {
                            courseId: tc.courseId,
                            title: course?.title,
                            enrollments: tc._count,
                            estimatedRevenue: (course?.price || 0) * tc._count
                        }
                    })
                }
                break
            }

            case 'content': {
                // Content performance analytics
                const courses = await prisma.course.findMany({
                    where: creator ? { creatorId: creator.id } : {},
                    select: {
                        id: true,
                        title: true,
                        rating: true,
                        _count: {
                            select: {
                                enrollments: true,
                                lessons: true,
                                reviews: true
                            }
                        }
                    },
                    orderBy: { rating: 'desc' },
                    take: 10
                })

                const lessonStats = await prisma.lesson.groupBy({
                    by: ['courseId'],
                    _avg: { duration: true },
                    _count: true
                })

                analytics = {
                    topRatedCourses: courses.slice(0, 5),
                    mostEnrolledCourses: [...courses].sort(
                        (a, b) => b._count.enrollments - a._count.enrollments
                    ).slice(0, 5),
                    totalLessons: lessonStats.reduce((sum, l) => sum + l._count, 0),
                    avgLessonsPerCourse: Math.round(
                        lessonStats.reduce((sum, l) => sum + l._count, 0) / lessonStats.length || 0
                    ),
                    avgCourseDuration: Math.round(
                        lessonStats.reduce((sum, l) => sum + (l._avg.duration || 0), 0) / 60
                    )
                }
                break
            }

            case 'users': {
                // User analytics (admin only)
                if (!isAdmin) {
                    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
                }

                const usersByRole = await prisma.user.groupBy({
                    by: ['role'],
                    _count: true
                })

                const usersByCountry = await prisma.user.groupBy({
                    by: ['country'],
                    _count: true,
                    orderBy: { _count: { country: 'desc' } },
                    take: 10
                })

                const retentionData = await prisma.user.count({
                    where: {
                        createdAt: { lte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
                        updatedAt: { gte: startDate }
                    }
                })

                const totalOldUsers = await prisma.user.count({
                    where: {
                        createdAt: { lte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
                    }
                })

                analytics = {
                    byRole: usersByRole.map(u => ({
                        role: u.role,
                        count: u._count
                    })),
                    byCountry: usersByCountry.map(u => ({
                        country: u.country || 'Unknown',
                        count: u._count
                    })),
                    retentionRate: totalOldUsers > 0
                        ? ((retentionData / totalOldUsers) * 100).toFixed(1)
                        : 0,
                    activeUsersRatio: 0 // Would need session tracking
                }
                break
            }

            default:
                return NextResponse.json({ error: 'Invalid analytics type' }, { status: 400 })
        }

        return NextResponse.json({
            type,
            period,
            dateRange: {
                start: startDate.toISOString(),
                end: now.toISOString()
            },
            data: analytics,
            generatedAt: new Date().toISOString()
        })
    } catch (error) {
        console.error('Advanced analytics error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch analytics' },
            { status: 500 }
        )
    }
}
