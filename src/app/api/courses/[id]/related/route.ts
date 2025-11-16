import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const courseId = id

        // Get the current course to find similar courses
        const currentCourse = await prisma.course.findUnique({
            where: { id: courseId },
            select: {
                category: true,
                skillLevel: true,
            }
        })

        if (!currentCourse) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 })
        }

        // Find related courses based on category and skill level
        const relatedCourses = await prisma.course.findMany({
            where: {
                AND: [
                    { id: { not: courseId } }, // Exclude current course
                    { status: 'PUBLISHED' }, // Only published courses
                    {
                        OR: [
                            { category: currentCourse.category },
                            { skillLevel: currentCourse.skillLevel }
                        ]
                    }
                ]
            },
            include: {
                creator: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                arabicName: true
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
            take: 6, // Limit to 6 related courses
            orderBy: [
                { totalEnrollments: 'desc' }, // Popular courses first
                { createdAt: 'desc' }
            ]
        })

        // Transform the data to include calculated fields
        const transformedCourses = relatedCourses.map(course => ({
            id: course.id,
            title: course.title,
            titleAr: course.titleAr,
            description: course.description,
            descriptionAr: course.descriptionAr,
            thumbnail: course.thumbnail,
            category: course.category,
            skillLevel: course.skillLevel,
            duration: course.duration,
            totalEnrollments: course.totalEnrollments,
            rating: course.rating,
            creator: course.creator.user.name,
            creatorArabic: course.creator.user.arabicName,
            lessonsCount: course.lessons.length,
            totalDuration: course.lessons.reduce((sum, lesson) => sum + lesson.duration, 0)
        }))

        return NextResponse.json({
            courses: transformedCourses,
            total: transformedCourses.length
        })

    } catch (error) {
        console.error('Error fetching related courses:', error)
        return NextResponse.json(
            { error: 'Failed to fetch related courses' },
            { status: 500 }
        )
    }
}
