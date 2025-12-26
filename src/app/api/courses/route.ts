import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '12')
        const category = searchParams.get('category')
        const skillLevel = searchParams.get('skillLevel')
        const search = searchParams.get('search')
    const featured = searchParams.get('featured') === 'true'
    const typeParam = searchParams.get('type')

        const skip = (page - 1) * limit

        // Build where clause for filtering
        const where: any = {
            status: 'PUBLISHED',
        }

        if (category) {
            // Map frontend categories to database categories
            const categoryMap: { [key: string]: string } = {
                'PROGRAMMING': 'CATEGORY_A',
                'DESIGN': 'CATEGORY_A',
                'BUSINESS': 'CATEGORY_A',
                'MARKETING': 'CATEGORY_A',
                'LANGUAGE': 'CATEGORY_A',
                'CATEGORY_A': 'CATEGORY_A'
            };
            where.category = categoryMap[category] || category
        }

        if (skillLevel) {
            where.skillLevel = skillLevel
        }

        // Note: isFeatured field doesn't exist in the schema, so we ignore this filter
        // If you want to implement featured courses, consider using a different approach
        // such as a separate table or a boolean field in the Course model

        if (search) {
            where.OR = [
                { title: { contains: search } },
                { titleAr: { contains: search } },
                { description: { contains: search } },
                { descriptionAr: { contains: search } },
            ]
        }

        // If `type` filter is provided (e.g., KIDS, AMUSEMENT, LEARNING, PODCASTS, MUSIC, BUSINESS)
        if (typeParam) {
            // Accept human-friendly types sent from client (case-insensitive)
            const normalized = typeParam.toUpperCase()
            const allowed = ['KIDS','AMUSEMENT','LEARNING','PODCASTS','MUSIC','BUSINESS','OTHER']
            if (allowed.includes(normalized)) {
                where.type = normalized
            }
        }

        // Fetch courses with creator information
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
                                    arabicName: true,
                                    profileImage: true,
                                },
                            },
                        },
                    },
                },
                orderBy: [
                    { totalEnrollments: 'desc' },
                    { rating: 'desc' },
                    { createdAt: 'desc' },
                ],
                skip,
                take: limit,
            }),
            prisma.course.count({ where }),
        ])

        return NextResponse.json({
            courses,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        console.error('Courses fetch error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch courses' },
            { status: 500 }
        )
    }
}
