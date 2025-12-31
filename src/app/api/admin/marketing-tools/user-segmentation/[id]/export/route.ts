import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

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

        // Fetch segment
        const segment = await prisma.userSegment.findUnique({
            where: { id: segmentId }
        })

        if (!segment) {
            return NextResponse.json(
                { error: 'Segment not found' },
                { status: 404 }
            )
        }

        // Build where clause from segment criteria
        const whereClause = buildWhereClause(segment.criteria as any[])

        // Fetch users matching the segment criteria
        // Note: In production, you might want to limit this or add pagination
        // Also, ensure GDPR compliance - only export necessary data
        const users = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
                // Add last login if you have that field
                // lastLogin: true,
                // Add subscription status
                subscriptions: {
                    where: { status: 'active' },
                    select: { type: true }
                }
            },
            take: 10000 // Limit to prevent huge exports
        })

        // Generate CSV
        const csvHeader = 'User ID,Email,Name,Join Date,Subscription Status\n'
        const csvRows = users.map(user => {
            const joinDate = user.createdAt.toISOString().split('T')[0]
            const subscriptionStatus = user.subscriptions.length > 0
                ? user.subscriptions[0].type
                : 'free'
            return `${user.id},${user.email},${user.name},${joinDate},${subscriptionStatus}`
        }).join('\n')

        const csvContent = csvHeader + csvRows

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="segment_${segmentId}_${segment.name.toLowerCase().replace(/\s+/g, '_')}.csv"`
            }
        })
    } catch (error) {
        console.error('Error exporting user segment:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
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