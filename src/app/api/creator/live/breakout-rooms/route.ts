import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

/**
 * Breakout Rooms API for Live Sessions
 * Manage breakout rooms for collaborative learning during live sessions
 * GET/POST/PATCH /api/creator/live/breakout-rooms
 */

const createRoomSchema = z.object({
    sessionId: z.string(),
    name: z.string().min(1).max(100),
    maxParticipants: z.number().min(2).max(50).default(10),
    topic: z.string().optional(),
    duration: z.number().min(1).max(120).optional() // minutes
})

// GET: List breakout rooms for a session
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const sessionId = searchParams.get('sessionId')

        if (!sessionId) {
            return NextResponse.json(
                { error: 'sessionId is required' },
                { status: 400 }
            )
        }

        // Get live session with breakout room data
        const liveSession = await prisma.liveSession.findUnique({
            where: { id: sessionId },
            include: {
                channel: {
                    include: {
                        creator: true
                    }
                }
            }
        })

        if (!liveSession) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 })
        }

        // Parse breakout rooms from session metadata
        const metadata = (liveSession.settings as any) || {}
        const breakoutRooms = metadata.breakoutRooms || []

        return NextResponse.json({
            sessionId,
            sessionTitle: liveSession.title,
            status: liveSession.status,
            breakoutRooms: breakoutRooms.map((room: any) => ({
                ...room,
                participantCount: room.participants?.length || 0
            })),
            totalRooms: breakoutRooms.length,
            isCreator: liveSession.channel.creator.userId === session.user.id
        })
    } catch (error) {
        console.error('Breakout rooms GET error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch breakout rooms' },
            { status: 500 }
        )
    }
}

