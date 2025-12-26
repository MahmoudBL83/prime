import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole, ContentStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
    try {
        // Verify admin authentication
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        // Get user from database
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!currentUser || currentUser.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            )
        }

        // Extract query parameters for filtering and pagination
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const search = searchParams.get('search') || ''
        const status = searchParams.get('status') || ''
        const category = searchParams.get('category') || ''
        const creatorId = searchParams.get('creatorId') || ''
        const sortBy = searchParams.get('sortBy') || 'createdAt'
        const sortOrder = searchParams.get('sortOrder') || 'desc'

        // Build where clause for filtering
        const where: any = {}

        if (search) {
            where.OR = [
                { title: { contains: search } },
                { titleAr: { contains: search } },
                { description: { contains: search } },
                { creator: { user: { name: { contains: search } } } },
            ]
        }

        if (status && status !== 'all') {
            where.status = status as ContentStatus
        }

        if (category && category !== 'all') {
            where.category = category
        }

        if (creatorId && creatorId !== 'all') {
            where.creatorId = creatorId
        }

        // Build orderBy clause
        const orderBy: any = {}
        if (sortBy === 'title') {
            orderBy.title = sortOrder
        } else if (sortBy === 'creator') {
            orderBy.creator = { user: { name: sortOrder } }
        } else if (sortBy === 'enrollments') {
            orderBy.totalEnrollments = sortOrder
        } else if (sortBy === 'rating' || sortBy === 'price' || sortBy === 'totalViews') {
            orderBy[sortBy] = sortOrder
        } else if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
            orderBy[sortBy] = sortOrder
        } else {
            orderBy.createdAt = 'desc' // default
        }

        // Get courses with creator details and counts
        const courses = await prisma.course.findMany({
            where,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
            include: {
                creator: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true,
                                arabicName: true,
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        lessons: true,
                        enrollments: true,
                    }
                }
            }
        })

        // Get total count for pagination
        const totalCourses = await prisma.course.count({ where })

        // Get status-based statistics
        const statusStats = await prisma.course.groupBy({
            by: ['status'],
            _count: {
                id: true
            }
        })

        // Get category-based statistics
        const categoryStats = await prisma.course.groupBy({
            by: ['category'],
            _count: {
                id: true
            }
        })

        // Get overall performance statistics
        const performanceStats = await prisma.course.aggregate({
            _sum: {
                totalEnrollments: true,
                totalViews: true,
            },
            _avg: {
                rating: true,
                price: true,
                duration: true,
            },
            _count: {
                id: true
            }
        })

        // Get recent content submissions (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const recentSubmissions = await prisma.course.count({
            where: {
                createdAt: {
                    gte: thirtyDaysAgo
                }
            }
        })

        // Get pending reviews count
        const pendingReviews = await prisma.course.count({
            where: {
                status: ContentStatus.UNDER_REVIEW
            }
        })

        return NextResponse.json({
            courses,
            pagination: {
                page,
                limit,
                total: totalCourses,
                pages: Math.ceil(totalCourses / limit)
            },
            statistics: {
                total: totalCourses,
                byStatus: statusStats.reduce((acc, stat) => ({
                    ...acc,
                    [stat.status]: stat._count.id
                }), {}),
                byCategory: categoryStats.reduce((acc, stat) => ({
                    ...acc,
                    [stat.category]: stat._count.id
                }), {}),
                totalEnrollments: performanceStats._sum.totalEnrollments || 0,
                totalViews: performanceStats._sum.totalViews || 0,
                averageRating: performanceStats._avg.rating || 0,
                averagePrice: performanceStats._avg.price || 0,
                averageDuration: performanceStats._avg.duration || 0,
                recentSubmissions,
                pendingReviews
            }
        })

    } catch (error) {
        console.error('Admin content API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        // Verify admin authentication
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        // Get user from database
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!currentUser || currentUser.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            )
        }

        // TODO: Handle course creation from admin panel
        return NextResponse.json(
            { error: 'Course creation not implemented yet' },
            { status: 501 }
        )

    } catch (error) {
        console.error('Admin content POST API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
