import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { NotificationService } from '@/services/NotificationService'

const swipeActionSchema = z.object({
    targetUserId: z.string(),
    action: z.enum(['like', 'pass']),
})

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const validation = swipeActionSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues },
                { status: 400 }
            )
        }

        const { targetUserId, action } = validation.data

        // Check if target user exists and is a learner
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId, role: 'LEARNER' },
        })

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Check if there's already an existing match
        const existingMatch = await prisma.studyBuddyMatch.findFirst({
            where: {
                OR: [
                    {
                        user1Id: session.user.id,
                        user2Id: targetUserId,
                    },
                    {
                        user1Id: targetUserId,
                        user2Id: session.user.id,
                    },
                ],
            },
        })

        if (existingMatch) {
            return NextResponse.json(
                { error: 'Match already exists' },
                { status: 400 }
            )
        }

        if (action === 'pass') {
            // Just record the pass action (could be stored in a separate table for analytics)
            return NextResponse.json({
                message: 'Pass recorded',
                action: 'pass',
            })
        }

        if (action === 'like') {
            // Check if the target user has already liked the current user
            const mutualLike = await prisma.studyBuddyMatch.findFirst({
                where: {
                    user1Id: targetUserId,
                    user2Id: session.user.id,
                    status: 'pending',
                },
            })

            if (mutualLike) {
                // Mutual match! Update the existing match to accepted
                const updatedMatch = await prisma.studyBuddyMatch.update({
                    where: { id: mutualLike.id },
                    data: {
                        status: 'accepted',
                        sharedSubjects: JSON.stringify([]), // Could be populated with actual shared subjects
                        sharedGoals: JSON.stringify([]), // Could be populated with actual shared goals
                    },
                })

                // Get current user data
                const currentUser = await prisma.user.findUnique({
                    where: { id: session.user.id },
                    select: { name: true }
                })

                // Send notifications to both users about the mutual match
                await Promise.all([
                    NotificationService.notifyStudyBuddyMatch(
                        targetUserId,
                        currentUser?.name || 'Someone',
                        updatedMatch.id
                    ),
                    NotificationService.notifyStudyBuddyMatch(
                        session.user.id,
                        targetUser.name,
                        updatedMatch.id
                    )
                ])

                return NextResponse.json({
                    message: 'Mutual match created!',
                    match: updatedMatch,
                    isMutual: true,
                })
            } else {
                // Create a pending match
                const newMatch = await prisma.studyBuddyMatch.create({
                    data: {
                        user1Id: session.user.id,
                        user2Id: targetUserId,
                        status: 'pending',
                        sharedSubjects: JSON.stringify([]),
                        sharedGoals: JSON.stringify([]),
                    },
                })

                return NextResponse.json({
                    message: 'Like sent',
                    match: newMatch,
                    isMutual: false,
                })
            }
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    } catch (error) {
        console.error('Study buddy swipe error:', error)
        return NextResponse.json(
            { error: 'Failed to process swipe' },
            { status: 500 }
        )
    }
}