// POST: Create breakout rooms
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()

        // Support both single room and auto-create multiple rooms
        const { sessionId, rooms, autoCreate } = body

        if (!sessionId) {
            return NextResponse.json(
                { error: 'sessionId is required' },
                { status: 400 }
            )
        }

        // Verify ownership
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        const liveSession = await prisma.liveSession.findFirst({
            where: {
                id: sessionId,
                channel: { creatorId: creator?.id }
            }
        })

        if (!liveSession) {
            return NextResponse.json({ error: 'Session not found or unauthorized' }, { status: 404 })
        }

        const metadata = (liveSession.settings as any) || {}
        let breakoutRooms = metadata.breakoutRooms || []

        if (autoCreate) {
            // Auto-create rooms based on attendee count
            const { roomCount, maxPerRoom } = autoCreate
            const newRooms = []
            for (let i = 0; i < roomCount; i++) {
                newRooms.push({
                    id: `br-${Date.now()}-${i}`,
                    name: `Room ${breakoutRooms.length + i + 1}`,
                    maxParticipants: maxPerRoom || 10,
                    participants: [],
                    status: 'PENDING',
                    createdAt: new Date().toISOString()
                })
            }
            breakoutRooms = [...breakoutRooms, ...newRooms]
        } else if (rooms && Array.isArray(rooms)) {
            // Create specific rooms
            for (const room of rooms) {
                breakoutRooms.push({
                    id: `br-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    name: room.name,
                    maxParticipants: room.maxParticipants || 10,
                    topic: room.topic || '',
                    duration: room.duration,
                    participants: [],
                    status: 'PENDING',
                    createdAt: new Date().toISOString()
                })
            }
        } else {
            // Single room creation
            const parsed = createRoomSchema.safeParse(body)
            if (!parsed.success) {
                return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
            }

            breakoutRooms.push({
                id: `br-${Date.now()}`,
                name: parsed.data.name,
                maxParticipants: parsed.data.maxParticipants,
                topic: parsed.data.topic || '',
                duration: parsed.data.duration,
                participants: [],
                status: 'PENDING',
                createdAt: new Date().toISOString()
            })
        }

        metadata.breakoutRooms = breakoutRooms

        await prisma.liveSession.update({
            where: { id: sessionId },
            data: { settings: metadata }
        })

        return NextResponse.json({
            breakoutRooms,
            totalRooms: breakoutRooms.length,
            message: 'Breakout rooms created successfully'
        }, { status: 201 })
    } catch (error) {
        console.error('Breakout rooms POST error:', error)
        return NextResponse.json(
            { error: 'Failed to create breakout rooms' },
            { status: 500 }
        )
    }
}

// PATCH: Manage breakout rooms (start, close, assign participants)
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { sessionId, roomId, action, participantIds, duration } = body

        if (!sessionId || !action) {
            return NextResponse.json(
                { error: 'sessionId and action are required' },
                { status: 400 }
            )
        }

        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        const liveSession = await prisma.liveSession.findFirst({
            where: {
                id: sessionId,
                channel: { creatorId: creator?.id }
            }
        })

        if (!liveSession) {
            return NextResponse.json({ error: 'Session not found or unauthorized' }, { status: 404 })
        }

        const metadata = (liveSession.settings as any) || {}
        let breakoutRooms = metadata.breakoutRooms || []

        switch (action) {
            case 'start_all': {
                // Start all breakout rooms
                breakoutRooms = breakoutRooms.map((room: any) => ({
                    ...room,
                    status: 'ACTIVE',
                    startedAt: new Date().toISOString(),
                    endsAt: duration
                        ? new Date(Date.now() + duration * 60 * 1000).toISOString()
                        : undefined
                }))
                break
            }

            case 'close_all': {
                // Close all breakout rooms
                breakoutRooms = breakoutRooms.map((room: any) => ({
                    ...room,
                    status: 'CLOSED',
                    closedAt: new Date().toISOString()
                }))
                break
            }

            case 'start_room': {
                const roomIndex = breakoutRooms.findIndex((r: any) => r.id === roomId)
                if (roomIndex === -1) {
                    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
                }
                breakoutRooms[roomIndex].status = 'ACTIVE'
                breakoutRooms[roomIndex].startedAt = new Date().toISOString()
                break
            }

            case 'close_room': {
                const roomIndex = breakoutRooms.findIndex((r: any) => r.id === roomId)
                if (roomIndex === -1) {
                    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
                }
                breakoutRooms[roomIndex].status = 'CLOSED'
                breakoutRooms[roomIndex].closedAt = new Date().toISOString()
                break
            }

            case 'assign_participants': {
                const roomIndex = breakoutRooms.findIndex((r: any) => r.id === roomId)
                if (roomIndex === -1) {
                    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
                }
                if (!participantIds || !Array.isArray(participantIds)) {
                    return NextResponse.json({ error: 'participantIds required' }, { status: 400 })
                }
                // Check capacity
                if (participantIds.length > breakoutRooms[roomIndex].maxParticipants) {
                    return NextResponse.json(
                        { error: `Exceeds max capacity of ${breakoutRooms[roomIndex].maxParticipants}` },
                        { status: 400 }
                    )
                }
                breakoutRooms[roomIndex].participants = participantIds
                break
            }

            case 'auto_assign': {
                // Auto-assign attendees to rooms evenly
                const attendees = await prisma.sessionAttendee.findMany({
                    where: { sessionId },
                    select: { id: true }
                })

                const attendeeIds = attendees.map(a => a.id)
                const roomCount = breakoutRooms.length

                breakoutRooms = breakoutRooms.map((room: any, i: number) => ({
                    ...room,
                    participants: attendeeIds.filter((_, idx) => idx % roomCount === i)
                }))
                break
            }

            case 'delete_room': {
                breakoutRooms = breakoutRooms.filter((r: any) => r.id !== roomId)
                break
            }

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

        metadata.breakoutRooms = breakoutRooms

        await prisma.liveSession.update({
            where: { id: sessionId },
            data: { settings: metadata }
        })

        return NextResponse.json({
            breakoutRooms,
            message: `Action "${action}" completed successfully`
        })
    } catch (error) {
        console.error('Breakout rooms PATCH error:', error)
        return NextResponse.json(
            { error: 'Failed to update breakout rooms' },
            { status: 500 }
        )
    }
}
