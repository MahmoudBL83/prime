import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole, KYCStatus } from '@prisma/client'
import { hash } from 'bcryptjs'

const MIN_PASSWORD = 8

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
        const kycStatus = searchParams.get('kycStatus') || ''
        const status = searchParams.get('status') || ''
        const sortBy = searchParams.get('sortBy') || 'createdAt'
        const sortOrder = searchParams.get('sortOrder') || 'desc'

        // Build where clause for filtering
        const where: any = {}

        if (search) {
            where.OR = [
                { user: { name: { contains: search, mode: 'insensitive' } } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
                { user: { arabicName: { contains: search, mode: 'insensitive' } } },
                { expertise: { contains: search, mode: 'insensitive' } },
            ]
        }

        if (kycStatus && kycStatus !== 'all') {
            where.kycStatus = kycStatus as KYCStatus
        }

        if (status && status !== 'all') {
            switch (status) {
                case 'verified':
                    where.user = { emailVerified: { not: null } }
                    break
                case 'contracted':
                    where.contractSigned = true
                    break
                case 'active':
                    where.courses = { some: {} }
                    break
            }
        }

        // Build orderBy clause
        const orderBy: any = {}
        if (sortBy === 'name') {
            orderBy.user = { name: sortOrder }
        } else if (sortBy === 'earnings') {
            orderBy.totalEarnings = sortOrder
        } else if (sortBy === 'subscribers') {
            orderBy.totalSubscribers = sortOrder
        } else if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
            orderBy[sortBy] = sortOrder
        } else {
            orderBy.createdAt = 'desc' // default
        }

        // Get creators with user details and course counts
        const creators = await prisma.creator.findMany({
            where,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
            include: {
                user: true,
                _count: {
                    select: {
                        courses: true,
                    }
                }
            }
        })

        // Get total count for pagination
        const totalCreators = await prisma.creator.count({ where })

        // Get KYC status statistics
        const kycStats = await prisma.creator.groupBy({
            by: ['kycStatus'],
            _count: {
                id: true
            }
        })

        // Get performance statistics
        const performanceStats = await prisma.creator.aggregate({
            _sum: {
                totalEarnings: true,
                totalSubscribers: true,
            },
            _avg: {
                totalEarnings: true,
                totalSubscribers: true,
            },
            _count: {
                id: true
            }
        })

        // Get creators with courses count
        const creatorsWithCourses = await prisma.creator.count({
            where: {
                courses: {
                    some: {}
                }
            }
        })

        // Get recent creator registrations (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const recentCreators = await prisma.creator.count({
            where: {
                createdAt: {
                    gte: thirtyDaysAgo
                }
            }
        })

        return NextResponse.json({
            creators,
            pagination: {
                page,
                limit,
                total: totalCreators,
                pages: Math.ceil(totalCreators / limit)
            },
            statistics: {
                total: totalCreators,
                byKycStatus: kycStats.reduce((acc, stat) => ({
                    ...acc,
                    [stat.kycStatus]: stat._count.id
                }), {}),
                totalEarnings: performanceStats._sum.totalEarnings || 0,
                totalSubscribers: performanceStats._sum.totalSubscribers || 0,
                averageEarnings: performanceStats._avg.totalEarnings || 0,
                averageSubscribers: performanceStats._avg.totalSubscribers || 0,
                activeCreators: creatorsWithCourses,
                recentRegistrations: recentCreators
            }
        })

    } catch (error) {
        console.error('Admin creators API error:', error)
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

        const body = await request.json()
        const {
            name,
            email,
            password,
            expertise,
            teachingGoals,
            kycStatus,
            contractSigned,
            phone,
            arabicName
        } = body

        if (!name || !email || !password) {
            return NextResponse.json(
                { error: 'Name, email, and password are required' },
                { status: 400 }
            )
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            )
        }

        if (password.length < MIN_PASSWORD) {
            return NextResponse.json(
                { error: `Password must be at least ${MIN_PASSWORD} characters` },
                { status: 400 }
            )
        }

        const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
        if (existingUser) {
            return NextResponse.json(
                { error: 'A user with this email already exists' },
                { status: 409 }
            )
        }

        const passwordHash = await hash(password, 12)

        const creator = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    name: name.trim(),
                    email: email.toLowerCase().trim(),
                    passwordHash,
                    role: UserRole.CREATOR,
                    arabicName: arabicName?.trim() || null,
                    phone: phone?.trim() || null,
                    onboardingCompleted: true,
                    emailVerified: new Date()
                }
            })

            const createdCreator = await tx.creator.create({
                data: {
                    userId: user.id,
                    expertise: expertise?.trim() || null,
                    teachingGoals: teachingGoals?.trim() || null,
                    kycStatus: (kycStatus as KYCStatus) || KYCStatus.NOT_STARTED,
                    contractSigned: Boolean(contractSigned),
                    contractSignedAt: contractSigned ? new Date() : null
                }
            })

            await tx.adminAuditLog.create({
                data: {
                    adminId: currentUser.id,
                    adminName: currentUser.name,
                    adminEmail: currentUser.email,
                    action: 'ADMIN_CREATE_CREATOR',
                    module: 'Creators',
                    details: `Created creator ${email}`,
                    status: 'SUCCESS'
                }
            })

            return createdCreator
        })

        return NextResponse.json({ success: true, creator }, { status: 201 })

    } catch (error) {
        console.error('Admin creators POST API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
