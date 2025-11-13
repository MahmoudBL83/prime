import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const period = searchParams.get('period') || 'month'

        // Calculate date range based on period
        const now = new Date()
        let startDate = new Date()

        switch (period) {
            case 'week':
                startDate.setDate(now.getDate() - 7)
                break
            case 'month':
                startDate.setMonth(now.getMonth() - 1)
                break
            case 'year':
                startDate.setFullYear(now.getFullYear() - 1)
                break
            default:
                startDate.setMonth(now.getMonth() - 1)
        }

        // Fetch most viewed courses
        const courses = await prisma.course.findMany({
            where: {
                status: 'PUBLISHED',
                createdAt: {
                    gte: startDate
                }
            },
            include: {
                creator: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                arabicName: true,
                                profileImage: true
                            }
                        }
                    }
                },
                lessons: {
                    select: {
                        id: true,
                        duration: true
                    }
                }
            },
            orderBy: [
                { totalViews: 'desc' },
                { totalEnrollments: 'desc' },
                { createdAt: 'desc' }
            ],
            take: 12
        })

        // Transform the data
        const transformedCourses = courses.map(course => ({
            id: course.id,
            title: course.title,
            titleAr: course.titleAr,
            instructor: course.creator.user.name,
            instructorArabic: course.creator.user.arabicName,
            instructorImage: course.creator.user.profileImage,
            thumbnail: course.thumbnail,
            duration: course.duration,
            totalViews: course.totalViews,
            lessonsCount: course.lessons.length,
            category: course.category,
            level: course.skillLevel,
            totalEnrollments: course.totalEnrollments
        }))

        return NextResponse.json({
            courses: transformedCourses,
            period,
            total: transformedCourses.length
        })

    } catch (error) {
        console.error('Error fetching most viewed courses:', error)
        return NextResponse.json(
            { error: 'Failed to fetch most viewed courses' },
            { status: 500 }
        )
    }
}
