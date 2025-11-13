import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        // Get all published courses with limited fields for landing page
        const courses = await prisma.course.findMany({
            where: {
                status: 'PUBLISHED',
            },
            include: {
                creator: {
                    include: {
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
                { totalEnrollments: 'desc' },
                { createdAt: 'desc' },
            ],
            take: 10, // Limit to top 10 courses
        })

        // Transform courses to match the landing page format
        const featuredCourses = courses.map((course) => ({
            id: course.id,
            titleAr: course.titleAr,
            titleEn: course.title,
            thumbnail: course.thumbnail || 'https://images.unsplash.com/photo-1593720213428-28a5b9e94613?w=500&h=300&fit=crop',
            instructor: course.creator.user.arabicName || course.creator.user.name,
            duration: `${Math.round(course.duration / 60)} ساعات`,
            level: course.skillLevel === 'Beginner' ? 'مبتدئ' : course.skillLevel === 'Intermediate' ? 'متوسط' : 'متقدم',
            rating: course.rating,
            category: course.category === 'CATEGORY_A' ? 'التكنولوجيا' : 'الأعمال',
        }))

        // Group courses by category
        const groupedCourses = {
            technology: featuredCourses.filter(c => c.category === 'التكنولوجيا'),
            business: featuredCourses.filter(c => c.category === 'الأعمال'),
            languages: [], // Will be populated when we have language courses
        }

        return NextResponse.json({ courses: groupedCourses })
    } catch (error) {
        console.error('Featured courses fetch error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch featured courses' },
            { status: 500 }
        )
    }
}
