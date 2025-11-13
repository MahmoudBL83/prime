import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
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

        // Fetch applications with user data
        const [applications, total] = await Promise.all([
            prisma.creatorApplication.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            arabicName: true,
                            profileImage: true,
                            createdAt: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.creatorApplication.count({ where })
        ])

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
                applications,
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
