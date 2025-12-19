import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET - Fetch all safety reports with filters
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status') || 'all'
        const type = searchParams.get('type') || 'all'
        const priority = searchParams.get('priority') || 'all'
        const search = searchParams.get('search') || ''
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')

        // Build where clause
        const where: any = {}

        if (status !== 'all') {
            where.status = status.toUpperCase()
        }

        if (type !== 'all') {
            where.type = type.toUpperCase()
        }

        if (search) {
            where.OR = [
                { reason: { contains: search, mode: 'insensitive' } },
                { targetId: { contains: search, mode: 'insensitive' } },
            ]
        }

        // Fetch reports with pagination
        const [reports, totalCount] = await Promise.all([
            prisma.report.findMany({
                where,
                include: {
                    reporter: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            profileImage: true,
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.report.count({ where })
        ])

        // Map reports to include priority (derived from type)
        const reportsWithPriority = reports.map(report => {
            let priority = 'medium'
            if (['HARASSMENT', 'ABUSE'].includes(report.type.toUpperCase())) {
                priority = 'critical'
            } else if (['SPAM', 'COPYRIGHT'].includes(report.type.toUpperCase())) {
                priority = 'high'
            } else if (['INAPPROPRIATE'].includes(report.type.toUpperCase())) {
                priority = 'medium'
            } else {
                priority = 'low'
            }

            return {
                ...report,
                priority,
                reportedUser: report.targetId,
                reportedBy: report.reporter.name,
                description: report.reason,
                contentType: report.type.toLowerCase(),
            }
        })

        // Get stats
        const stats = await prisma.report.groupBy({
            by: ['status'],
            _count: true
        })

        const statsMap = Object.fromEntries(
            stats.map(s => [s.status.toLowerCase(), s._count])
        )

        return NextResponse.json({
            reports: reportsWithPriority,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit)
            },
            stats: {
                pending: statsMap['pending'] || 0,
                reviewing: statsMap['reviewing'] || 0,
                resolved: statsMap['resolved'] || 0,
                dismissed: statsMap['dismissed'] || 0,
                total: totalCount
            }
        })
    } catch (error) {
        console.error('Error fetching reports:', error)
        return NextResponse.json(
            { error: 'Failed to fetch reports' },
            { status: 500 }
        )
    }
}

// PATCH - Update report status
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { reportId, status, resolution } = body

        if (!reportId || !status) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const updatedReport = await prisma.report.update({
            where: { id: reportId },
            data: {
                status: status.toUpperCase(),
                resolution,
                updatedAt: new Date()
            }
        })

        // Log admin action
        await prisma.adminAuditLog.create({
            data: {
                adminId: session.user.id,
                adminName: session.user.name || 'Unknown',
                adminEmail: session.user.email || '',
                action: 'UPDATE_REPORT_STATUS',
                module: 'SAFETY',
                details: `Changed report ${reportId} status to ${status}`,
                metadata: { reportId, status, resolution }
            }
        })

        return NextResponse.json({ success: true, report: updatedReport })
    } catch (error) {
        console.error('Error updating report:', error)
        return NextResponse.json(
            { error: 'Failed to update report' },
            { status: 500 }
        )
    }
}
