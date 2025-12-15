import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

/**
 * Coaching API
 * Manage 1:1 coaching tokens and sessions
 */

const bookSessionSchema = z.object({
    tokenId: z.string(),
    scheduledAt: z.string().datetime(),
    duration: z.number().min(15).max(120).default(30),
    title: z.string().optional(),
    description: z.string().optional()
})

// GET: Get user's coaching tokens and sessions
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const creatorId = searchParams.get('creatorId')
        const role = searchParams.get('role') || 'learner' // learner or creator

        if (role === 'creator') {
            // Get creator's coaching sessions
            const creator = await prisma.creator.findUnique({
                where: { userId: session.user.id }
            })

            if (!creator) {
                return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
            }

            const sessions = await prisma.coachingSession.findMany({
                where: { creatorId: creator.id },
                include: {
                    token: {
                        select: { userId: true, tier: true }
                    }
                },
                orderBy: { scheduledAt: 'asc' }
            })

            // Get learner info for each session
            const learnerIds = [...new Set(sessions.map(s => s.learnerId))]
            const learners = await prisma.user.findMany({
                where: { id: { in: learnerIds } },
                select: { id: true, name: true, arabicName: true, profileImage: true, email: true }
            })
            const learnerMap = Object.fromEntries(learners.map(l => [l.id, l]))

            const enrichedSessions = sessions.map(session => ({
                ...session,
                learner: learnerMap[session.learnerId]
            }))

            // Get upcoming vs past sessions
            const now = new Date()
            const upcomingSessions = enrichedSessions.filter(s =>
                new Date(s.scheduledAt) >= now && s.status !== 'CANCELLED'
            )
            const pastSessions = enrichedSessions.filter(s =>
                new Date(s.scheduledAt) < now || s.status === 'COMPLETED'
            )

            return NextResponse.json({
                upcomingSessions,
                pastSessions,
                totalSessions: sessions.length,
                completedSessions: sessions.filter(s => s.status === 'COMPLETED').length
            })
        }

        // Learner view: Get tokens and sessions
        const whereClause: any = { userId: session.user.id }
        if (creatorId) {
            whereClause.creatorId = creatorId
        }

        const tokens = await prisma.coachingToken.findMany({
            where: whereClause,
            include: {
                creator: {
                    include: {
                        user: {
                            select: { name: true, arabicName: true, profileImage: true }
                        }
                    }
                },
                sessions: {
                    orderBy: { scheduledAt: 'desc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        // Get upcoming sessions
        const upcomingSessions = await prisma.coachingSession.findMany({
            where: {
                learnerId: session.user.id,
                scheduledAt: { gte: new Date() },
                status: { in: ['SCHEDULED', 'CONFIRMED'] }
            },
            include: {
                creator: {
                    include: {
                        user: { select: { name: true, arabicName: true, profileImage: true } }
                    }
                }
            },
            orderBy: { scheduledAt: 'asc' }
        })

        // Calculate available tokens
        const availableTokens = tokens.reduce((sum, t) => {
            if (t.status === 'ACTIVE' && new Date(t.expiresAt) > new Date()) {
                return sum + (t.tokensTotal - t.tokensUsed)
            }
            return sum
        }, 0)

        return NextResponse.json({
            tokens,
            upcomingSessions,
            availableTokens,
            totalTokens: tokens.reduce((sum, t) => sum + t.tokensTotal, 0)
        })
    } catch (error) {
        console.error('Coaching GET error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch coaching data' },
            { status: 500 }
        )
    }
}

// POST: Book a coaching session
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const parsed = bookSessionSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
        }

        const { tokenId, scheduledAt, duration, title, description } = parsed.data

        // Get the token
        const token = await prisma.coachingToken.findUnique({
            where: { id: tokenId },
            include: { creator: true }
        })

        if (!token) {
            return NextResponse.json({ error: 'Token not found' }, { status: 404 })
        }

        if (token.userId !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        if (token.status !== 'ACTIVE') {
            return NextResponse.json({ error: 'Token is not active' }, { status: 400 })
        }

        if (new Date(token.expiresAt) < new Date()) {
            return NextResponse.json({ error: 'Token has expired' }, { status: 400 })
        }

        if (token.tokensUsed >= token.tokensTotal) {
            return NextResponse.json({ error: 'No tokens remaining' }, { status: 400 })
        }

        // Check for scheduling conflicts
        const scheduledDate = new Date(scheduledAt)
        const endTime = new Date(scheduledDate.getTime() + duration * 60 * 1000)

        const conflictingSessions = await prisma.coachingSession.findMany({
            where: {
                creatorId: token.creatorId,
                status: { in: ['SCHEDULED', 'CONFIRMED'] },
                scheduledAt: {
                    gte: new Date(scheduledDate.getTime() - 60 * 60 * 1000), // 1 hour before
                    lte: endTime
                }
            }
        })

        if (conflictingSessions.length > 0) {
            return NextResponse.json(
                { error: 'This time slot is not available' },
                { status: 400 }
            )
        }

        // Create session and update token
        const [coachingSession] = await prisma.$transaction([
            prisma.coachingSession.create({
                data: {
                    tokenId,
                    creatorId: token.creatorId,
                    learnerId: session.user.id,
                    title,
                    scheduledAt: scheduledDate,
                    duration,
                    description,
                    status: 'SCHEDULED'
                }
            }),
            prisma.coachingToken.update({
                where: { id: tokenId },
                data: { tokensUsed: { increment: 1 } }
            })
        ])

        return NextResponse.json({
            session: coachingSession,
            message: 'Coaching session booked successfully'
        }, { status: 201 })
    } catch (error) {
        console.error('Coaching POST error:', error)
        return NextResponse.json(
            { error: 'Failed to book coaching session' },
            { status: 500 }
        )
    }
}

