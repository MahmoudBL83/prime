import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/study-buddy/matches/[id] - Get a specific match by ID
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params;
        const matchId = id

        // Get the match
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

        // Determine which user is the "other" user
        const isUser1 = match.user1Id === session.user.id
        const otherUserId = isUser1 ? match.user2Id : match.user1Id

        // Fetch the other user's details
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
            return NextResponse.json({ error: 'Other user not found' }, { status: 404 })
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

        // Return enriched match data
        const enrichedMatch = {
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

        return NextResponse.json(enrichedMatch)
    } catch (error) {
        console.error('Study buddy match fetch error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch match' },
            { status: 500 }
        )
    }
}
