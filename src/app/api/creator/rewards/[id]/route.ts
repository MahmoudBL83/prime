import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/creator/rewards/[id] - Get reward details with leaderboard
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
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

        const reward = await prisma.reward.findFirst({
            where: {
                id: params.id,
                OR: [
                    {
                        course: {
                            creatorId: creator.id
                        }
                    },
                    {
                        courseId: null
                    }
                ]
            },
            include: {
                course: true,
                winners: {
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
                    },
                    orderBy: {
                        rank: 'asc'
                    }
                }
            }
        })

        if (!reward) {
            return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
        }

        // Get leaderboard for this course
        let leaderboard: any[] = []
        if (reward.courseId) {
            leaderboard = await prisma.leaderboardEntry.findMany({
                where: {
                    courseId: reward.courseId
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
                },
                orderBy: {
                    totalScore: 'desc'
                },
                take: 100 // Top 100
            })

            // Add rank
            leaderboard = leaderboard.map((entry, index) => ({
                ...entry,
                rank: index + 1
            }))
        }

        return NextResponse.json({
            success: true,
            reward,
            leaderboard
        })

    } catch (error) {
        console.error('Error fetching reward details:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// PATCH /api/creator/rewards/[id] - Update reward
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
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

        // Verify ownership
        const existingReward = await prisma.reward.findFirst({
            where: {
                id: params.id,
                course: {
                    creatorId: creator.id
                }
            }
        })

        if (!existingReward) {
            return NextResponse.json({ error: 'Reward not found or unauthorized' }, { status: 404 })
        }

        const body = await request.json()
        const {
            title,
            titleAr,
            description,
            descriptionAr,
            value,
            maxWinners,
            endDate,
            isActive,
            imageUrl
        } = body

        const reward = await prisma.reward.update({
            where: { id: params.id },
            data: {
                ...(title && { title }),
                ...(titleAr !== undefined && { titleAr }),
                ...(description && { description }),
                ...(descriptionAr !== undefined && { descriptionAr }),
                ...(value !== undefined && { value: value ? parseFloat(value) : null }),
                ...(maxWinners !== undefined && { maxWinners: maxWinners ? parseInt(maxWinners) : null }),
                ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
                ...(isActive !== undefined && { isActive }),
                ...(imageUrl !== undefined && { imageUrl })
            }
        })

        return NextResponse.json({
            success: true,
            reward
        })

    } catch (error) {
        console.error('Error updating reward:', error)
        return NextResponse.json(
            { error: 'Failed to update reward' },
            { status: 500 }
        )
    }
}

// DELETE /api/creator/rewards/[id] - Delete reward
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
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

        // Verify ownership
        const reward = await prisma.reward.findFirst({
            where: {
                id: params.id,
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

        // Prevent deletion if there are winners
        if (reward._count.winners > 0) {
            return NextResponse.json(
                { error: 'Cannot delete reward with existing winners' },
                { status: 400 }
            )
        }

        await prisma.reward.delete({
            where: { id: params.id }
        })

        return NextResponse.json({
            success: true,
            message: 'Reward deleted successfully'
        })

    } catch (error) {
        console.error('Error deleting reward:', error)
        return NextResponse.json(
            { error: 'Failed to delete reward' },
            { status: 500 }
        )
    }
}
