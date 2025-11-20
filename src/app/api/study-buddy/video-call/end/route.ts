import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const endCallSchema = z.object({
  sessionId: z.string()
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 })
    }

    const body = await req.json()
    const validation = endCallSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: validation.error.issues
      }, { status: 400 })
    }

    const { sessionId } = validation.data

    // Find the video call session
    const videoCallSession = await prisma.videoCallSession.findUnique({
      where: { id: sessionId },
      include: {
        host: { select: { id: true, name: true } },
        invitee: { select: { id: true, name: true } }
      }
    })

    if (!videoCallSession) {
      return NextResponse.json({
        error: 'Video call session not found'
      }, { status: 404 })
    }

    // Check if user has permission to end call (must be initiator or participant)
    if (videoCallSession.hostId !== session.user.id && 
        videoCallSession.inviteeId !== session.user.id) {
      return NextResponse.json({
        error: 'Not authorized to end this call'
      }, { status: 403 })
    }

    // Calculate actual duration
    const startTime = videoCallSession.startedAt || videoCallSession.createdAt
    const actualDuration = Math.floor((Date.now() - startTime.getTime()) / 1000 / 60) // minutes

    // Update session status
    const updatedSession = await prisma.videoCallSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        endedAt: new Date(),
        duration: actualDuration * 60, // Convert minutes to seconds
      }
    })

    // Create study session record if this was a successful study call
    if (actualDuration >= 5) { // At least 5 minutes to count as a study session
      try {
        // Note: StudySession creation removed as the model doesn't match the required fields
        // Award points or achievements for completed study sessions
        await Promise.all([
          prisma.notification.create({
            data: {
              userId: videoCallSession.hostId,
              type: 'STUDY_SESSION_COMPLETED',
              title: 'Study Session Completed!',
              message: `Great job! You completed a ${actualDuration}-minute study session with ${videoCallSession.invitee.name}`,
              data: { sessionId, duration: actualDuration }
            }
          }),
          prisma.notification.create({
            data: {
              userId: videoCallSession.inviteeId,
              type: 'STUDY_SESSION_COMPLETED',
              title: 'Study Session Completed!',
              message: `Great job! You completed a ${actualDuration}-minute study session with ${videoCallSession.host.name}`,
              data: { sessionId, duration: actualDuration }
            }
          })
        ])
      } catch (error) {
        console.error('Failed to create notifications:', error)
        // Don't fail the entire request if notifications fail
      }
    }

    // Notify the other participant that call ended
    const otherUserId = videoCallSession.hostId === session.user.id 
      ? videoCallSession.inviteeId 
      : videoCallSession.hostId

    await prisma.notification.create({
      data: {
        userId: otherUserId,
        type: 'VIDEO_CALL_ENDED',
        title: 'Call Ended',
        message: `Video call ended. Duration: ${actualDuration} minutes`,
        data: {
          sessionId,
          duration: actualDuration,
          endedBy: session.user.id
        }
      }
    })

    console.log(`📞 Video call ended: ${sessionId} (${actualDuration} minutes)`)

    return NextResponse.json({
      success: true,
      sessionId,
      status: updatedSession.status,
      duration: actualDuration,
      endTime: updatedSession.endedAt
    })

  } catch (error) {
    console.error('Failed to end video call:', error)
    return NextResponse.json({
      error: 'Failed to end video call'
    }, { status: 500 })
  }
}
