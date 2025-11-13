import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch comprehensive creator analytics
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify creator
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        createdAt: true
                    }
                }
            }
        })

        if (!creator) {
            return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 })
        }

        const { searchParams } = new URL(request.url)
        const period = searchParams.get('period') || '30' // days
        const periodDays = parseInt(period)

        const startDate = new Date()
        startDate.setDate(startDate.getDate() - periodDays)

        // 1. OVERVIEW METRICS
        const [
            totalCourses,
            publishedCourses,
            totalEnrollments,
            totalRevenue,
            totalSubscribers,
            activeChannels,
            totalLiveSessions,
            totalPosts
        ] = await Promise.all([
            // Total courses created
            prisma.course.count({
                where: { creatorId: creator.id }
            }),
            // Published courses
            prisma.course.count({
                where: {
                    creatorId: creator.id,
                    status: 'PUBLISHED'
                }
            }),
            // Total enrollments
            prisma.enrollment.count({
                where: {
                    course: {
                        creatorId: creator.id
                    }
                }
            }),
            // Total revenue
            prisma.creatorEarnings.aggregate({
                where: { creatorId: creator.id },
                _sum: { amount: true }
            }),
            // Channel subscribers
            prisma.subscription.count({
                where: {
                    channel: {
                        creatorId: creator.id
                    },
                    status: 'ACTIVE'
                }
            }),
            // Active channels
            prisma.creatorChannel.count({
                where: { creatorId: creator.id }
            }),
            // Live sessions
            prisma.liveSession.count({
                where: {
                    channel: {
                        creatorId: creator.id
                    }
                }
            }),
            // Channel posts
            prisma.channelPost.count({
                where: {
                    channel: {
                        creatorId: creator.id
                    }
                }
            })
        ])

        // 2. REVENUE ANALYTICS
        const revenueBreakdown = await prisma.creatorEarnings.groupBy({
            by: ['sourceType'],
            where: {
                creatorId: creator.id,
                createdAt: { gte: startDate }
            },
            _sum: { amount: true },
            _count: true
        })

        // Revenue by category (using REVENUE_SHARE type as proxy for now)
        // TODO: Add category field to CreatorEarnings schema for accurate tracking
        const categoryARevenue = await prisma.creatorEarnings.aggregate({
            where: {
                creatorId: creator.id,
                sourceType: 'COURSE_ENROLLMENT',
                createdAt: { gte: startDate }
            },
            _sum: { amount: true }
        })

        const categoryBRevenue = await prisma.creatorEarnings.aggregate({
            where: {
                creatorId: creator.id,
                sourceType: 'REVENUE_SHARE',
                createdAt: { gte: startDate }
            },
            _sum: { amount: true }
        })

        const categoryCRevenue = await prisma.creatorEarnings.aggregate({
            where: {
                creatorId: creator.id,
                sourceType: 'CHANNEL_SUBSCRIPTION',
                createdAt: { gte: startDate }
            },
            _sum: { amount: true }
        })

        // Count courses by category
        const coursesByCategory = await prisma.course.groupBy({
            by: ['contentCategory'],
            where: {
                creatorId: creator.id,
                status: 'PUBLISHED'
            },
            _count: true
        })

        // Monthly revenue trend (last 12 months)
        const monthlyRevenue = await prisma.$queryRaw<Array<{ period: string, total: number }>>`
            SELECT period, SUM(amount) as total
            FROM CreatorEarnings
            WHERE creatorId = ${creator.id}
            GROUP BY period
            ORDER BY period DESC
            LIMIT 12
        `

        // 3. COURSE PERFORMANCE
        const topCourses = await prisma.course.findMany({
            where: {
                creatorId: creator.id,
                status: 'PUBLISHED'
            },
            include: {
                _count: {
                    select: {
                        enrollments: true,
                        reviews: true
                    }
                }
            },
            orderBy: {
                totalEnrollments: 'desc'
            },
            take: 10
        })

        // Course completion rates
        const courseCompletionData = await Promise.all(
            topCourses.slice(0, 5).map(async (course) => {
                const totalEnrollments = course._count.enrollments
                const completedEnrollments = await prisma.enrollment.count({
                    where: {
                        courseId: course.id,
                        completedAt: { not: null }
                    }
                })

                return {
                    courseId: course.id,
                    courseTitle: course.title,
                    enrollments: totalEnrollments,
                    completions: completedEnrollments,
                    completionRate: totalEnrollments > 0 
                        ? (completedEnrollments / totalEnrollments * 100).toFixed(1)
                        : '0'
                }
            })
        )

        // 4. ENGAGEMENT METRICS
        const engagementMetrics = await Promise.all([
            // Recent enrollments
            prisma.enrollment.count({
                where: {
                    course: { creatorId: creator.id },
                    createdAt: { gte: startDate }
                }
            }),
            // Recent reviews
            prisma.review.count({
                where: {
                    course: { creatorId: creator.id },
                    createdAt: { gte: startDate }
                }
            }),
            // Average rating
            prisma.review.aggregate({
                where: {
                    course: { creatorId: creator.id }
                },
                _avg: { rating: true }
            }),
            // Channel post engagement
            prisma.postLike.count({
                where: {
                    post: {
                        channel: { creatorId: creator.id }
                    },
                    createdAt: { gte: startDate }
                }
            }),
            // Channel comments
            prisma.postComment.count({
                where: {
                    post: {
                        channel: { creatorId: creator.id }
                    },
                    createdAt: { gte: startDate }
                }
            })
        ])

        const [newEnrollments, newReviews, avgRating, postLikes, postComments] = engagementMetrics

        // 5. AUDIENCE DEMOGRAPHICS
        // Get learner distribution by enrollment
        const audienceData = await prisma.enrollment.groupBy({
            by: ['userId'],
            where: {
                course: { creatorId: creator.id }
            },
            _count: true
        })

        // 6. GROWTH METRICS
        // Calculate growth rates
        const previousPeriodStart = new Date(startDate)
        previousPeriodStart.setDate(previousPeriodStart.getDate() - periodDays)

        const [currentPeriodEnrollments, previousPeriodEnrollments] = await Promise.all([
            prisma.enrollment.count({
                where: {
                    course: { creatorId: creator.id },
                    createdAt: { gte: startDate }
                }
            }),
            prisma.enrollment.count({
                where: {
                    course: { creatorId: creator.id },
                    createdAt: {
                        gte: previousPeriodStart,
                        lt: startDate
                    }
                }
            })
        ])

        const enrollmentGrowth = previousPeriodEnrollments > 0
            ? ((currentPeriodEnrollments - previousPeriodEnrollments) / previousPeriodEnrollments * 100).toFixed(1)
            : '0'

        // 7. CONTENT ANALYTICS
        const contentStats = {
            totalLessons: await prisma.lesson.count({
                where: {
                    course: { creatorId: creator.id }
                }
            }),
            totalVideoDuration: await prisma.course.aggregate({
                where: { creatorId: creator.id },
                _sum: { duration: true }
            }),
            averageCourseRating: avgRating._avg.rating || 0
        }

        // 8. LIVE SESSION ANALYTICS
        const liveSessionStats = await Promise.all([
            prisma.liveSession.count({
                where: {
                    channel: { creatorId: creator.id },
                    status: 'ENDED'
                }
            }),
            prisma.sessionAttendee.count({
                where: {
                    session: {
                        channel: { creatorId: creator.id }
                    }
                }
            }),
            prisma.liveSession.aggregate({
                where: {
                    channel: { creatorId: creator.id },
                    status: 'ENDED'
                },
                _avg: { viewCount: true }
            })
        ])

        const [completedSessions, totalAttendees, avgViewCount] = liveSessionStats

        // 9. RECENT ACTIVITY
        const recentActivity = await Promise.all([
            // Recent enrollments with course info
            prisma.enrollment.findMany({
                where: {
                    course: { creatorId: creator.id }
                },
                include: {
                    course: {
                        select: {
                            title: true,
                            thumbnail: true
                        }
                    },
                    user: {
                        select: {
                            name: true,
                            profileImage: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: 10
            }),
            // Recent reviews
            prisma.review.findMany({
                where: {
                    course: { creatorId: creator.id }
                },
                include: {
                    course: {
                        select: {
                            title: true
                        }
                    },
                    user: {
                        select: {
                            name: true,
                            profileImage: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: 10
            })
        ])

        const [recentEnrollments, recentReviews] = recentActivity

        // 10. PAYOUT SUMMARY
        const payoutSummary = await Promise.all([
            prisma.creatorPayout.aggregate({
                where: {
                    creatorId: creator.id,
                    status: 'COMPLETED'
                },
                _sum: { netAmount: true }
            }),
            prisma.creatorPayout.aggregate({
                where: {
                    creatorId: creator.id,
                    status: 'PENDING'
                },
                _sum: { amount: true }
            }),
            prisma.creatorPayout.count({
                where: {
                    creatorId: creator.id
                }
            })
        ])

        const [completedPayouts, pendingPayouts, totalPayoutRequests] = payoutSummary

        // Calculate available balance
        const totalEarned = totalRevenue._sum.amount || 0
        const totalPaidOut = completedPayouts._sum.netAmount || 0
        const availableBalance = totalEarned - totalPaidOut

        // Calculate next payout date (assume weekly payouts on Mondays)
        const now = new Date()
        const daysUntilMonday = (8 - now.getDay()) % 7 || 7
        const nextPayoutDate = new Date(now)
        nextPayoutDate.setDate(now.getDate() + daysUntilMonday)

        return NextResponse.json({
            success: true,
            data: {
                overview: {
                    totalCourses,
                    publishedCourses,
                    totalEnrollments,
                    totalRevenue: totalRevenue._sum.amount || 0,
                    totalSubscribers,
                    activeChannels,
                    totalLiveSessions,
                    totalPosts,
                    availableBalance,
                    memberSince: creator.user.createdAt
                },
                revenueByCategory: {
                    CATEGORY_A: categoryARevenue._sum?.amount || 0,
                    CATEGORY_B: categoryBRevenue._sum?.amount || 0,
                    CATEGORY_C: categoryCRevenue._sum?.amount || 0
                },
                coursesByCategory: {
                    CATEGORY_A: coursesByCategory.find(c => c.contentCategory === 'CATEGORY_A')?._count || 0,
                    CATEGORY_B: coursesByCategory.find(c => c.contentCategory === 'CATEGORY_B')?._count || 0,
                    CATEGORY_C: coursesByCategory.find(c => c.contentCategory === 'CATEGORY_C')?._count || 0
                },
                pendingPayout: pendingPayouts._sum?.amount || 0,
                nextPayoutDate: nextPayoutDate.toISOString(),
                totalWatchHours: Math.floor((contentStats.totalVideoDuration._sum.duration || 0) / 3600), // Convert seconds to hours
                revenue: {
                    total: totalRevenue._sum.amount || 0,
                    available: availableBalance,
                    breakdown: revenueBreakdown.map(item => ({
                        source: item.sourceType,
                        amount: item._sum.amount || 0,
                        count: item._count
                    })),
                    monthlyTrend: monthlyRevenue.map(m => ({
                        period: m.period,
                        amount: Number(m.total) || 0
                    }))
                },
                courses: {
                    top: topCourses.map(course => ({
                        id: course.id,
                        title: course.title,
                        thumbnail: course.thumbnail,
                        enrollments: course._count.enrollments,
                        reviews: course._count.reviews,
                        rating: course.rating,
                        revenue: 0 // Calculate from enrollments if course has price
                    })),
                    completionRates: courseCompletionData
                },
                engagement: {
                    newEnrollments,
                    newReviews,
                    averageRating: Number(avgRating._avg.rating?.toFixed(2)) || 0,
                    postLikes,
                    postComments,
                    totalEngagement: newEnrollments + newReviews + postLikes + postComments
                },
                growth: {
                    enrollmentGrowth: parseFloat(enrollmentGrowth),
                    currentPeriod: currentPeriodEnrollments,
                    previousPeriod: previousPeriodEnrollments
                },
                content: {
                    totalLessons: contentStats.totalLessons,
                    totalDuration: contentStats.totalVideoDuration._sum.duration || 0,
                    averageRating: Number(contentStats.averageCourseRating.toFixed(2))
                },
                liveSessions: {
                    completed: completedSessions,
                    totalAttendees,
                    averageViewers: Number(avgViewCount._avg.viewCount?.toFixed(0)) || 0
                },
                audience: {
                    uniqueLearners: audienceData.length,
                    repeatLearners: audienceData.filter(a => a._count > 1).length
                },
                activity: {
                    recentEnrollments: recentEnrollments.map(e => ({
                        id: e.id,
                        courseName: e.course.title,
                        studentName: e.user.name,
                        studentImage: e.user.profileImage,
                        enrolledAt: e.createdAt
                    })),
                    recentReviews: recentReviews.map(r => ({
                        id: r.id,
                        courseName: r.course.title,
                        studentName: r.user.name,
                        studentImage: r.user.profileImage,
                        rating: r.rating,
                        comment: r.comment,
                        createdAt: r.createdAt
                    }))
                },
                payouts: {
                    totalPaid: completedPayouts._sum.netAmount || 0,
                    pending: pendingPayouts._sum.amount || 0,
                    totalRequests: totalPayoutRequests
                },
                period: periodDays
            }
        })
    } catch (error) {
        console.error('Error fetching analytics:', error)
        return NextResponse.json(
            { error: 'Failed to fetch analytics' },
            { status: 500 }
        )
    }
}
