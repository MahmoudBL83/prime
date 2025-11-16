import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/applications
 * Get all creator applications for review
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status') || 'all'
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const skip = (page - 1) * limit

        // Build where clause
        const where: any = {}
        if (status !== 'all') {
            where.status = status.toUpperCase()
        }

        // Fetch applications and total count
        const [applications, total] = await Promise.all([
            prisma.creatorApplication.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.creatorApplication.count({ where })
        ])

        // Fetch user data for each application
        const userIds = applications.map(app => app.userId)
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: {
                id: true,
                name: true,
                email: true,
                arabicName: true,
                profileImage: true,
                createdAt: true
            }
        })

        // Map users to applications
        const applicationsWithUsers = applications.map(application => ({
            ...application,
            user: users.find(user => user.id === application.userId)
        }))

        // Get statistics
        const stats = await prisma.creatorApplication.groupBy({
            by: ['status'],
            _count: true
        })

        const statusCounts = stats.reduce((acc, stat) => {
            acc[stat.status] = stat._count
            return acc
        }, {} as Record<string, number>)

        return NextResponse.json({
            success: true,
            data: {
                applications: applicationsWithUsers,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                },
                stats: {
                    total,
                    pending: statusCounts['PENDING'] || 0,
                    underReview: statusCounts['UNDER_REVIEW'] || 0,
                    approved: statusCounts['APPROVED'] || 0,
                    rejected: statusCounts['REJECTED'] || 0,
                    resubmitRequired: statusCounts['RESUBMIT_REQUIRED'] || 0
                }
            }
        })
    } catch (error) {
        console.error('Error fetching applications:', error)
        return NextResponse.json(
            { error: 'Failed to fetch applications' },
            { status: 500 }
        )
    }
}
