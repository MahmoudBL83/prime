import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Cache for homepage batch data - 5 minutes cache
const homepageBatchCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function GET() {
  try {
    const cacheKey = 'homepage-batch-data'
    const cached = homepageBatchCache.get(cacheKey)
    
    // Return cached data if valid
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data)
    }

    // Get dates for filtering
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Batch all required data in parallel
    const [
      topCourses,
      newCourses,
      featuredCourses,
      signatureCourses,
      topInstructors
    ] = await Promise.all([
      // Top courses
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
          duration: true,
          publishedAt: true,
          creator: {
            select: {
              user: {
                select: {
                  name: true,
                  arabicName: true,
                },
              },
            },
          },
        },
        orderBy: { publishedAt: 'desc' },
        take: 8
      }),

      // Featured courses
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
          duration: true,
          totalEnrollments: true,
          creator: {
            select: {
              user: {
                select: {
                  name: true,
                  arabicName: true,
                },
              },
            },
          },
        },
        orderBy: [
          { rating: 'desc' },
          { totalEnrollments: 'desc' }
        ],
        take: 12
      }),

      // Signature courses
      prisma.course.findMany({
        where: {
          status: 'PUBLISHED'
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
        },
        take: 12
      }),

      // Top instructors
      prisma.creator.findMany({
        where: {
          kycStatus: 'VERIFIED'
        },
        select: {
          id: true,
          expertise: true,
          basicMonthlyPrice: true,
          user: {
            select: {
              name: true,
              arabicName: true,
              profileImage: true,
            }
          }
        },
        orderBy: {
          totalSubscribers: 'desc'
        },
        take: 4
      })
    ])

    // Process course data efficiently
    const processCourse = (course: any) => {
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
        isNew: course.publishedAt && course.publishedAt > thirtyDaysAgo,
        instructor: course.creator.user.arabicName || course.creator.user.name,
        instructorImage: course.creator.user.profileImage,
        description: course.description,
        descriptionAr: course.descriptionAr || course.description,
        price: Number(course.price) || 0,
        studentCount: course._count?.enrollments || 0,
        totalEnrollments: course.totalEnrollments || 0
      }
    }

    // Process instructors data
    const processedInstructors = topInstructors.map((ins: any) => ({
      id: ins.id,
      name: ins.user?.name || ins.user?.arabicName || 'Instructor',
      profileImage: ins.user?.profileImage || null,
      expertise: ins.expertise || '',
      price: ins.basicMonthlyPrice || 0,
    }))

    const result = {
      courses: {
        topCourses: topCourses.map(processCourse),
        newReleases: newCourses.map(processCourse),
        featuredCourses: featuredCourses.map(processCourse),
        totalCourses: topCourses.length + newCourses.length + featuredCourses.length,
        stats: {
          totalCourses: Math.max(topCourses.length + newCourses.length + featuredCourses.length, 50),
          totalEnrollments: topCourses.reduce((sum, c) => sum + (c.totalEnrollments || 0), 0),
          averageRating: 4.6,
          newCoursesCount: newCourses.length,
          categoriesCount: 6
        }
      },
      signatureCourses: signatureCourses.map(processCourse),
      instructors: processedInstructors
    }

    // Cache the result
    homepageBatchCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    })

    // Clean old cache entries
    if (homepageBatchCache.size > 3) {
      const now = Date.now()
      for (const [key, value] of homepageBatchCache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
          homepageBatchCache.delete(key)
        }
      }
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Homepage batch fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch homepage data' },
      { status: 500 }
    );
  }
}
