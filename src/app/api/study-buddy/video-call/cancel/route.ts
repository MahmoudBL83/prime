import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const cancelCallSchema = z.object({
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
    const validation = cancelCallSchema.safeParse(body)
    
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

    // Check if user has permission to cancel (must be host or invitee)
    if (videoCallSession.hostId !== session.user.id && 
        videoCallSession.inviteeId !== session.user.id) {
      return NextResponse.json({
        error: 'Not authorized to cancel this call'
      }, { status: 403 })
    }

    // Update session status
    const updatedSession = await prisma.videoCallSession.update({
      where: { id: sessionId },
      data: {
        status: 'CANCELLED',
        endedAt: new Date()
      }
    })

    // Notify the other participant
    const otherUserId = videoCallSession.hostId === session.user.id 
      ? videoCallSession.inviteeId 
      : videoCallSession.hostId

    await prisma.notification.create({
      data: {
        userId: otherUserId,
        type: 'VIDEO_CALL_CANCELLED',
        title: 'Call Cancelled',
        message: `${session.user.name} cancelled the video call`,
        data: {
          sessionId,
          cancelledBy: session.user.id
        }
      }
    })

    console.log(`📞 Video call cancelled: ${sessionId} by ${session.user.name}`)

    return NextResponse.json({
      success: true,
      sessionId,
      status: updatedSession.status
    })

  } catch (error) {
    console.error('Failed to cancel video call:', error)
    return NextResponse.json({
      error: 'Failed to cancel video call'
    }, { status: 500 })
  }
}
