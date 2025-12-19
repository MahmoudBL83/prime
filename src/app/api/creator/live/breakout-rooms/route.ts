import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

/**
 * Breakout Rooms API for Live Sessions
 * Manage breakout rooms for collaborative learning during live sessions
 * Uses in-memory storage for active session breakout rooms
 */

// In-memory storage for breakout rooms (per session)
// In production, this could be Redis or another persistent cache
const breakoutRoomsStore = new Map<string, BreakoutRoom[]>()

interface BreakoutRoom {
    id: string
    sessionId: string
    name: string
    topic?: string
    maxParticipants: number
    duration?: number // minutes
    participants: string[] // user IDs
    status: 'waiting' | 'active' | 'closed'
    createdAt: string
    startedAt?: string
    closedAt?: string
}

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

        // Get live session
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

        // Get breakout rooms from in-memory store
        const breakoutRooms = breakoutRoomsStore.get(sessionId) || []

        return NextResponse.json({
            sessionId,
            sessionTitle: liveSession.title,
            status: liveSession.status,
            breakoutRooms: breakoutRooms.map((room) => ({
                id: room.id,
                name: room.name,
                topic: room.topic,
                maxParticipants: room.maxParticipants,
                duration: room.duration,
                participantCount: room.participants.length,
                participants: room.participants,
                status: room.status,
                createdAt: room.createdAt,
                startedAt: room.startedAt
            })),
            totalRooms: breakoutRooms.length,
            activeRooms: breakoutRooms.filter(r => r.status === 'active').length,
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
        const { sessionId, rooms, autoCreate, numberOfRooms } = body

        if (!sessionId) {
            return NextResponse.json(
                { error: 'sessionId is required' },
                { status: 400 }
            )
        }

        // Verify session exists and user is creator
        const liveSession = await prisma.liveSession.findUnique({
            where: { id: sessionId },
            include: {
                channel: {
                    include: { creator: true }
                }
            }
        })

        if (!liveSession) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 })
        }

        if (liveSession.channel.creator.userId !== session.user.id) {
            return NextResponse.json({ error: 'Only the session creator can manage breakout rooms' }, { status: 403 })
        }

        // Initialize store for this session if needed
        if (!breakoutRoomsStore.has(sessionId)) {
            breakoutRoomsStore.set(sessionId, [])
        }

        const existingRooms = breakoutRoomsStore.get(sessionId)!
        const createdRooms: BreakoutRoom[] = []

        // Auto-create rooms
        if (autoCreate && numberOfRooms) {
            for (let i = 1; i <= Math.min(numberOfRooms, 10); i++) {
                const newRoom: BreakoutRoom = {
                    id: `br_${sessionId}_${Date.now()}_${i}`,
                    sessionId,
                    name: `Room ${existingRooms.length + i}`,
                    maxParticipants: 10,
                    participants: [],
                    status: 'waiting',
                    createdAt: new Date().toISOString()
                }
                createdRooms.push(newRoom)
            }
        }
        // Create specific rooms
        else if (rooms && Array.isArray(rooms)) {
            for (const roomData of rooms) {
                try {
                    const validated = createRoomSchema.parse({ sessionId, ...roomData })
                    const newRoom: BreakoutRoom = {
                        id: `br_${sessionId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        sessionId: validated.sessionId,
                        name: validated.name,
                        topic: validated.topic,
                        maxParticipants: validated.maxParticipants,
                        duration: validated.duration,
                        participants: [],
                        status: 'waiting',
                        createdAt: new Date().toISOString()
                    }
                    createdRooms.push(newRoom)
                } catch (validationError) {
                    // Skip invalid rooms
                }
            }
        }
        // Create single room
        else if (body.name) {
            const validated = createRoomSchema.parse(body)
            const newRoom: BreakoutRoom = {
                id: `br_${sessionId}_${Date.now()}`,
                sessionId: validated.sessionId,
                name: validated.name,
                topic: validated.topic,
                maxParticipants: validated.maxParticipants,
                duration: validated.duration,
                participants: [],
                status: 'waiting',
                createdAt: new Date().toISOString()
            }
            createdRooms.push(newRoom)
        }

        // Add created rooms to store
        breakoutRoomsStore.set(sessionId, [...existingRooms, ...createdRooms])

        return NextResponse.json({
            success: true,
            createdRooms: createdRooms.map(r => ({
                id: r.id,
                name: r.name,
                topic: r.topic,
                status: r.status
            })),
            totalRooms: existingRooms.length + createdRooms.length,
            message: `Created ${createdRooms.length} breakout room(s)`
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
        const { sessionId, roomId, action, participantIds } = body

        if (!sessionId || !action) {
            return NextResponse.json(
                { error: 'sessionId and action are required' },
                { status: 400 }
            )
        }

        const rooms = breakoutRoomsStore.get(sessionId)
        if (!rooms) {
            return NextResponse.json({ error: 'No breakout rooms found for this session' }, { status: 404 })
        }

        switch (action) {
            case 'start_all': {
                // Start all waiting rooms
                const updatedRooms = rooms.map(room => ({
                    ...room,
                    status: room.status === 'waiting' ? 'active' as const : room.status,
                    startedAt: room.status === 'waiting' ? new Date().toISOString() : room.startedAt
                }))
                breakoutRoomsStore.set(sessionId, updatedRooms)
                return NextResponse.json({ success: true, message: 'All breakout rooms started' })
            }

            case 'close_all': {
                // Close all active rooms
                const updatedRooms = rooms.map(room => ({
                    ...room,
                    status: 'closed' as const,
                    closedAt: new Date().toISOString()
                }))
                breakoutRoomsStore.set(sessionId, updatedRooms)
                return NextResponse.json({ success: true, message: 'All breakout rooms closed' })
            }

            case 'start': {
                if (!roomId) {
                    return NextResponse.json({ error: 'roomId is required for start action' }, { status: 400 })
                }
                const roomIndex = rooms.findIndex(r => r.id === roomId)
                if (roomIndex === -1) {
                    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
                }
                rooms[roomIndex] = {
                    ...rooms[roomIndex],
                    status: 'active',
                    startedAt: new Date().toISOString()
                }
                breakoutRoomsStore.set(sessionId, rooms)
                return NextResponse.json({ success: true, message: 'Breakout room started' })
            }

            case 'close': {
                if (!roomId) {
                    return NextResponse.json({ error: 'roomId is required for close action' }, { status: 400 })
                }
                const roomIndex = rooms.findIndex(r => r.id === roomId)
                if (roomIndex === -1) {
                    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
                }
                rooms[roomIndex] = {
                    ...rooms[roomIndex],
                    status: 'closed',
                    closedAt: new Date().toISOString()
                }
                breakoutRoomsStore.set(sessionId, rooms)
                return NextResponse.json({ success: true, message: 'Breakout room closed' })
            }

            case 'assign_participants': {
                if (!roomId || !participantIds || !Array.isArray(participantIds)) {
                    return NextResponse.json({ error: 'roomId and participantIds array are required' }, { status: 400 })
                }
                const roomIndex = rooms.findIndex(r => r.id === roomId)
                if (roomIndex === -1) {
                    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
                }
                const room = rooms[roomIndex]
                const newParticipants = [...new Set([...room.participants, ...participantIds])]
                if (newParticipants.length > room.maxParticipants) {
                    return NextResponse.json({ error: 'Room capacity exceeded' }, { status: 400 })
                }
                rooms[roomIndex] = { ...room, participants: newParticipants }
                breakoutRoomsStore.set(sessionId, rooms)
                return NextResponse.json({
                    success: true,
                    message: `Assigned ${participantIds.length} participants`,
                    participantCount: newParticipants.length
                })
            }

            case 'remove_participant': {
                if (!roomId || !body.participantId) {
                    return NextResponse.json({ error: 'roomId and participantId are required' }, { status: 400 })
                }
                const roomIndex = rooms.findIndex(r => r.id === roomId)
                if (roomIndex === -1) {
                    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
                }
                rooms[roomIndex].participants = rooms[roomIndex].participants.filter(p => p !== body.participantId)
                breakoutRoomsStore.set(sessionId, rooms)
                return NextResponse.json({ success: true, message: 'Participant removed' })
            }

            case 'join': {
                // Participant joining a room
                if (!roomId) {
                    return NextResponse.json({ error: 'roomId is required' }, { status: 400 })
                }
                const roomIndex = rooms.findIndex(r => r.id === roomId)
                if (roomIndex === -1) {
                    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
                }
                const room = rooms[roomIndex]
                if (room.status !== 'active') {
                    return NextResponse.json({ error: 'Room is not active' }, { status: 400 })
                }
                if (room.participants.length >= room.maxParticipants) {
                    return NextResponse.json({ error: 'Room is full' }, { status: 400 })
                }
                if (!room.participants.includes(session.user.id)) {
                    room.participants.push(session.user.id)
                    breakoutRoomsStore.set(sessionId, rooms)
                }
                return NextResponse.json({ success: true, message: 'Joined room', room: { id: room.id, name: room.name } })
            }

            case 'leave': {
                // Participant leaving a room
                if (!roomId) {
                    return NextResponse.json({ error: 'roomId is required' }, { status: 400 })
                }
                const roomIndex = rooms.findIndex(r => r.id === roomId)
                if (roomIndex !== -1) {
                    rooms[roomIndex].participants = rooms[roomIndex].participants.filter(p => p !== session.user.id)
                    breakoutRoomsStore.set(sessionId, rooms)
                }
                return NextResponse.json({ success: true, message: 'Left room' })
            }

            case 'delete_all': {
                breakoutRoomsStore.delete(sessionId)
                return NextResponse.json({ success: true, message: 'All breakout rooms deleted' })
            }

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }
    } catch (error) {
        console.error('Breakout rooms PATCH error:', error)
        return NextResponse.json(
            { error: 'Failed to update breakout rooms' },
            { status: 500 }
        )
    }
}

