import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma, UserRole } from '@prisma/client'
import { z } from 'zod'
import type { Session } from 'next-auth'

const updateSchema = z.object({
    matchId: z.string().min(1),
    status: z.string().min(2).optional(),
    sharedSubjects: z.array(z.string()).optional(),
    sharedGoals: z.array(z.string()).optional()
})

const matchInclude = {
    user1: {
        select: {
            id: true,
            name: true,
            interests: true,
            studyBuddyPreferences: true
        }
    },
    user2: {
        select: {
            id: true,
            name: true,
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

type MatchResponse = ReturnType<typeof mapMatch>

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
    } catch (error) {
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
    const completedSessions = match.studySessions.filter(session => session.status === 'COMPLETED').length
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
            interests: parseJsonArray(match.user1.interests)
        },
        user2: {
            id: match.user2.id,
            name: match.user2.name ?? 'Learner',
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

async function getMatchById(id: string) {
    return prisma.studyBuddyMatch.findUnique({
        where: { id },
        include: matchInclude
    })
}

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
            where.status = { equals: statusFilter, mode: 'insensitive' }
        }
        if (search) {
            where.OR = [
                { user1: { name: { contains: search, mode: 'insensitive' } } },
                { user2: { name: { contains: search, mode: 'insensitive' } } }
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
        const totalMatches = total
        const activeMatches = mapped.filter(match => ['active', 'accepted'].includes(match.status)).length
        const reportedMatches = mapped.filter(match => match.status.includes('report') || match.status.includes('blocked')).length
        const avgCompatibility = totalMatches ? Math.round(mapped.reduce((sum, match) => sum + match.compatibilityScore, 0) / totalMatches) : 0
        const avgSessions = totalMatches ? Number((mapped.reduce((sum, match) => sum + match.sessionsCompleted, 0) / totalMatches).toFixed(1)) : 0
        const matchSuccessRate = totalMatches ? Math.round((activeMatches / totalMatches) * 100) : 0

        return NextResponse.json({
            matches: mapped,
            meta: {
                total: totalMatches,
                page,
                pageSize
            },
            stats: {
                totalMatches,
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
        if (status) {
            payload.status = status
        }
        if (sharedSubjects) {
            payload.sharedSubjects = JSON.stringify(sharedSubjects)
        }
        if (sharedGoals) {
            payload.sharedGoals = JSON.stringify(sharedGoals)
        }

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
