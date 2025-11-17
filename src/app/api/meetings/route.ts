import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/meetings - Get meetings for current user
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const role = searchParams.get('role') || 'learner' // 'learner' or 'creator'
        const status = searchParams.get('status') // Optional status filter

        let meetings

        if (role === 'creator') {
            // Get meetings where user is the creator/instructor
            const creator = await prisma.creator.findUnique({
                where: { userId: session.user.id }
            })
            
            if (!creator) {
                return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 })
            }

            const whereClause: any = {
                creatorId: creator.id
            }

            if (status) {
                whereClause.status = status
            }

            meetings = await prisma.meeting.findMany({
                where: whereClause,
                include: {
                    student: {
                        select: {
                            id: true,
                            name: true,
                            arabicName: true,
                            email: true,
                            phone: true
                        }
                    },
                    creator: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    arabicName: true,
                                    email: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    scheduledAt: 'asc'
                }
            })
        } else {
            // Get meetings where user is the learner/student
            const whereClause: any = {
                studentId: session.user.id
            }

            if (status) {
                whereClause.status = status
            }

            meetings = await prisma.meeting.findMany({
                where: whereClause,
                include: {
                    student: {
                        select: {
                            id: true,
                            name: true,
                            arabicName: true,
                            email: true,
                            phone: true
                        }
                    },
                    creator: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    arabicName: true,
                                    email: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    scheduledAt: 'asc'
                }
            })
        }

        // Transform meetings for frontend
        const transformedMeetings = meetings.map(meeting => ({
            ...meeting,
            scheduledAt: meeting.scheduledAt.toISOString(),
            createdAt: meeting.createdAt.toISOString(),
            updatedAt: meeting.updatedAt.toISOString(),
        }))

        return NextResponse.json({
            success: true,
            meetings: transformedMeetings
        })

    } catch (error) {
        console.error('Get meetings error:', error)
        return NextResponse.json(
            { error: 'Failed to get meetings' },
            { status: 500 }
        )
    }
}

// POST /api/meetings - Create a new meeting
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { creatorId, scheduledAt, duration, type, topic, notes } = body

        // Validate required fields
        if (!creatorId || !scheduledAt || !duration || !type) {
            return NextResponse.json(
                { error: 'Missing required fields: creatorId, scheduledAt, duration, type' },
                { status: 400 }
            )
        }

        // Verify creator exists
        const creator = await prisma.creator.findUnique({
            where: { id: creatorId },
            include: {
                user: {
                    select: {
                        name: true,
                        arabicName: true,
                        email: true
                    }
                }
            }
        })

        if (!creator) {
            return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
        }

        // Create the meeting
        const meeting = await prisma.meeting.create({
            data: {
                studentId: session.user.id,
                creatorId: creatorId,
                scheduledAt: new Date(scheduledAt),
                duration: duration,
                meetingType: type,
                title: topic || 'Meeting',
                notes: notes || '',
                status: 'SCHEDULED',
                meetingLink: '' // Will be updated when meeting starts or by creator
            },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        arabicName: true,
                        email: true,
                        phone: true
                    }
                },
                creator: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                arabicName: true,
                                email: true
                            }
                        }
                    }
                }
            }
        })

        // Transform date fields to ISO strings
        const transformedMeeting = {
            ...meeting,
            scheduledAt: meeting.scheduledAt.toISOString(),
            createdAt: meeting.createdAt.toISOString(),
            updatedAt: meeting.updatedAt.toISOString(),
        }

        return NextResponse.json({
            success: true,
            meeting: transformedMeeting
        }, { status: 201 })

    } catch (error) {
        console.error('Create meeting error:', error)
        return NextResponse.json(
            { error: 'Failed to create meeting' },
            { status: 500 }
        )
    }
}
