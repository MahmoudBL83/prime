import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/creator/rewards - Get all rewards for creator's courses
export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id || session.user.role !== 'CREATOR') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get creator profile
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id },
            select: { id: true }
        })

        if (!creator) {
            return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 })
        }

        // Get rewards for creator's courses
        const rewards = await prisma.reward.findMany({
            where: {
                OR: [
                    {
                        course: {
                            creatorId: creator.id
                        }
                    },
                    {
                        courseId: null // Platform-wide rewards creator can participate in
                    }
                ]
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        titleAr: true,
                    }
                },
                winners: {
                    select: {
                        id: true,
                        userId: true,
                        rank: true,
                        status: true,
                        awardedAt: true,
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
                },
                _count: {
                    select: {
                        winners: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        const now = new Date()
        const transformedRewards = rewards.map(reward => ({
            id: reward.id,
            title: reward.title,
            titleAr: reward.titleAr,
            description: reward.description,
            descriptionAr: reward.descriptionAr,
            type: reward.type,
            value: reward.value,
            currency: reward.currency,
            maxWinners: reward.maxWinners,
            startDate: reward.startDate?.toISOString(),
            endDate: reward.endDate?.toISOString(),
            isActive: reward.isActive && (reward.endDate ? reward.endDate > now : true),
            status: reward.endDate && reward.endDate < now ? 'ENDED' : 
                    !reward.startDate || reward.startDate <= now ? 'ACTIVE' : 'UPCOMING',
            currentWinners: reward._count.winners,
            courseId: reward.courseId,
            courseTitle: reward.course?.title,
            courseTitleAr: reward.course?.titleAr,
            imageUrl: reward.imageUrl,
            winners: reward.winners
        }))

        return NextResponse.json({
            success: true,
            rewards: transformedRewards
        })

    } catch (error) {
        console.error('Error fetching creator rewards:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// POST /api/creator/rewards - Create a new reward for a course
export async function POST(request: NextRequest) {
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

        const body = await request.json()
        const {
            title,
            titleAr,
            description,
            descriptionAr,
            type,
            value,
            currency,
            maxWinners,
            startDate,
            endDate,
            requirements,
            courseId,
            imageUrl
        } = body

        // Validation
        if (!title || !description) {
            return NextResponse.json(
                { error: 'Title and description are required' },
                { status: 400 }
            )
        }

        if (title.length < 10) {
            return NextResponse.json(
                { error: 'Title must be at least 10 characters' },
                { status: 400 }
            )
        }

        if (description.length < 20) {
            return NextResponse.json(
                { error: 'Description must be at least 20 characters' },
                { status: 400 }
            )
        }

        // Verify course ownership if courseId provided
        if (courseId) {
            const course = await prisma.course.findFirst({
                where: {
                    id: courseId,
                    creatorId: creator.id
                }
            })

            if (!course) {
                return NextResponse.json(
                    { error: 'Course not found or unauthorized' },
                    { status: 404 }
                )
            }
        }

        // Create reward
        const reward = await prisma.reward.create({
            data: {
                title,
                titleAr: titleAr || null,
                description,
                descriptionAr: descriptionAr || null,
                type: type || 'BADGE',
                value: value ? parseFloat(value) : null,
                currency: currency || 'EGP',
                maxWinners: maxWinners ? parseInt(maxWinners) : null,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                requirements: requirements || '{}',
                courseId: courseId || null,
                imageUrl: imageUrl || null,
                isActive: true
            },
            include: {
                course: {
                    select: {
                        title: true,
                        titleAr: true
                    }
                }
            }
        })

        return NextResponse.json({
            success: true,
            reward
        }, { status: 201 })

    } catch (error) {
        console.error('Error creating reward:', error)
        return NextResponse.json(
            { error: 'Failed to create reward' },
            { status: 500 }
        )
    }
}
