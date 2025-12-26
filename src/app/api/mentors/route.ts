import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '12')
        const search = searchParams.get('search')
        const specialty = searchParams.get('specialty')

        const skip = (page - 1) * limit

        // Build where clause for filtering
        const where: any = {}

        if (search) {
            where.OR = [
                { user: { name: { contains: search } } },
                { user: { arabicName: { contains: search } } },
                { expertise: { contains: search } },
            ]
        }

        if (specialty) {
            // Filter by expertise/specialty if provided
            where.expertise = { contains: specialty }
        }

        // Fetch mentors (creators) with user information and stats
        const [mentors, total] = await Promise.all([
            prisma.creator.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            arabicName: true,
                            email: true,
                            profileImage: true,
                            bio: true,
                        },
                    },
                    _count: {
                        select: {
                            courses: true,
                        },
                    },
                },
                orderBy: [
                    { totalSubscribers: 'desc' },
                    { createdAt: 'desc' },
                ],
                skip,
                take: limit,
            }),
            prisma.creator.count({ where }),
        ])

        // Calculate additional stats for each mentor
        const mentorsWithStats = await Promise.all(
            mentors.map(async (mentor) => {
                // Get total students from enrollments
                const totalStudents = await prisma.enrollment.count({
                    where: {
                        course: {
                            creatorId: mentor.id,
                        },
                    },
                })

                // Calculate average rating from courses
                const courses = await prisma.course.findMany({
                    where: { creatorId: mentor.id },
                    select: { rating: true },
                })

                const averageRating = courses.length > 0
                    ? courses.reduce((sum, course) => sum + course.rating, 0) / courses.length
                    : 0

                return {
                    id: mentor.id,
                    user: mentor.user,
                    totalCourses: mentor._count.courses,
                    totalStudents,
                    averageRating,
                    verified: mentor.kycStatus === 'VERIFIED',
                    expertise: mentor.expertise,
                    createdAt: mentor.createdAt.toISOString(),
                }
            })
        )

        const totalPages = Math.ceil(total / limit)

        return NextResponse.json({
            mentors: mentorsWithStats,
            pagination: {
                page,
                limit,
                total,
                pages: totalPages,
            },
        })
    } catch (error) {
        console.error('Error fetching mentors:', error)
        return NextResponse.json(
            { error: 'Failed to fetch mentors' },
            { status: 500 }
        )
    }
}
