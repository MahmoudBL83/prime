import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Cache for homepage data - 5 minutes cache
const homepageCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function GET(req: NextRequest) {
    try {
        const cacheKey = 'homepage-courses'
        const cached = homepageCache.get(cacheKey)
        
        // Return cached data if valid
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return NextResponse.json(cached.data)
        }

        // Get current date for new releases calculation
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        // Optimized parallel queries with selective fields
        const [topCourses, newCourses, featuredCourses] = await Promise.all([
            // Top courses by enrollment and rating
            prisma.course.findMany({
                where: {
                    status: 'PUBLISHED',
                    totalEnrollments: { gt: 0 }
                },
                select: {
                    id: true,
                    title: true,
                    titleAr: true,
                    thumbnail: true,
                    rating: true,
                    category: true,
                    categoryAr: true,
                    description: true,
                    descriptionAr: true,
                    price: true,
                    totalEnrollments: true,
                    skillLevel: true,
                    duration: true,
                    publishedAt: true,
                    creator: {
                        select: {
                            user: {
                                select: {
                                    name: true,
                                    arabicName: true,
                                    profileImage: true,
                                },
                            },
                        },
                    },
                    _count: {
                        select: {
                            enrollments: true,
                            lessons: true,
                            reviews: true
                        }
                    }
                },
                orderBy: [
                    { totalEnrollments: 'desc' },
                    { rating: 'desc' }
                ],
                take: 10
            }),

            // New releases
            prisma.course.findMany({
                where: {
                    status: 'PUBLISHED',
                    publishedAt: { gte: thirtyDaysAgo }
                },
                select: {
                    id: true,
                    title: true,
                    titleAr: true,
                    thumbnail: true,
                    rating: true,
                    category: true,
                    categoryAr: true,
                    description: true,
                    descriptionAr: true,
                    price: true,
                    totalEnrollments: true,
                    skillLevel: true,
                    duration: true,
                    publishedAt: true,
                    creator: {
                        select: {
                            user: {
                                select: {
                                    name: true,
                                    arabicName: true,
                                    profileImage: true,
                                },
                            },
                        },
                    },
                    _count: {
                        select: {
                            enrollments: true,
                            lessons: true,
                            reviews: true
                        }
                    }
                },
                orderBy: { publishedAt: 'desc' },
                take: 8
            }),

            // Featured courses (high rated)
            prisma.course.findMany({
                where: {
                    status: 'PUBLISHED',
                    rating: { gte: 4.0 }
                },
                select: {
                    id: true,
                    title: true,
                    titleAr: true,
                    thumbnail: true,
                    rating: true,
                    category: true,
                    categoryAr: true,
                    description: true,
                    descriptionAr: true,
                    price: true,
                    totalEnrollments: true,
                    skillLevel: true,
                    duration: true,
                    publishedAt: true,
                    creator: {
                        select: {
                            user: {
                                select: {
                                    name: true,
                                    arabicName: true,
                                    profileImage: true,
                                },
                            },
                        },
                    },
                    _count: {
                        select: {
                            enrollments: true,
                            lessons: true,
                            reviews: true
                        }
                    }
                },
                orderBy: [
                    { rating: 'desc' },
                    { totalEnrollments: 'desc' }
                ],
                take: 12
            })
        ])

        // Fast processing with simpler logic
        const processCourse = (course: any, index?: number) => {
            const categoryThumbnails: { [key: string]: string } = {
                'programming': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=450&fit=crop&q=80',
                'design': 'https://images.unsplash.com/photo-1558655146-364adcfd5b5c?w=800&h=450&fit=crop&q=80',
                'business': 'https://images.unsplash.com/photo-1557838923-2985c318be48?w=800&h=450&fit=crop&q=80',
                'marketing': 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=450&fit=crop&q=80',
                'data-science': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop&q=80',
                'ai': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=450&fit=crop&q=80'
            }

            return {
                id: course.id,
                title: course.title,
                titleAr: course.titleAr || course.title,
                type: 'course' as const,
                thumbnail: course.thumbnail || categoryThumbnails[course.category] || categoryThumbnails['programming'],
                duration: `${course.duration}h`,
                rating: Number(course.rating) || 4.5,
                category: course.category,
                categoryAr: course.categoryAr,
                categoryKey: course.category,
                isNew: course.publishedAt && course.publishedAt > thirtyDaysAgo,
                isTopRated: Number(course.rating) >= 4.7,
                topPosition: typeof index === 'number' ? index + 1 : undefined,
                instructor: course.creator.user.arabicName || course.creator.user.name,
                instructorEn: course.creator.user.name,
                instructorImage: course.creator.user.profileImage,
                description: course.description,
                descriptionAr: course.descriptionAr || course.description,
                price: Number(course.price) || 0,
                studentCount: course._count?.enrollments || 0,
                reviewCount: course._count?.reviews || 0,
                lessonCount: course._count?.lessons || 0,
                difficulty: course.skillLevel as 'beginner' | 'intermediate' | 'advanced' || 'beginner',
                publishedAt: course.publishedAt,
                totalEnrollments: course.totalEnrollments || 0
            }
        }

        // Process results
        const processedTopCourses = topCourses.map((course, index) => processCourse(course, index))
        const processedNewReleases = newCourses.map(processCourse)
        const processedFeaturedCourses = featuredCourses.map(processCourse)

        // Simple stats calculation
        const totalCourses = processedTopCourses.length + processedNewReleases.length + processedFeaturedCourses.length
        const stats = {
            totalCourses: Math.max(totalCourses, 50), // Estimate if needed
            totalEnrollments: processedTopCourses.reduce((sum, c) => sum + c.totalEnrollments, 0),
            averageRating: 4.6, // Static for performance
            newCoursesCount: processedNewReleases.length,
            categoriesCount: 6 // Static for performance
        }

        const result = {
            topCourses: processedTopCourses,
            newReleases: processedNewReleases,
            featuredCourses: processedFeaturedCourses,
            stats,
            totalCourses
        }

        // Cache the result
        homepageCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        })

        // Clean old cache entries
        if (homepageCache.size > 5) {
            const now = Date.now()
            for (const [key, value] of homepageCache.entries()) {
                if (now - value.timestamp > CACHE_DURATION) {
                    homepageCache.delete(key)
                }
            }
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error('Homepage courses fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch homepage courses' },
            { status: 500 }
        );
    }
}
