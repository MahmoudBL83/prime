import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/content/reviews
 * Get courses pending first-time review
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status') || 'UNDER_REVIEW'
        const category = searchParams.get('category') || 'all'
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const skip = (page - 1) * limit

        // Build where clause
        const where: any = {}
        
        if (status !== 'all') {
            where.status = status
        } else {
            // For "all", show courses that need review or are under review
            where.status = { in: ['DRAFT', 'UNDER_REVIEW', 'REJECTED'] }
        }

        if (category !== 'all') {
            where.contentCategory = category
        }

        // Fetch courses with creator and lesson data
        const [courses, total] = await Promise.all([
            prisma.course.findMany({
                where,
                include: {
                    creator: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    arabicName: true,
                                    profileImage: true
                                }
                            }
                        }
                    },
                    lessons: {
                        select: {
                            id: true,
                            title: true,
                            duration: true,
                            videoUrl: true,
                            order: true
                        },
                        orderBy: { order: 'asc' },
                        take: 5 // First 5 lessons for preview
                    },
                    _count: {
                        select: {
                            lessons: true,
                            enrollments: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.course.count({ where })
        ])

        // Get statistics
        const stats = await prisma.course.groupBy({
            by: ['status'],
            where: {
                status: { in: ['DRAFT', 'UNDER_REVIEW', 'PUBLISHED', 'REJECTED'] }
            },
            _count: true
        })

        const statusCounts = stats.reduce((acc, stat) => {
            acc[stat.status] = stat._count
            return acc
        }, {} as Record<string, number>)

        // Category breakdown
        const categoryStats = await prisma.course.groupBy({
            by: ['contentCategory'],
            where: {
                status: 'UNDER_REVIEW'
            },
            _count: true
        })

        const categoryCounts = categoryStats.reduce((acc, stat) => {
            acc[stat.contentCategory] = stat._count
            return acc
        }, {} as Record<string, number>)

        return NextResponse.json({
            success: true,
            data: {
                courses: courses.map(course => ({
                    id: course.id,
                    title: course.title,
                    titleAr: course.titleAr,
                    description: course.description,
                    thumbnail: course.thumbnail,
                    contentType: course.contentType,
                    contentCategory: course.contentCategory,
                    status: course.status,
                    category: course.category,
                    skillLevel: course.skillLevel,
                    duration: course.duration,
                    totalLessons: course._count.lessons,
                    totalEnrollments: course._count.enrollments,
                    rating: course.rating,
                    createdAt: course.createdAt,
                    updatedAt: course.updatedAt,
                    publishedAt: course.publishedAt,
                    creator: {
                        id: course.creator.id,
                        name: course.creator.user.name,
                        arabicName: course.creator.user.arabicName,
                        email: course.creator.user.email,
                        profileImage: course.creator.user.profileImage,
                        expertise: course.creator.expertise
                    },
                    lessons: course.lessons
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                },
                stats: {
                    total,
                    draft: statusCounts['DRAFT'] || 0,
                    underReview: statusCounts['UNDER_REVIEW'] || 0,
                    published: statusCounts['PUBLISHED'] || 0,
                    rejected: statusCounts['REJECTED'] || 0,
                    categoryA: categoryCounts['CATEGORY_A'] || 0,
                    categoryB: categoryCounts['CATEGORY_B'] || 0,
                    categoryC: categoryCounts['CATEGORY_C'] || 0
                }
            }
        })
    } catch (error) {
        console.error('Error fetching content reviews:', error)
        return NextResponse.json(
            { error: 'Failed to fetch content reviews' },
            { status: 500 }
        )
    }
}
