import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { presentCourse } from '@/lib/course-presentation'
import { unstable_cache } from 'next/cache'
import { CourseType, Prisma } from '@prisma/client'

const getPublishedCourses = unstable_cache(
    async (where: Prisma.CourseWhereInput, skip: number, limit: number) => Promise.all([
        prisma.course.findMany({
            where,
            select: {
                id: true, title: true, titleAr: true, titleDe: true,
                description: true, descriptionAr: true, descriptionDe: true,
                thumbnail: true, category: true, skillLevel: true, duration: true,
                rating: true, totalEnrollments: true, contentCategory: true,
                creator: { select: { id: true, user: { select: { id: true, name: true, arabicName: true, profileImage: true } } } },
            },
            orderBy: [{ totalEnrollments: 'desc' }, { rating: 'desc' }, { createdAt: 'desc' }],
            skip,
            take: limit,
        }),
        prisma.course.count({ where }),
    ]),
    ['published-course-catalog-v1'],
    { revalidate: 60, tags: ['courses'] }
)

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const requestedPage = Number(searchParams.get('page'))
        const requestedLimit = Number(searchParams.get('limit'))
        const page = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.min(10000, Math.floor(requestedPage)) : 1
        const limit = Number.isFinite(requestedLimit) && requestedLimit > 0 ? Math.min(48, Math.floor(requestedLimit)) : 12
        const category = searchParams.get('category')
        const skillLevel = searchParams.get('skillLevel')
        const search = searchParams.get('search')
        const typeParam = searchParams.get('type')

        const skip = (page - 1) * limit

        // Build where clause for filtering
        const where: Prisma.CourseWhereInput = {
            status: 'PUBLISHED',
            isHidden: false,
        }

        if (category) {
            where.category = category
        }

        if (skillLevel) {
            where.skillLevel = skillLevel
        }

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { titleAr: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { descriptionAr: { contains: search, mode: 'insensitive' } },
            ]
        }

        // If `type` filter is provided (e.g., KIDS, AMUSEMENT, LEARNING, PODCASTS, MUSIC, BUSINESS)
        if (typeParam) {
            // Accept human-friendly types sent from client (case-insensitive)
            const normalized = typeParam.toUpperCase()
            if (Object.values(CourseType).includes(normalized as CourseType)) {
                where.type = normalized as CourseType
            }
        }

        const [courses, total] = await getPublishedCourses(where, skip, limit)

        return NextResponse.json({
            courses: courses.map(presentCourse),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } })
    } catch (error) {
        console.error('Courses fetch error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch courses' },
            { status: 500 }
        )
    }
}
