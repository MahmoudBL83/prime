import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Cache for signature courses - 2 minutes cache
const coursesCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes

export async function GET(req: NextRequest) {
  try {
    const cacheKey = 'signature-courses:all'
    const cached = coursesCache.get(cacheKey)
    
    // Return cached data if valid
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data)
    }

    // Optimized query with selective fields
    const courses = await prisma.course.findMany({
      where: {
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        title: true,
        titleAr: true,
        description: true,
        descriptionAr: true,
        thumbnail: true,
        duration: true,
        totalEnrollments: true,
        rating: true,
        price: true,
        skillLevel: true,
        category: true,
        categoryAr: true,
        createdAt: true,
        creator: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                arabicName: true,
                profileImage: true,
              },
            },
          },
        },
        signatureWorkbook: {
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            signatureCohorts: {
              where: {
                status: 'UPCOMING',
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform courses to match the SignatureCourse interface
    const transformedCourses = courses.map((course) => {
      return {
        id: course.id,
        title: course.title,
        titleAr: course.titleAr,
        description: course.description,
        descriptionAr: course.descriptionAr,
        thumbnail: course.thumbnail,
        instructor: {
          name: course.creator.user.name,
          arabicName: course.creator.user.arabicName,
          profileImage: course.creator.user.profileImage,
        },
        duration: `${course.duration}h`,
        enrollmentCount: course.totalEnrollments,
        rating: course.rating,
        ratingCount: Math.floor(course.totalEnrollments * 0.6), // Assume 60% leave ratings
        price: course.price || 0,
        level: course.skillLevel,
        category: course.category,
        categoryAr: course.categoryAr,
        hasWorkbook: !!course.signatureWorkbook,
        hasCohort: course._count.signatureCohorts > 0,
        hasExpertQA: true, // All signature courses have expert Q&A
        hasCapstone: true, // All signature courses have capstone projects
      };
    });

    const result = {
      courses: transformedCourses,
      total: transformedCourses.length,
    }

    // Cache the result
    coursesCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    })

    // Clean old cache entries
    if (coursesCache.size > 10) {
      const now = Date.now()
      for (const [key, value] of coursesCache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
          coursesCache.delete(key)
        }
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching signature courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch signature courses' },
      { status: 500 }
    );
  }
}
