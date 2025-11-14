import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export async function GET(request: NextRequest) {
    try {
        // Verify admin authentication
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        // Get user from database
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!currentUser || currentUser.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            )
        }

        // Extract query parameters for filtering and pagination
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const search = searchParams.get('search') || ''
        const role = searchParams.get('role') || ''
        const status = searchParams.get('status') || ''
        const sortBy = searchParams.get('sortBy') || 'createdAt'
        const sortOrder = searchParams.get('sortOrder') || 'desc'

        // Build where clause for filtering
        const where: any = {}

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { arabicName: { contains: search, mode: 'insensitive' } },
            ]
        }

        if (role && role !== 'all') {
            where.role = role as UserRole
        }

        if (status && status !== 'all') {
            switch (status) {
                case 'verified':
                    where.emailVerified = { not: null }
                    break
                case 'unverified':
                    where.emailVerified = null
                    break
                case 'completed':
                    where.onboardingCompleted = true
                    break
                case 'incomplete':
                    where.onboardingCompleted = false
                    break
            }
        }

        // Build orderBy clause
        const orderBy: any = {}
        if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
            orderBy[sortBy] = sortOrder
        } else if (sortBy === 'name' || sortBy === 'email') {
            orderBy[sortBy] = sortOrder
        } else {
            orderBy.createdAt = 'desc' // default
        }

        // Get users with counts
        const users = await prisma.user.findMany({
            where,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
            include: {
                _count: {
                    select: {
                        enrollments: true,
                    }
                },
                creator: {
                    select: {
                        _count: {
                            select: {
                                courses: true,
                            }
                        }
                    }
                }
            }
        })

        // Get total count for pagination
        const totalUsers = await prisma.user.count({ where })

        // Get role-based statistics
        const roleStats = await prisma.user.groupBy({
            by: ['role'],
            _count: {
                id: true
            }
        })

        // Get verification statistics
        const verificationStats = await prisma.user.aggregate({
            _count: {
                id: true,
                emailVerified: true,
                phoneVerified: true,
            }
        })

        // Get recent registrations (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const recentRegistrations = await prisma.user.count({
            where: {
                createdAt: {
                    gte: thirtyDaysAgo
                }
            }
        })

        return NextResponse.json({
            users,
            pagination: {
                page,
                limit,
                total: totalUsers,
                pages: Math.ceil(totalUsers / limit)
            },
            statistics: {
                total: totalUsers,
                byRole: roleStats.reduce((acc, stat) => ({
                    ...acc,
                    [stat.role]: stat._count.id
                }), {}),
                emailVerified: verificationStats._count.emailVerified || 0,
                phoneVerified: verificationStats._count.phoneVerified || 0,
                recentRegistrations
            }
        })

    } catch (error) {
        console.error('Admin users API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        // Verify admin authentication
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        // Get user from database
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!currentUser || currentUser.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            )
        }

        // TODO: Handle user creation from admin panel
        return NextResponse.json(
            { error: 'User creation not implemented yet' },
            { status: 501 }
        )

    } catch (error) {
        console.error('Admin users POST API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
