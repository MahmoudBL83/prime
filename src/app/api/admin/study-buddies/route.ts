import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma, UserRole } from '@prisma/client'
import { z } from 'zod'
import type { Session } from 'next-auth'

/**
 * Admin Study Buddy Management API
 * GET: List all matches with filters, search, pagination
 * PATCH: Update match status
 * POST: Moderation actions (block, unmatch, warn, resolve)
 * DELETE: Delete match permanently
 */

const updateSchema = z.object({
    matchId: z.string().min(1),
    status: z.string().min(2).optional(),
    sharedSubjects: z.array(z.string()).optional(),
    sharedGoals: z.array(z.string()).optional()
})

const moderationSchema = z.object({
    matchId: z.string().min(1),
    action: z.enum(['block', 'unmatch', 'warn', 'resolve', 'reactivate']),
    reason: z.string().optional(),
    notifyUsers: z.boolean().default(true),
    blockBothUsers: z.boolean().default(false)
})

const matchInclude = {
    user1: {
        select: {
            id: true,
            name: true,
            email: true,
            interests: true,
            studyBuddyPreferences: true
        }
    },
    user2: {
        select: {
            id: true,
            name: true,
            email: true,
            interests: true,
            studyBuddyPreferences: true
        }
    },
    studySessions: {
        select: {
            id: true,
            status: true,
            scheduledAt: true,
            completedAt: true
        }
    }
} satisfies Prisma.StudyBuddyMatchInclude

type MatchWithRelations = Prisma.StudyBuddyMatchGetPayload<{ include: typeof matchInclude }>

function assertAdmin(session: Session | null): asserts session is Session {
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
        throw new Error('UNAUTHORIZED')
    }
}

function parseJsonArray(raw?: string | null) {
    if (!raw) return [] as string[]
    try {
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return [] as string[]
    }
}

function calculateCompatibility(sharedSubjects: string[], sharedGoals: string[], completedSessions: number) {
    const base = 40
    const subjectScore = Math.min(sharedSubjects.length * 10, 30)
    const goalScore = Math.min(sharedGoals.length * 10, 30)
    const sessionScore = Math.min(completedSessions * 5, 20)
    return Math.min(base + subjectScore + goalScore + sessionScore, 99)
}

function normalizeStatus(status: string | null) {
    if (!status) return 'unknown'
    return status.trim().toLowerCase()
}

function mapMatch(match: NonNullable<MatchWithRelations>) {
    const sharedSubjects = parseJsonArray(match.sharedSubjects)
    const sharedGoals = parseJsonArray(match.sharedGoals)
    const completedSessions = match.studySessions.filter(s => s.status === 'COMPLETED').length
    const compatibilityScore = calculateCompatibility(sharedSubjects, sharedGoals, completedSessions)

    return {
        id: match.id,
        status: normalizeStatus(match.status),
        rawStatus: match.status,
        matchedAt: match.createdAt.toISOString(),
        lastActivity: match.updatedAt.toISOString(),
        sharedSubjects,
        sharedGoals,
        compatibilityScore,
        sessionsCompleted: completedSessions,
        user1: {
            id: match.user1.id,
            name: match.user1.name ?? 'Learner',
            email: match.user1.email,
            interests: parseJsonArray(match.user1.interests)
        },
        user2: {
            id: match.user2.id,
            name: match.user2.name ?? 'Learner',
            email: match.user2.email,
            interests: parseJsonArray(match.user2.interests)
        },
        studySessions: match.studySessions.map(session => ({
            id: session.id,
            status: session.status,
            scheduledAt: session.scheduledAt.toISOString(),
            completedAt: session.completedAt?.toISOString() ?? null
        }))
    }
}

