import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/creator/rewards/[id]/select-winners - Select winners for a reward
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions)
        if (!session?.user?.id || session.user.role !== 'CREATOR') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id },
            select: { id: true }
        })

        if (!creator) {
            return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 })
        }

        // Get reward with ownership verification
        const reward = await prisma.reward.findFirst({
            where: {
                id,
                course: {
                    creatorId: creator.id
                }
            },
            include: {
                _count: {
                    select: {
                        winners: true
                    }
                }
            }
        })

        if (!reward) {
            return NextResponse.json({ error: 'Reward not found or unauthorized' }, { status: 404 })
        }

        // Check if reward has ended
        if (reward.endDate && reward.endDate > new Date()) {
            return NextResponse.json(
                { error: 'Cannot select winners before reward end date' },
                { status: 400 }
            )
        }

        // Check if max winners already selected
        if (reward.maxWinners && reward._count.winners >= reward.maxWinners) {
            return NextResponse.json(
                { error: 'Maximum winners already selected' },
                { status: 400 }
            )
        }

        const body = await request.json()
        const { method, userIds } = body // method: 'manual' or 'auto', userIds for manual selection

        if (method === 'manual') {
            // Manual winner selection
            if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
                return NextResponse.json(
                    { error: 'User IDs required for manual selection' },
                    { status: 400 }
                )
            }

            // Check if max winners would be exceeded
            if (reward.maxWinners && userIds.length > reward.maxWinners - reward._count.winners) {
                return NextResponse.json(
                    { error: `Can only select ${reward.maxWinners - reward._count.winners} more winners` },
                    { status: 400 }
                )
            }

            // Verify all users exist and are enrolled in the course
            if (reward.courseId) {
                const enrollments = await prisma.enrollment.findMany({
                    where: {
                        courseId: reward.courseId,
                        userId: {
                            in: userIds
                        }
                    }
                })

                if (enrollments.length !== userIds.length) {
                    return NextResponse.json(
                        { error: 'Some users are not enrolled in the course' },
                        { status: 400 }
                    )
                }
            }

            // Create winners
            const currentRank = reward._count.winners + 1
            const winners = await Promise.all(
                userIds.map((userId, index) =>
                    prisma.rewardWinner.create({
                        data: {
                            rewardId: id,
                            userId,
                            rank: currentRank + index,
                            status: 'PENDING'
                        },
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    arabicName: true,
                                    email: true,
                                    profileImage: true
                                }
                            }
                        }
                    })
                )
            )

            return NextResponse.json({
                success: true,
                message: `${winners.length} winners selected successfully`,
                winners
            })

        } else if (method === 'auto') {
            // Auto-select winners based on leaderboard
            if (!reward.courseId) {
                return NextResponse.json(
                    { error: 'Auto-selection requires a course-specific reward' },
                    { status: 400 }
                )
            }

            if (!reward.maxWinners) {
                return NextResponse.json(
                    { error: 'Max winners must be set for auto-selection' },
                    { status: 400 }
                )
            }

            // Get top performers from leaderboard
            const leaderboard = await prisma.leaderboardEntry.findMany({
                where: {
                    courseId: reward.courseId
                },
                orderBy: {
                    totalScore: 'desc'
                },
                take: reward.maxWinners,
                select: {
                    userId: true,
                    totalScore: true
                }
            })

            if (leaderboard.length === 0) {
                return NextResponse.json(
                    { error: 'No eligible participants found' },
                    { status: 400 }
                )
            }

            // Check for existing winners
            const existingWinners = await prisma.rewardWinner.findMany({
                where: {
                    rewardId: id
                },
                select: {
                    userId: true
                }
            })

            const existingWinnerIds = new Set(existingWinners.map(w => w.userId))
            const newWinners = leaderboard.filter(entry => !existingWinnerIds.has(entry.userId))

            if (newWinners.length === 0) {
                return NextResponse.json(
                    { error: 'All top performers have already been selected as winners' },
                    { status: 400 }
                )
            }

            // Create winners
            const winners = await Promise.all(
                newWinners.map((entry, index) =>
                    prisma.rewardWinner.create({
                        data: {
                            rewardId: id,
                            userId: entry.userId,
                            rank: index + 1,
                            status: 'PENDING'
                        },
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    arabicName: true,
                                    email: true,
                                    profileImage: true
                                }
                            }
                        }
                    })
                )
            )

            return NextResponse.json({
                success: true,
                message: `${winners.length} winners selected automatically based on leaderboard`,
                winners
            })

        } else {
            return NextResponse.json(
                { error: 'Invalid selection method. Use "manual" or "auto"' },
                { status: 400 }
            )
        }

    } catch (error) {
        console.error('Error selecting winners:', error)
        return NextResponse.json(
            { error: 'Failed to select winners' },
            { status: 500 }
        )
    }
}
