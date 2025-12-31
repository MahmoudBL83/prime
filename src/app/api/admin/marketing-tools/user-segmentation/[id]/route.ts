import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { z } from 'zod'

const updateSegmentSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    criteria: z.array(z.object({
        type: z.enum(['activity', 'subscription', 'engagement', 'demographic']),
        operator: z.enum(['equals', 'greater_than', 'less_than', 'contains', 'between']),
        value: z.any()
    })).min(1).optional(),
    isActive: z.boolean().optional()
})

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id: segmentId } = await params

        const segment = await prisma.userSegment.findUnique({
            where: { id: segmentId },
            include: {
                creator: {
                    select: { name: true, email: true }
                },
                campaigns: {
                    select: {
                        id: true,
                        name: true,
                        status: true,
                        sentAt: true
                    }
                }
            }
        })

        if (!segment) {
            return NextResponse.json(
                { error: 'Segment not found' },
                { status: 404 }
            )
        }

        // Recalculate user count
        const userCount = await calculateSegmentUserCount(segment.criteria as any)

        return NextResponse.json({
            ...segment,
            userCount
        })
    } catch (error) {
        console.error('Failed to fetch user segment:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id: segmentId } = await params
        const body = await request.json()
        const validatedData = updateSegmentSchema.parse(body)

        // Check if segment exists
        const existingSegment = await prisma.userSegment.findUnique({
            where: { id: segmentId }
        })

        if (!existingSegment) {
            return NextResponse.json(
                { error: 'Segment not found' },
                { status: 404 }
            )
        }

        // Recalculate user count if criteria changed
        let userCount = existingSegment.userCount
        if (validatedData.criteria) {
            userCount = await calculateSegmentUserCount(validatedData.criteria)
        }

        const updatedSegment = await prisma.userSegment.update({
            where: { id: segmentId },
            data: {
                ...validatedData,
                userCount
            },
            include: {
                creator: {
                    select: { name: true, email: true }
                }
            }
        })

        return NextResponse.json(updatedSegment)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.issues },
                { status: 400 }
            )
        }

        console.error('Failed to update user segment:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id: segmentId } = await params

        // Check if segment exists and is not used by active campaigns
        const segment = await prisma.userSegment.findUnique({
            where: { id: segmentId },
            include: {
                campaigns: {
                    where: {
                        status: {
                            in: ['DRAFT', 'SCHEDULED', 'SENDING']
                        }
                    }
                }
            }
        })

        if (!segment) {
            return NextResponse.json(
                { error: 'Segment not found' },
                { status: 404 }
            )
        }

        if (segment.campaigns.length > 0) {
            return NextResponse.json(
                { error: 'Cannot delete segment that is used by active campaigns' },
                { status: 400 }
            )
        }

        await prisma.userSegment.delete({
            where: { id: segmentId }
        })

        return NextResponse.json({ message: 'Segment deleted successfully' })
    } catch (error) {
        console.error('Failed to delete user segment:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// Helper function to calculate user count for a segment
async function calculateSegmentUserCount(criteria: any[]): Promise<number> {
    try {
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
                if (criterion.value?.field === 'lastPostDate') {
                    const daysAgo = new Date()
                    daysAgo.setDate(daysAgo.getDate() - criterion.value.days)
                    where.createdAt = { gte: daysAgo }
                }
                break

            case 'subscription':
                if (criterion.operator === 'equals') {
                    where.subscriptions = {
                        some: {
                            status: 'active'
                        }
                    }
                }
                break

            case 'engagement':
                // Add engagement-based filtering logic here
                break

            case 'demographic':
                if (criterion.value?.field && criterion.value?.value) {
                    where[criterion.value.field] = criterion.value.value
                }
                break
        }
    }

    return where
}