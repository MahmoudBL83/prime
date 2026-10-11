import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { NotificationService } from '@/services/NotificationService'

const swipeActionSchema = z.object({
    targetUserId: z.string().min(1),
    // superlike = like + the other learner is told right away (like Tinder)
    action: z.enum(['like', 'superlike', 'pass']),
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

        if (targetUserId === session.user.id) {
            return NextResponse.json({ error: 'You cannot match with yourself' }, { status: 400 })
        }

        // Target must be a learner; also load any existing match between the two users
        const [targetUser, existingMatch, userBlock, messageBlock] = await Promise.all([
            prisma.user.findFirst({
                where: { id: targetUserId, role: 'LEARNER', onboardingCompleted: true, loginDisabled: false },
                select: { id: true, name: true },
            }),
            prisma.studyBuddyMatch.findFirst({
                where: {
                    OR: [
                        { user1Id: session.user.id, user2Id: targetUserId },
                        { user1Id: targetUserId, user2Id: session.user.id },
                    ],
                },
            }),
            prisma.userBlock.findFirst({
                where: { OR: [
                    { blockerId: session.user.id, blockedId: targetUserId },
                    { blockerId: targetUserId, blockedId: session.user.id },
                ] },
                select: { id: true },
            }),
            prisma.blockedUser.findFirst({
                where: { OR: [
                    { userId: session.user.id, blockedUserId: targetUserId },
                    { userId: targetUserId, blockedUserId: session.user.id },
                ] },
                select: { id: true },
            }),
        ])

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }
        if (userBlock || messageBlock || existingMatch?.status === 'blocked') {
            return NextResponse.json({ error: 'This profile is unavailable' }, { status: 403 })
        }

        if (action === 'pass') {
            // Passing is remembered on the client so the profile is not shown again;
            // a pending like from the other user is simply left unanswered.
            return NextResponse.json({
                message: 'Pass recorded',
                action: 'pass',
                isMutual: false,
            })
        }

        // --- like ---
        if (existingMatch) {
            const theyLikedFirst = existingMatch.user1Id === targetUserId && existingMatch.user2Id === session.user.id

            if (theyLikedFirst && existingMatch.status === 'pending') {
                // Mutual match! The other user swiped right first.
                const updatedMatch = await prisma.studyBuddyMatch.update({
                    where: { id: existingMatch.id },
                    data: { status: 'accepted' },
                })

                const currentUserName = session.user.name || 'Someone'
                await Promise.all([
                    NotificationService.notifyStudyBuddyMatch(targetUserId, currentUserName, updatedMatch.id),
                    NotificationService.notifyStudyBuddyMatch(session.user.id, targetUser.name, updatedMatch.id),
                ]).catch((error) => console.error('Match notification error:', error))

                return NextResponse.json({
                    message: 'Mutual match created!',
                    match: updatedMatch,
                    isMutual: true,
                })
            }

            // Already liked, already matched, or blocked: answer idempotently
            return NextResponse.json({
                message: existingMatch.status === 'accepted' ? 'Already matched' : 'Like already sent',
                match: existingMatch,
                isMutual: existingMatch.status === 'accepted',
            })
        }

        // First like between these two users: wait for the other side
        const newMatch = await prisma.studyBuddyMatch.create({
            data: {
                user1Id: session.user.id,
                user2Id: targetUserId,
                status: 'pending',
                sharedSubjects: JSON.stringify([]),
                sharedGoals: JSON.stringify([]),
            },
        })

        if (action === 'superlike') {
            await NotificationService.create({
                userId: targetUserId,
                type: 'STUDY_BUDDY_REQUEST',
                title: 'You got a Super Like ⭐',
                message: `${session.user.name || 'A learner'} super liked you as a study buddy. Swipe right to match!`,
                data: { matchId: newMatch.id, actionType: 'superlike', actionUrl: '/study-buddy' },
            }).catch((error) => console.error('Super like notification error:', error))
        }

        return NextResponse.json({
            message: action === 'superlike' ? 'Super Like sent' : 'Like sent',
            match: newMatch,
            isMutual: false,
        })

    } catch (error) {
        console.error('Study buddy swipe error:', error)
        return NextResponse.json(
            { error: 'Failed to process swipe' },
            { status: 500 }
        )
    }
}
