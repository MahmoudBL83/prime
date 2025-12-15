import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

/**
 * Feature Flags API for Admin - Database Driven
 * Manage feature flags for A/B testing and gradual rollouts
 * GET/POST/PATCH/DELETE /api/admin/feature-flags
 */

const featureFlagSchema = z.object({
    key: z.string().min(1).max(100),
    name: z.string().min(1).max(200),
    description: z.string().optional(),
    enabled: z.boolean().default(false),
    rolloutPercent: z.number().min(0).max(100).default(100),
    targetRoles: z.array(z.string()).optional(),
    targetUsers: z.array(z.string()).optional(),
    environment: z.string().default('production'),
    metadata: z.record(z.any()).optional()
})

// GET: List all feature flags or check specific flag
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        const { searchParams } = new URL(request.url)
        const checkFlag = searchParams.get('check')
        const userId = searchParams.get('userId')

        // If checking a specific flag for a user (can be called without admin auth)
        if (checkFlag && userId) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, role: true, featureFlags: true }
            })

            if (!user) {
                return NextResponse.json({ enabled: false })
            }

            // Check user's custom flags first
            const userFlags = (user.featureFlags as Record<string, boolean>) || {}
            if (checkFlag in userFlags) {
                return NextResponse.json({ enabled: userFlags[checkFlag] })
            }

            // Check database flags
            const flag = await prisma.featureFlag.findUnique({
                where: { key: checkFlag }
            })

            if (!flag || !flag.enabled) {
                return NextResponse.json({ enabled: false })
            }

            // Check role targeting
            if (flag.targetRoles.length > 0 && !flag.targetRoles.includes(user.role)) {
                return NextResponse.json({ enabled: false })
            }

            // Check user targeting
            if (flag.targetUsers.length > 0 && !flag.targetUsers.includes(user.id)) {
                return NextResponse.json({ enabled: false })
            }

            // Check rollout percentage
            if (flag.rolloutPercent < 100) {
                const hash = userId.split('').reduce((a, b) => {
                    a = ((a << 5) - a) + b.charCodeAt(0)
                    return a & a
                }, 0)
                const percentage = Math.abs(hash % 100)
                return NextResponse.json({ enabled: percentage < flag.rolloutPercent })
            }

            return NextResponse.json({ enabled: true })
        }

        // Admin-only: return all flags
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const flags = await prisma.featureFlag.findMany({
            orderBy: { createdAt: 'desc' }
        })

        const stats = {
            total: flags.length,
            enabled: flags.filter(f => f.enabled).length,
            disabled: flags.filter(f => !f.enabled).length
        }

        return NextResponse.json({ flags, stats })
    } catch (error) {
        console.error('Feature flags GET error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch feature flags' },
            { status: 500 }
        )
    }
}

// POST: Create new feature flag
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const parsed = featureFlagSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
        }

        // Check if key already exists
        const exists = await prisma.featureFlag.findUnique({
            where: { key: parsed.data.key }
        })

        if (exists) {
            return NextResponse.json(
                { error: 'Feature flag with this key already exists' },
                { status: 400 }
            )
        }

        const flag = await prisma.featureFlag.create({
            data: {
                key: parsed.data.key,
                name: parsed.data.name,
                description: parsed.data.description,
                enabled: parsed.data.enabled,
                rolloutPercent: parsed.data.rolloutPercent,
                targetRoles: parsed.data.targetRoles || [],
                targetUsers: parsed.data.targetUsers || [],
                environment: parsed.data.environment,
                metadata: parsed.data.metadata || {},
                createdBy: session.user.id
            }
        })

        // Log action
        await prisma.adminAuditLog.create({
            data: {
                adminId: session.user.id,
                action: 'CREATE_FEATURE_FLAG',
                module: 'Feature Flags',
                details: `Created feature flag: ${flag.name} (${flag.key})`,
                status: 'SUCCESS',
                targetId: flag.id,
                targetType: 'FEATURE_FLAG'
            }
        })

        return NextResponse.json({
            flag,
            message: 'Feature flag created successfully'
        }, { status: 201 })
    } catch (error) {
        console.error('Feature flags POST error:', error)
        return NextResponse.json(
            { error: 'Failed to create feature flag' },
            { status: 500 }
        )
    }
}

// PATCH: Update feature flag
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { id, ...updates } = body

        if (!id) {
            return NextResponse.json(
                { error: 'Flag ID is required' },
                { status: 400 }
            )
        }

        const existing = await prisma.featureFlag.findUnique({
            where: { id }
        })

        if (!existing) {
            return NextResponse.json({ error: 'Feature flag not found' }, { status: 404 })
        }

        const flag = await prisma.featureFlag.update({
            where: { id },
            data: {
                ...(updates.name && { name: updates.name }),
                ...(updates.description !== undefined && { description: updates.description }),
                ...(updates.enabled !== undefined && { enabled: updates.enabled }),
                ...(updates.rolloutPercent !== undefined && { rolloutPercent: updates.rolloutPercent }),
                ...(updates.targetRoles && { targetRoles: updates.targetRoles }),
                ...(updates.targetUsers && { targetUsers: updates.targetUsers }),
                ...(updates.environment && { environment: updates.environment }),
                ...(updates.metadata && { metadata: updates.metadata })
            }
        })

        // Log action
        await prisma.adminAuditLog.create({
            data: {
                adminId: session.user.id,
                action: 'UPDATE_FEATURE_FLAG',
                module: 'Feature Flags',
                details: `Updated feature flag: ${flag.name}. Changes: ${JSON.stringify(updates)}`,
                status: 'SUCCESS',
                targetId: flag.id,
                targetType: 'FEATURE_FLAG',
                metadata: {
                    changes: updates,
                    previousState: existing
                }
            }
        })

        return NextResponse.json({
            flag,
            message: 'Feature flag updated successfully'
        })
    } catch (error) {
        console.error('Feature flags PATCH error:', error)
        return NextResponse.json(
            { error: 'Failed to update feature flag' },
            { status: 500 }
        )
    }
}

// DELETE: Remove feature flag
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json(
                { error: 'Flag ID is required' },
                { status: 400 }
            )
        }

        const existing = await prisma.featureFlag.findUnique({
            where: { id }
        })

        if (!existing) {
            return NextResponse.json({ error: 'Feature flag not found' }, { status: 404 })
        }

        await prisma.featureFlag.delete({
            where: { id }
        })

        // Log action
        await prisma.adminAuditLog.create({
            data: {
                adminId: session.user.id,
                action: 'DELETE_FEATURE_FLAG',
                module: 'Feature Flags',
                details: `Deleted feature flag: ${existing.name} (${existing.key})`,
                status: 'SUCCESS',
                targetId: id,
                targetType: 'FEATURE_FLAG',
                metadata: { deletedFlag: existing }
            }
        })

        return NextResponse.json({
            message: 'Feature flag deleted successfully'
        })
    } catch (error) {
        console.error('Feature flags DELETE error:', error)
        return NextResponse.json(
            { error: 'Failed to delete feature flag' },
            { status: 500 }
        )
    }
}
