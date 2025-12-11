import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/mentors/[id]/sessions - Get all sessions
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: mentorId } = await context.params
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type') // 'upcoming' or 'archived'

        const now = new Date()

        // Get creator's channel first
        const creator = await prisma.creator.findUnique({
            where: { id: mentorId },
            include: {
                channels: {
                    select: { id: true }
                }
            }
        })

        if (!creator || !creator.channels[0]) {
            return NextResponse.json({ sessions: [] })
        }

        const channelId = creator.channels[0].id
        
        // Build where clause based on type
        const where: any = {
            channelId: channelId
        }

        if (type === 'upcoming') {
            where.scheduledAt = { gte: now }
            where.status = { in: ['SCHEDULED', 'LIVE'] }
        } else if (type === 'archived') {
            where.scheduledAt = { lt: now }
            where.status = 'ENDED'
        }

        const sessions = await prisma.liveSession.findMany({
            where,
            include: {
                attendees: true
            },
            orderBy: {
                scheduledAt: type === 'upcoming' ? 'asc' : 'desc'
            }
        })

        return NextResponse.json({ sessions })

    } catch (error) {
        console.error('Error fetching sessions:', error)
        return NextResponse.json(
            { error: 'Failed to fetch sessions' },
            { status: 500 }
        )
    }
}

// POST /api/mentors/[id]/sessions - Create a session
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id: mentorId } = await context.params
        
        // Verify user is the mentor/creator
        const creator = await prisma.creator.findUnique({
            where: { id: mentorId },
            select: { userId: true, channels: { select: { id: true } } }
        })

        if (!creator || creator.userId !== session.user.id) {
            return NextResponse.json(
                { error: 'Unauthorized - You can only create sessions for your own profile' },
                { status: 403 }
            )
        }

        if (!creator.channels[0]) {
            return NextResponse.json(
                { error: 'Creator channel not found' },
                { status: 404 }
            )
        }

        const body = await request.json()
        const { 
            title, 
            titleAr,
            description,
            descriptionAr,
            scheduledAt, 
            duration, 
            tier,
            maxAttendees,
            meetingUrl,
            meetingPassword,
            recordingUrl,
            status
        } = body

        if (!title || !scheduledAt || !duration) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const channelId = creator.channels[0].id

        const newSession = await prisma.liveSession.create({
            data: {
                channelId,
                title,
                titleAr,
                description,
                descriptionAr,
                scheduledAt: new Date(scheduledAt),
                duration,
                tier: tier || 'BRONZE',
                maxAttendees: maxAttendees || 100,
                streamUrl: meetingUrl || null,
                meetingPassword: meetingPassword || null,
                recordingUrl: recordingUrl || null,
                status: status || 'SCHEDULED'
            },
            include: {
                attendees: true
            }
        })

        return NextResponse.json({
            session: newSession,
            message: 'Session created successfully'
        }, { status: 201 })

    } catch (error) {
        console.error('Error creating session:', error)
        return NextResponse.json(
            { error: 'Failed to create session' },
            { status: 500 }
        )
    }
}

// PUT /api/mentors/[id]/sessions - Update a session
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id: mentorId } = await context.params
        const body = await request.json()
        const { sessionId, ...updateData } = body

        if (!sessionId) {
            return NextResponse.json(
                { error: 'Session ID required' },
                { status: 400 }
            )
        }

        // Verify user owns the session
        const existingSession = await prisma.liveSession.findUnique({
            where: { id: sessionId },
            include: {
                channel: {
                    select: {
                        creatorId: true
                    }
                }
            }
        })

        if (!existingSession || existingSession.channel.creatorId !== mentorId) {
            return NextResponse.json(
                { error: 'Session not found' },
                { status: 404 }
            )
        }

        if (session.user.id !== mentorId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            )
        }

        const updatedSession = await prisma.liveSession.update({
            where: { id: sessionId },
            data: updateData,
            include: {
                attendees: true
            }
        })

        return NextResponse.json({
            session: updatedSession,
            message: 'Session updated successfully'
        })

    } catch (error) {
        console.error('Error updating session:', error)
        return NextResponse.json(
            { error: 'Failed to update session' },
            { status: 500 }
        )
    }
}

// DELETE /api/mentors/[id]/sessions
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id: mentorId } = await context.params
        const { searchParams } = new URL(request.url)
        const sessionId = searchParams.get('sessionId')

        if (!sessionId) {
            return NextResponse.json(
                { error: 'Session ID required' },
                { status: 400 }
            )
        }

        // Verify user owns the session
        const existingSession = await prisma.liveSession.findUnique({
            where: { id: sessionId },
            include: {
                channel: {
                    select: {
                        creatorId: true
                    }
                }
            }
        })

        if (!existingSession || existingSession.channel.creatorId !== mentorId) {
            return NextResponse.json(
                { error: 'Session not found' },
                { status: 404 }
            )
        }

        // Verify user owns the session through Creator
        const creator = await prisma.creator.findUnique({
            where: { id: mentorId },
            select: { userId: true }
        })

        if (!creator || creator.userId !== session.user.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            )
        }

        await prisma.liveSession.delete({
            where: { id: sessionId }
        })

        return NextResponse.json({
            message: 'Session deleted successfully'
        })

    } catch (error) {
        console.error('Error deleting session:', error)
        return NextResponse.json(
            { error: 'Failed to delete session' },
            { status: 500 }
        )
    }
}
