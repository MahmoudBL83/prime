import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { z } from 'zod'

const createSegmentSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    criteria: z.array(z.object({
        type: z.enum(['activity', 'subscription', 'engagement', 'demographic']),
        operator: z.enum(['equals', 'greater_than', 'less_than', 'contains', 'between']),
        value: z.any()
    })).min(1)
})

const updateSegmentSchema = createSegmentSchema.partial()

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!currentUser || currentUser.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            )
        }

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const search = searchParams.get('search')
        const isActive = searchParams.get('isActive')

        const where: any = {}

        if (search) {
            where.name = { contains: search, mode: 'insensitive' }
        }

        if (isActive !== null) {
            where.isActive = isActive === 'true'
        }

        const [segments, total] = await Promise.all([
            prisma.userSegment.findMany({
                where,
                include: {
                    creator: {
                        select: { name: true, email: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.userSegment.count({ where })
        ])

        // Calculate user counts for each segment
        const segmentsWithCounts = await Promise.all(
            segments.map(async (segment) => {
                const userCount = await calculateSegmentUserCount(segment.criteria as any)
                return {
                    ...segment,
                    userCount
                }
            })
        )

        return NextResponse.json({
            segments: segmentsWithCounts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error('Failed to fetch user segments:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!currentUser || currentUser.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const validatedData = createSegmentSchema.parse(body)

        // Calculate initial user count
        const userCount = await calculateSegmentUserCount(validatedData.criteria)

        const segment = await prisma.userSegment.create({
            data: {
                name: validatedData.name,
                description: validatedData.description,
                criteria: validatedData.criteria,
                userCount,
                createdBy: currentUser.id
            },
            include: {
                creator: {
                    select: { name: true, email: true }
                }
            }
        })

        return NextResponse.json(segment, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.issues },
                { status: 400 }
            )
        }

        console.error('Failed to create user segment:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// Helper function to calculate user count for a segment
async function calculateSegmentUserCount(criteria: any[]): Promise<number> {
    try {
        // Build Prisma where clause from criteria
        const whereClause = buildWhereClause(criteria)
        const count = await prisma.user.count({
            where: whereClause
        })
        return count
    } catch (error) {
        console.error('Failed to calculate segment user count:', error)
        return 0
    }
}

// Helper function to build Prisma where clause from segment criteria
function buildWhereClause(criteria: any[]): any {
    const where: any = {}

    for (const criterion of criteria) {
        switch (criterion.type) {
            case 'activity':
                // Handle activity-based criteria
                if (criterion.value?.field === 'lastPostDate') {
                    const daysAgo = new Date()
                    daysAgo.setDate(daysAgo.getDate() - criterion.value.days)
                    where.createdAt = { gte: daysAgo }
                }
                break

            case 'subscription':
                // Handle subscription-based criteria
                if (criterion.operator === 'equals') {
                    where.subscriptions = {
                        some: {
                            status: 'active',
                            // Add more subscription filtering logic here
                        }
                    }
                }
                break

            case 'engagement':
                // Handle engagement-based criteria
                // This would need more complex logic based on user interactions
                break

            case 'demographic':
                // Handle demographic-based criteria
                if (criterion.value?.field && criterion.value?.value) {
                    where[criterion.value.field] = criterion.value.value
                }
                break
        }
    }

    return where
}