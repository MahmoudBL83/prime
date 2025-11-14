import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface StudyBuddyMatchWithDetails {
    id: string
    status: string
    sharedSubjects: string[]
    sharedGoals: string[]
    chatRoomId?: string | null
    createdAt: string
    updatedAt: string
    otherUser: {
        id: string
        name: string
        arabicName?: string | null
        profileImage?: string | null
        interests: string[]
        goals: string[]
        skillLevel: string | null
        learningMode?: string | null
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const status = searchParams.get('status') || 'all'

        // Build where clause for matches
        const whereClause: any = {
            OR: [
                { user1Id: session.user.id },
                { user2Id: session.user.id },
            ],
        }

        if (status !== 'all') {
            whereClause.status = status
        }

        // Get user's matches
        const matches = await prisma.studyBuddyMatch.findMany({
            where: whereClause,
            orderBy: { updatedAt: 'desc' },
        })

        // Enrich matches with other user details
        const enrichedMatches = await Promise.all(
            matches.map(async (match) => {
                const isUser1 = match.user1Id === session.user.id
                const otherUserId = isUser1 ? match.user2Id : match.user1Id

                const otherUser = await prisma.user.findUnique({
                    where: { id: otherUserId },
                    select: {
                        id: true,
                        name: true,
                        arabicName: true,
                        profileImage: true,
                        interests: true,
                        goals: true,
                        skillLevel: true,
                        learningMode: true,
                    },
                })

                if (!otherUser) {
                    return null
                }

                // Helper function to parse interests/goals that might be JSON or comma-separated strings
                const parseArrayField = (field: string | null): string[] => {
                    if (!field) return []
                    try {
                        // Try to parse as JSON first
                        return JSON.parse(field)
                    } catch {
                        // If JSON parse fails, treat as comma-separated string
                        return field.split(',').map(item => item.trim()).filter(Boolean)
                    }
                }

                return {
                    id: match.id,
                    status: match.status,
                    sharedSubjects: match.sharedSubjects ? (() => {
                        try { return JSON.parse(match.sharedSubjects) } catch { return [] }
                    })() : [],
                    sharedGoals: match.sharedGoals ? (() => {
                        try { return JSON.parse(match.sharedGoals) } catch { return [] }
                    })() : [],
                    chatRoomId: match.chatRoomId,
                    createdAt: match.createdAt.toISOString(),
                    updatedAt: match.updatedAt.toISOString(),
                    otherUser: {
                        id: otherUser.id,
                        name: otherUser.name,
                        arabicName: otherUser.arabicName,
                        profileImage: otherUser.profileImage,
                        interests: parseArrayField(otherUser.interests),
                        goals: parseArrayField(otherUser.goals),
                        skillLevel: otherUser.skillLevel,
                        learningMode: otherUser.learningMode,
                    },
                }
            })
        )

        // Filter out null values and cast to correct type
        const validMatches = enrichedMatches.filter((match): match is StudyBuddyMatchWithDetails =>
            match !== null && match.chatRoomId !== undefined
        ) as StudyBuddyMatchWithDetails[]

        // Group matches by status
        const groupedMatches = {
            pending: validMatches.filter((match) => match.status === 'pending'),
            accepted: validMatches.filter((match) => match.status === 'accepted'),
            blocked: validMatches.filter((match) => match.status === 'blocked'),
        }

        return NextResponse.json({
            matches: validMatches,
            grouped: groupedMatches,
            summary: {
                total: validMatches.length,
                pending: groupedMatches.pending.length,
                accepted: groupedMatches.accepted.length,
                blocked: groupedMatches.blocked.length,
            },
        })
    } catch (error) {
        console.error('Study buddy matches fetch error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch matches' },
            { status: 500 }
        )
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const matchId = searchParams.get('id')
        const action = searchParams.get('action')

        if (!matchId || !action) {
            return NextResponse.json(
                { error: 'Match ID and action are required' },
                { status: 400 }
            )
        }

        // Check if the match belongs to the current user
        const match = await prisma.studyBuddyMatch.findFirst({
            where: {
                id: matchId,
                OR: [
                    { user1Id: session.user.id },
                    { user2Id: session.user.id },
                ],
            },
        })

        if (!match) {
            return NextResponse.json({ error: 'Match not found' }, { status: 404 })
        }

        let updatedMatch

        switch (action) {
            case 'accept':
                if (match.status !== 'pending') {
                    return NextResponse.json(
                        { error: 'Only pending matches can be accepted' },
                        { status: 400 }
                    )
                }
                updatedMatch = await prisma.studyBuddyMatch.update({
                    where: { id: matchId },
                    data: { status: 'accepted' },
                })
                break

            case 'block':
                updatedMatch = await prisma.studyBuddyMatch.update({
                    where: { id: matchId },
                    data: { status: 'blocked' },
                })
                break

            case 'unblock':
                if (match.status !== 'blocked') {
                    return NextResponse.json(
                        { error: 'Only blocked matches can be unblocked' },
                        { status: 400 }
                    )
                }
                updatedMatch = await prisma.studyBuddyMatch.update({
                    where: { id: matchId },
                    data: { status: 'pending' },
                })
                break

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

        return NextResponse.json({
            message: `Match ${action}ed successfully`,
            match: updatedMatch,
        })
    } catch (error) {
        console.error('Study buddy match update error:', error)
        return NextResponse.json(
            { error: 'Failed to update match' },
            { status: 500 }
        )
    }
}
