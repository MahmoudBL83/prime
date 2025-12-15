import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Admin Audit Log API
 * GET: View audit logs with filtering and pagination
 */

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const action = searchParams.get('action')
        const module = searchParams.get('module')
        const adminId = searchParams.get('adminId')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const targetType = searchParams.get('targetType')
        const search = searchParams.get('search')

        const where: any = {}

        if (action) {
            where.action = { contains: action, mode: 'insensitive' }
        }

        if (module) {
            where.module = { equals: module, mode: 'insensitive' }
        }

        if (adminId) {
            where.adminId = adminId
        }

        if (targetType) {
            where.targetType = { equals: targetType, mode: 'insensitive' }
        }

        if (startDate || endDate) {
            where.createdAt = {}
            if (startDate) {
                where.createdAt.gte = new Date(startDate)
            }
            if (endDate) {
                where.createdAt.lte = new Date(endDate)
            }
        }

        if (search) {
            where.OR = [
                { action: { contains: search, mode: 'insensitive' } },
                { details: { contains: search, mode: 'insensitive' } },
                { module: { contains: search, mode: 'insensitive' } }
            ]
        }

        const [total, logs] = await Promise.all([
            prisma.adminAuditLog.count({ where }),
            prisma.adminAuditLog.findMany({
                where,
                include: {
                    admin: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            profileImage: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            })
        ])

        // Get unique modules and actions for filters
        const [modules, actions, admins] = await Promise.all([
            prisma.adminAuditLog.groupBy({
                by: ['module'],
                _count: true,
                orderBy: { _count: { module: 'desc' } },
                take: 20
            }),
            prisma.adminAuditLog.groupBy({
                by: ['action'],
                _count: true,
                orderBy: { _count: { action: 'desc' } },
                take: 30
            }),
            prisma.adminAuditLog.groupBy({
                by: ['adminId'],
                _count: true
            }).then(async groups => {
                const adminIds = groups.map(g => g.adminId)
                return prisma.user.findMany({
                    where: { id: { in: adminIds } },
                    select: { id: true, name: true, email: true }
                })
            })
        ])

        // Get activity stats
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)

        const [todayCount, weekCount] = await Promise.all([
            prisma.adminAuditLog.count({
                where: { createdAt: { gte: today } }
            }),
            prisma.adminAuditLog.count({
                where: { createdAt: { gte: weekAgo } }
            })
        ])

        return NextResponse.json({
            logs: logs.map(log => ({
                id: log.id,
                action: log.action,
                module: log.module,
                details: log.details,
                status: log.status,
                targetId: log.targetId,
                targetType: log.targetType,
                ipAddress: log.ipAddress,
                userAgent: log.userAgent,
                metadata: log.metadata,
                createdAt: log.createdAt,
                admin: log.admin
            })),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            },
            filters: {
                modules: modules.map(m => ({ name: m.module, count: m._count })),
                actions: actions.map(a => ({ name: a.action, count: a._count })),
                admins
            },
            stats: {
                total,
                todayCount,
                weekCount
            }
        })
    } catch (error) {
        console.error('Audit log GET error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch audit logs' },
            { status: 500 }
        )
    }
}
