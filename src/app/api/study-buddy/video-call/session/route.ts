import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { VideoCallStatus } from '@prisma/client'

const createSessionSchema = z.object({
  studySessionId: z.string(),
  inviteeId: z.string(),
  title: z.string().min(1),
  description: z.string().optional()
})

const joinSessionSchema = z.object({
  sessionId: z.string()
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { action } = body

    if (action === 'create') {
      const validation = createSessionSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json({ error: validation.error.issues }, { status: 400 })
      }

      const { studySessionId, inviteeId, title, description } = validation.data

      // Check if users are matched study buddies
      const match = await prisma.studyBuddyMatch.findFirst({
        where: {
          OR: [
            { user1Id: session.user.id, user2Id: inviteeId },
            { user1Id: inviteeId, user2Id: session.user.id }
          ],
          status: 'accepted'
        }
      })

      if (!match) {
        return NextResponse.json({ error: 'Can only video call with accepted study buddies' }, { status: 403 })
      }

      // Create video call session
      const videoSession = await prisma.videoCallSession.create({
        data: {
          studySessionId,
          hostId: session.user.id,
          inviteeId,
          title,
          description,
          status: 'PENDING',
          sessionToken: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date()
        }
      })

      // Send notification to invitee
      await prisma.notification.create({
        data: {
          userId: inviteeId,
          type: 'VIDEO_CALL_INCOMING',
          title: 'Video Call Invitation',
          message: `${session.user.name} invited you to a video study session: ${title}`,
          data: {
            videoSessionId: videoSession.id,
            sessionToken: videoSession.sessionToken
          }
        }
      })

      return NextResponse.json({
        sessionId: videoSession.id,
        sessionToken: videoSession.sessionToken,
        status: 'PENDING'
      })

    } else if (action === 'join') {
      const validation = joinSessionSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json({ error: validation.error.issues }, { status: 400 })
      }

      const { sessionId } = validation.data

      // Find and validate session
      const videoSession = await prisma.videoCallSession.findUnique({
        where: { id: sessionId },
        include: {
          host: { select: { id: true, name: true, profileImage: true } },
          invitee: { select: { id: true, name: true, profileImage: true } }
        }
      })

      if (!videoSession) {
        return NextResponse.json({ error: 'Video session not found' }, { status: 404 })
      }

      // Check if user is authorized to join
      if (videoSession.hostId !== session.user.id && videoSession.inviteeId !== session.user.id) {
        return NextResponse.json({ error: 'Not authorized to join this session' }, { status: 403 })
      }

      // Update session status
      let updateData: any = {}
      
      if (videoSession.inviteeId === session.user.id && videoSession.status === 'PENDING') {
        updateData.status = 'ACTIVE'
        updateData.startedAt = new Date()
      } else if (videoSession.status === 'PENDING') {
        updateData.status = 'ACTIVE'
        updateData.startedAt = new Date()
      }

      const updatedSession = await prisma.videoCallSession.update({
        where: { id: sessionId },
        data: updateData
      })

      return NextResponse.json({
        sessionToken: videoSession.sessionToken,
        status: updatedSession.status,
        isHost: videoSession.hostId === session.user.id,
        participants: {
          host: videoSession.host,
          invitee: videoSession.invitee
        }
      })

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Video call session error:', error)
    return NextResponse.json(
      { error: 'Failed to process video call session' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('sessionId')
    const action = searchParams.get('action')

    if (!sessionId || !action) {
      return NextResponse.json({ error: 'Session ID and action required' }, { status: 400 })
    }

    // Find session
    const videoSession = await prisma.videoCallSession.findUnique({
      where: { id: sessionId }
    })

    if (!videoSession) {
      return NextResponse.json({ error: 'Video session not found' }, { status: 404 })
    }

    // Check authorization
    if (videoSession.hostId !== session.user.id && videoSession.inviteeId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    let updateData: any = {}

    switch (action) {
      case 'accept':
        if (videoSession.inviteeId !== session.user.id) {
          return NextResponse.json({ error: 'Only invitee can accept' }, { status: 403 })
        }
        updateData = { status: 'ACTIVE', startedAt: new Date() }
        break

      case 'decline':
        if (videoSession.inviteeId !== session.user.id) {
          return NextResponse.json({ error: 'Only invitee can decline' }, { status: 403 })
        }
        updateData = { status: 'DECLINED', endedAt: new Date() }
        break

      case 'end':
        updateData = { 
          status: 'COMPLETED', 
          endedAt: new Date(),
          duration: videoSession.startedAt ? 
            Math.floor((new Date().getTime() - videoSession.startedAt.getTime()) / 1000) : 0
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const updatedSession = await prisma.videoCallSession.update({
      where: { id: sessionId },
      data: updateData
    })

    return NextResponse.json({
      sessionId: updatedSession.id,
      status: updatedSession.status,
      message: `Session ${action}ed successfully`
    })

  } catch (error) {
    console.error('Video call session update error:', error)
    return NextResponse.json(
      { error: 'Failed to update video call session' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'all'

    const validStatuses: VideoCallStatus[] = ['PENDING', 'ACTIVE', 'DECLINED', 'COMPLETED'];
    const upperStatus = status.toUpperCase();

    // Get user's video call sessions
    const sessions = await prisma.videoCallSession.findMany({
      where: {
        OR: [
          { hostId: session.user.id },
          { inviteeId: session.user.id }
        ],
        ...(status !== 'all' && validStatuses.includes(upperStatus as VideoCallStatus) && { status: upperStatus as VideoCallStatus })
      },
      include: {
        host: { select: { id: true, name: true, profileImage: true } },
        invitee: { select: { id: true, name: true, profileImage: true } },
        studySession: { 
          select: { 
            id: true, 
            title: true, 
            scheduledAt: true 
          } 
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    return NextResponse.json({ sessions })

  } catch (error) {
    console.error('Video call sessions fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch video call sessions' },
      { status: 500 }
    )
  }
}