// GET: List all matches with filters
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        assertAdmin(session)

        const searchParams = request.nextUrl.searchParams
        const statusFilter = searchParams.get('status')
        const search = searchParams.get('search')
        const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1)
        const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '50', 10), 1), 100)

        const where: any = {}
        if (statusFilter) {
            const normalized = statusFilter.toLowerCase()
            if (normalized === 'reported') {
                where.OR = [
                    { status: { contains: 'block' } },
                    { status: { contains: 'report' } }
                ]
            } else {
                where.status = { equals: statusFilter }
            }
        }
        if (search) {
            where.OR = [
                { user1: { name: { contains: search } } },
                { user2: { name: { contains: search } } }
            ]
        }

        const [total, matches] = await Promise.all([
            prisma.studyBuddyMatch.count({ where }),
            prisma.studyBuddyMatch.findMany({
                where,
                include: matchInclude,
                orderBy: { updatedAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize
            })
        ])

        const mapped = matches.map(mapMatch)
        const activeMatches = mapped.filter(m => ['active', 'accepted'].includes(m.status)).length
        const reportedMatches = mapped.filter(m => m.status.includes('report') || m.status.includes('block')).length
        const avgCompatibility = total ? Math.round(mapped.reduce((sum, m) => sum + m.compatibilityScore, 0) / mapped.length) : 0
        const avgSessions = total ? Number((mapped.reduce((sum, m) => sum + m.sessionsCompleted, 0) / mapped.length).toFixed(1)) : 0
        const matchSuccessRate = total ? Math.round((activeMatches / mapped.length) * 100) : 0

        return NextResponse.json({
            matches: mapped,
            meta: { total, page, pageSize },
            stats: {
                totalMatches: total,
                activeMatches,
                reportedMatches,
                avgCompatibility,
                avgSessions,
                matchSuccessRate
            }
        })
    } catch (error) {
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        console.error('Admin study buddy matches error:', error)
        return NextResponse.json({ error: 'Failed to load matches' }, { status: 500 })
    }
}

// POST: Moderation actions
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        assertAdmin(session)

        const body = await request.json()
        const parsed = moderationSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
        }

        const { matchId, action, reason, notifyUsers, blockBothUsers } = parsed.data

        const match = await prisma.studyBuddyMatch.findUnique({
            where: { id: matchId },
            include: matchInclude
        })

        if (!match) {
            return NextResponse.json({ error: 'Match not found' }, { status: 404 })
        }

        let newStatus = match.status
        let moderationEventType: 'ONBOARDING_REVIEW' | 'CHAT_FLAG' | 'CONTENT_FLAG' | 'BEHAVIOR_FLAG' = 'BEHAVIOR_FLAG'
        let notificationTitle = ''
        let notificationMessage = ''

        switch (action) {
            case 'block': {
                newStatus = 'BLOCKED'
                moderationEventType = 'BEHAVIOR_FLAG'
                notificationTitle = 'Study Buddy Match Blocked'
                notificationMessage = `Your study buddy match has been blocked by admin. ${reason ? `Reason: ${reason}` : ''}`

                // If blocking both users from matching again
                if (blockBothUsers) {
                    await prisma.userBlock.createMany({
                        data: [
                            { blockerId: match.user1Id, blockedId: match.user2Id },
                            { blockerId: match.user2Id, blockedId: match.user1Id }
                        ],
                        skipDuplicates: true
                    })
                }
                break
            }

            case 'unmatch': {
                newStatus = 'UNMATCHED'
                moderationEventType = 'BEHAVIOR_FLAG'
                notificationTitle = 'Study Buddy Unmatched'
                notificationMessage = `Your study buddy match has been dissolved. ${reason ? `Reason: ${reason}` : ''}`
                break
            }

            case 'warn': {
                moderationEventType = 'BEHAVIOR_FLAG'
                notificationTitle = 'Study Buddy Warning'
                notificationMessage = `You have received a warning regarding your study buddy interactions. ${reason || 'Please follow community guidelines.'}`
                // Don't change status, just log and notify
                break
            }

            case 'resolve': {
                newStatus = 'ACTIVE'
                moderationEventType = 'BEHAVIOR_FLAG'
                notificationTitle = 'Match Issue Resolved'
                notificationMessage = 'The reported issue with your study buddy match has been resolved.'
                break
            }

            case 'reactivate': {
                newStatus = 'ACTIVE'
                moderationEventType = 'BEHAVIOR_FLAG'
                notificationTitle = 'Match Reactivated'
                notificationMessage = 'Your study buddy match has been reactivated.'
                break
            }
        }

        // Update match status
        if (newStatus !== match.status) {
            await prisma.studyBuddyMatch.update({
                where: { id: matchId },
                data: { status: newStatus }
            })
        }

        // Create moderation events for both users
        await prisma.moderationEvent.createMany({
            data: [
                {
                    userId: match.user1Id,
                    eventType: moderationEventType,
                    severity: action === 'block' ? 'HIGH' : 'MEDIUM',
                    status: 'RESOLVED',
                    reason: reason || `Admin ${action} action`,
                    source: 'ADMIN_ACTION',
                    resolvedAt: new Date(),
                    resolvedBy: session.user.id,
                    metadata: { matchId, action, partnerId: match.user2Id }
                },
                {
                    userId: match.user2Id,
                    eventType: moderationEventType,
                    severity: action === 'block' ? 'HIGH' : 'MEDIUM',
                    status: 'RESOLVED',
                    reason: reason || `Admin ${action} action`,
                    source: 'ADMIN_ACTION',
                    resolvedAt: new Date(),
                    resolvedBy: session.user.id,
                    metadata: { matchId, action, partnerId: match.user1Id }
                }
            ]
        })

        // Send notifications
        if (notifyUsers && notificationTitle) {
            await prisma.notification.createMany({
                data: [
                    {
                        userId: match.user1Id,
                        type: 'SYSTEM',
                        title: notificationTitle,
                        message: notificationMessage,
                        data: { matchId, adminAction: true }
                    },
                    {
                        userId: match.user2Id,
                        type: 'SYSTEM',
                        title: notificationTitle,
                        message: notificationMessage,
                        data: { matchId, adminAction: true }
                    }
                ]
            })
        }

        // Log admin action
        await prisma.adminAuditLog.create({
            data: {
                adminId: session.user.id,
                adminName: session.user.name || 'Unknown Admin',
                adminEmail: session.user.email || 'unknown@admin.com',
                action: `STUDY_BUDDY_${action.toUpperCase()}`,
                module: 'Study Buddy Management',
                details: `${action} match between ${match.user1.name} and ${match.user2.name}. ${reason || ''}`,
                status: 'SUCCESS',
                metadata: { matchId, action, reason, user1Id: match.user1Id, user2Id: match.user2Id, targetType: 'STUDY_BUDDY_MATCH' }
            }
        })

        // Fetch updated match
        const updatedMatch = await prisma.studyBuddyMatch.findUnique({
            where: { id: matchId },
            include: matchInclude
        })

        return NextResponse.json({
            success: true,
            action,
            match: updatedMatch ? mapMatch(updatedMatch) : null,
            message: `Match ${action} successfully`
        })
    } catch (error) {
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        console.error('Admin study buddy moderation error:', error)
        return NextResponse.json({ error: 'Failed to perform action' }, { status: 500 })
    }
}

