import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
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
        initiator: { select: { id: true, name: true } },
        participant: { select: { id: true, name: true } }
      }
    })

    if (!videoCallSession) {
      return NextResponse.json({
        error: 'Video call session not found'
      }, { status: 404 })
    }

    // Check if user has permission to end call (must be initiator or participant)
    if (videoCallSession.initiatorId !== session.user.id && 
        videoCallSession.participantId !== session.user.id) {
      return NextResponse.json({
        error: 'Not authorized to end this call'
      }, { status: 403 })
    }

    // Calculate actual duration
    const startTime = videoCallSession.startTime || videoCallSession.createdAt
    const actualDuration = Math.floor((Date.now() - startTime.getTime()) / 1000 / 60) // minutes

    // Update session status
    const updatedSession = await prisma.videoCallSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        endTime: new Date(),
        actualDuration,
        metadata: {
          ...videoCallSession.metadata as any,
          endedBy: session.user.id,
          endedAt: new Date().toISOString(),
          actualDurationMinutes: actualDuration
        }
      }
    })

    // Create study session record if this was a successful study call
    if (actualDuration >= 5) { // At least 5 minutes to count as a study session
      try {
        await prisma.studySession.create({
          data: {
            title: videoCallSession.topic || 'Video Study Session',
            description: `Video call study session between ${videoCallSession.initiator.name} and ${videoCallSession.participant.name}`,
            scheduledTime: videoCallSession.scheduledStartTime || videoCallSession.startTime || videoCallSession.createdAt,
            duration: actualDuration,
            status: 'COMPLETED',
            sessionType: 'VIDEO_CALL',
            participantIds: [videoCallSession.initiatorId, videoCallSession.participantId],
            createdById: videoCallSession.initiatorId,
            metadata: {
              videoCallSessionId: sessionId,
              callDuration: actualDuration,
              callType: videoCallSession.callType
            }
          }
        })

        // Award points or achievements for completed study sessions
        await Promise.all([
          prisma.notification.create({
            data: {
              userId: videoCallSession.initiatorId,
              type: 'STUDY_SESSION_COMPLETED',
              title: 'Study Session Completed!',
              message: `Great job! You completed a ${actualDuration}-minute study session with ${videoCallSession.participant.name}`,
              data: { sessionId, duration: actualDuration }
            }
          }),
          prisma.notification.create({
            data: {
              userId: videoCallSession.participantId,
              type: 'STUDY_SESSION_COMPLETED',
              title: 'Study Session Completed!',
              message: `Great job! You completed a ${actualDuration}-minute study session with ${videoCallSession.initiator.name}`,
              data: { sessionId, duration: actualDuration }
            }
          })
        ])
      } catch (error) {
        console.error('Failed to create study session record:', error)
        // Don't fail the entire request if study session creation fails
      }
    }

    // Notify the other participant that call ended
    const otherUserId = videoCallSession.initiatorId === session.user.id 
      ? videoCallSession.participantId 
      : videoCallSession.initiatorId

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
      endTime: updatedSession.endTime
    })

  } catch (error) {
    console.error('Failed to end video call:', error)
    return NextResponse.json({
      error: 'Failed to end video call'
    }, { status: 500 })
  }
}