// PATCH: Update coaching session (confirm, cancel, complete)
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { sessionId, action, reason, rating, feedback, meetingUrl } = body

        if (!sessionId || !action) {
            return NextResponse.json(
                { error: 'sessionId and action are required' },
                { status: 400 }
            )
        }

        const coachingSession = await prisma.coachingSession.findUnique({
            where: { id: sessionId },
            include: { token: true, creator: true }
        })

        if (!coachingSession) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 })
        }

        // Check authorization
        const isLearner = coachingSession.learnerId === session.user.id
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })
        const isCreator = creator && coachingSession.creatorId === creator.id

        if (!isLearner && !isCreator) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        let updateData: any = {}

        switch (action) {
            case 'confirm':
                if (!isCreator) {
                    return NextResponse.json({ error: 'Only creator can confirm' }, { status: 403 })
                }
                updateData = { status: 'CONFIRMED', meetingUrl }
                break

            case 'start':
                if (!isCreator) {
                    return NextResponse.json({ error: 'Only creator can start' }, { status: 403 })
                }
                updateData = { status: 'IN_PROGRESS', startedAt: new Date() }
                break

            case 'complete':
                if (!isCreator) {
                    return NextResponse.json({ error: 'Only creator can complete' }, { status: 403 })
                }
                updateData = { status: 'COMPLETED', completedAt: new Date() }
                break

            case 'cancel':
                updateData = {
                    status: 'CANCELLED',
                    cancelReason: reason
                }
                // Refund token if cancelled
                await prisma.coachingToken.update({
                    where: { id: coachingSession.tokenId },
                    data: { tokensUsed: { decrement: 1 } }
                })
                break

            case 'rate':
                if (!isLearner) {
                    return NextResponse.json({ error: 'Only learner can rate' }, { status: 403 })
                }
                updateData = { rating, feedback }
                break

            case 'addMeetingUrl':
                if (!isCreator) {
                    return NextResponse.json({ error: 'Only creator can add meeting URL' }, { status: 403 })
                }
                updateData = { meetingUrl }
                break

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

        const updated = await prisma.coachingSession.update({
            where: { id: sessionId },
            data: updateData
        })

        return NextResponse.json({
            session: updated,
            message: `Session ${action}ed successfully`
        })
    } catch (error) {
        console.error('Coaching PATCH error:', error)
        return NextResponse.json(
            { error: 'Failed to update coaching session' },
            { status: 500 }
        )
    }
}