// PATCH: Update match details
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        assertAdmin(session)

        const body = await request.json()
        const parsed = updateSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
        }

        const { matchId, status, sharedSubjects, sharedGoals } = parsed.data
        const payload: any = {}
        if (status) payload.status = status
        if (sharedSubjects) payload.sharedSubjects = JSON.stringify(sharedSubjects)
        if (sharedGoals) payload.sharedGoals = JSON.stringify(sharedGoals)

        if (Object.keys(payload).length === 0) {
            return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
        }

        const updated = await prisma.studyBuddyMatch.update({
            where: { id: matchId },
            data: payload,
            include: matchInclude
        })

        return NextResponse.json({ match: mapMatch(updated) })
    } catch (error) {
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        console.error('Admin study buddy match update error:', error)
        return NextResponse.json({ error: 'Failed to update match' }, { status: 500 })
    }
}

// DELETE: Permanently delete match
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        assertAdmin(session)

        const { searchParams } = new URL(request.url)
        const matchId = searchParams.get('id')

        if (!matchId) {
            return NextResponse.json({ error: 'Match ID is required' }, { status: 400 })
        }

        const match = await prisma.studyBuddyMatch.findUnique({
            where: { id: matchId },
            include: { user1: { select: { name: true } }, user2: { select: { name: true } } }
        })

        if (!match) {
            return NextResponse.json({ error: 'Match not found' }, { status: 404 })
        }

        await prisma.studyBuddyMatch.delete({
            where: { id: matchId }
        })

        // Log admin action
        await prisma.adminAuditLog.create({
            data: {
                adminId: session.user.id,
                adminName: session.user.name || 'Unknown Admin',
                adminEmail: session.user.email || 'unknown@admin.com',
                action: 'STUDY_BUDDY_DELETE',
                module: 'Study Buddy Management',
                details: `Deleted match between ${match.user1.name} and ${match.user2.name}`,
                status: 'SUCCESS',
                metadata: { matchId, targetType: 'STUDY_BUDDY_MATCH' }
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Match deleted successfully'
        })
    } catch (error) {
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        console.error('Admin study buddy delete error:', error)
        return NextResponse.json({ error: 'Failed to delete match' }, { status: 500 })
    }
}
