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

        // Get export format from query params
        const { searchParams } = new URL(request.url)
        const format = searchParams.get('format') || 'csv'
        const roleFilter = searchParams.get('role') || ''
        const statusFilter = searchParams.get('status') || ''

        // Build where clause
        const where: any = {}

        if (roleFilter && roleFilter !== 'all') {
            where.role = roleFilter as UserRole
        }

        if (statusFilter && statusFilter !== 'all') {
            switch (statusFilter) {
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

        // Fetch all users matching filters
        const users = await prisma.user.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        })

        // Get creator data separately for creator users
        const creatorUserIds = users.filter(u => u.role === 'CREATOR').map(u => u.id)
        const creators = creatorUserIds.length > 0 
            ? await prisma.creator.findMany({
                where: { userId: { in: creatorUserIds } },
                include: {
                    _count: { select: { courses: true } }
                }
            })
            : []
        
        // Get enrollment counts
        const enrollmentCounts = await prisma.enrollment.groupBy({
            by: ['userId'],
            where: { userId: { in: users.map(u => u.id) } },
            _count: { id: true }
        })

        // Create lookup maps
        const creatorMap = new Map(creators.map(c => [c.userId, c]))
        const enrollmentMap = new Map(enrollmentCounts.map(e => [e.userId, e._count.id]))

        if (format === 'csv') {
            // Generate CSV
            const headers = [
                'ID',
                'Name',
                'Arabic Name',
                'Email',
                'Role',
                'Email Verified',
                'Phone',
                'Phone Verified',
                'Onboarding Completed',
                'Bio',
                'Enrollments',
                'Courses (Creator)',
                'Total Subscribers (Creator)',
                'Total Earnings (Creator)',
                'Created At',
                'Updated At'
            ]

            const rows = users.map(user => {
                const creator = creatorMap.get(user.id)
                const enrollments = enrollmentMap.get(user.id) || 0
                return [
                    user.id,
                    escapeCsvField(user.name),
                    escapeCsvField(user.arabicName || ''),
                    user.email,
                    user.role,
                    user.emailVerified ? 'Yes' : 'No',
                    user.phone || '',
                    user.phoneVerified ? 'Yes' : 'No',
                    user.onboardingCompleted ? 'Yes' : 'No',
                    escapeCsvField(user.bio || ''),
                    enrollments,
                    creator?._count.courses || 0,
                    creator?.totalSubscribers || 0,
                    creator?.totalEarnings || 0,
                    formatDate(user.createdAt),
                    formatDate(user.updatedAt)
                ]
            })

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.join(','))
            ].join('\n')

            const filename = `users-export-${new Date().toISOString().split('T')[0]}.csv`

            return new NextResponse(csvContent, {
                headers: {
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': `attachment; filename="${filename}"`,
                }
            })
        } else if (format === 'json') {
            // Generate JSON
            const jsonData = users.map(user => {
                const creator = creatorMap.get(user.id)
                const enrollments = enrollmentMap.get(user.id) || 0
                return {
                    id: user.id,
                    name: user.name,
                    arabicName: user.arabicName,
                    email: user.email,
                    role: user.role,
                    emailVerified: !!user.emailVerified,
                    phone: user.phone,
                    phoneVerified: !!user.phoneVerified,
                    onboardingCompleted: user.onboardingCompleted,
                    bio: user.bio,
                    enrollments,
                    creatorInfo: creator ? {
                        expertise: creator.expertise,
                        kycStatus: creator.kycStatus,
                        courses: creator._count.courses,
                        totalSubscribers: creator.totalSubscribers,
                        totalEarnings: creator.totalEarnings
                    } : null,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                }
            })

            const filename = `users-export-${new Date().toISOString().split('T')[0]}.json`

            return new NextResponse(JSON.stringify(jsonData, null, 2), {
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Content-Disposition': `attachment; filename="${filename}"`,
                }
            })
        } else {
            return NextResponse.json(
                { error: 'Invalid format. Use csv or json' },
                { status: 400 }
            )
        }

    } catch (error) {
        console.error('Admin users export API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

function escapeCsvField(field: string): string {
    if (!field) return ''
    // Escape quotes and wrap in quotes if contains comma, newline, or quote
    if (field.includes(',') || field.includes('\n') || field.includes('"')) {
        return `"${field.replace(/"/g, '""')}"`
    }
    return field
}

function formatDate(date: Date): string {
    return date.toISOString().split('T')[0]
}
