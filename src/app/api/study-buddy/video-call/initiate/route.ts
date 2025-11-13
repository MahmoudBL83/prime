import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const initiateCallSchema = z.object({
  targetUserId: z.string(),
  callType: z.enum(['instant', 'scheduled']),
  scheduledTime: z.string().nullable().optional(),
  duration: z.number().min(15).max(240), // 15 minutes to 4 hours
  topic: z.string().optional(),
  studySessionId: z.string().optional().nullable()
})

export async function POST(req: NextRequest) {
  try {
    console.log('📹 [VIDEO CALL API] Request received')
    
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      console.error('❌ [VIDEO CALL API] No session found')
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 })
    }

    console.log('👤 [VIDEO CALL API] User:', session.user.id, session.user.name)

    const body = await req.json()
    console.log('📦 [VIDEO CALL API] Request body:', body)
    
    const validation = initiateCallSchema.safeParse(body)
    
    if (!validation.success) {
      console.error('❌ [VIDEO CALL API] Validation failed:', validation.error.issues)
      return NextResponse.json({
        error: 'Invalid request data',
        details: validation.error.issues
      }, { status: 400 })
    }

    console.log('✅ [VIDEO CALL API] Validation passed')

    const { targetUserId, callType, scheduledTime, duration, topic, studySessionId } = validation.data

    console.log('🔍 [VIDEO CALL API] Looking up target user:', targetUserId)

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, arabicName: true, profileImage: true }
    })

    if (!targetUser) {
      console.error('❌ [VIDEO CALL API] Target user not found:', targetUserId)
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    console.log('✅ [VIDEO CALL API] Target user found:', targetUser.name)
    console.log('🔍 [VIDEO CALL API] Checking study buddy match...')

    // Check if users are study buddies (have an accepted match)
    const studyBuddyMatch = await prisma.studyBuddyMatch.findFirst({
      where: {
        OR: [
          { user1Id: session.user.id, user2Id: targetUserId, status: 'accepted' },
          { user1Id: targetUserId, user2Id: session.user.id, status: 'accepted' }
        ]
      }
    })

    if (!studyBuddyMatch) {
      console.error('❌ [VIDEO CALL API] No study buddy match found between users')
      return NextResponse.json({
        error: 'Can only call study buddies. Please match with this user first.'
      }, { status: 403 })
    }

    console.log('✅ [VIDEO CALL API] Study buddy match verified')

    // Generate unique session token
    const sessionToken = `${Date.now()}-${Math.random().toString(36).substring(7)}`

    console.log('💾 [VIDEO CALL API] Creating video call session...')

    // Create video call session
    const videoCallSession = await prisma.videoCallSession.create({
      data: {
        hostId: session.user.id,
        inviteeId: targetUserId,
        title: topic || `Study session with ${targetUser.arabicName || targetUser.name}`,
        description: callType === 'scheduled' ? `Scheduled for ${scheduledTime}` : 'Instant call',
        status: callType === 'instant' ? 'PENDING' : 'PENDING',
        sessionToken,
        studySessionId,
        duration: duration * 60, // Convert minutes to seconds
        startedAt: callType === 'instant' ? new Date() : null
      }
    })

    console.log('✅ [VIDEO CALL API] Video call session created:', videoCallSession.id)

    // For instant calls, create a notification for the target user
    if (callType === 'instant') {
      try {
        await prisma.notification.create({
          data: {
            userId: targetUserId,
            type: 'VIDEO_CALL_INCOMING',
            title: 'Incoming Video Call 📹',
            message: `${session.user.name} is calling you for a study session`,
            data: {
              sessionId: videoCallSession.id,
              initiatorId: session.user.id,
              initiatorName: session.user.name,
              topic: topic || 'Study session',
              callType: 'incoming'
            }
          }
        })
      } catch (notificationError) {
        console.error('Failed to create notification, but call session created:', notificationError)
      }

      // In a real application, you would send a WebSocket message or push notification here
      console.log(`📞 Video call initiated: ${session.user.name} calling ${targetUser.name}`)
    } else {
      // For scheduled calls, create a notification
      try {
        await prisma.notification.create({
          data: {
            userId: targetUserId,
            type: 'VIDEO_CALL_SCHEDULED',
            title: 'Video Study Session Scheduled 📅',
            message: `${session.user.name} scheduled a video study session with you`,
            data: {
              sessionId: videoCallSession.id,
              scheduledTime: scheduledTime,
              topic: topic || 'Study session',
              callType: 'scheduled'
            }
          }
        })
      } catch (notificationError) {
        console.error('Failed to create notification, but call session created:', notificationError)
      }
    }

    return NextResponse.json({
      sessionId: videoCallSession.id,
      sessionToken: videoCallSession.sessionToken,
      status: videoCallSession.status,
      callType,
      scheduledStartTime: scheduledTime,
      duration: videoCallSession.duration,
      title: videoCallSession.title,
      participant: {
        id: targetUser.id,
        name: targetUser.name,
        arabicName: targetUser.arabicName,
        profileImage: targetUser.profileImage
      }
    })

  } catch (error) {
    console.error('🚨 [VIDEO CALL API] Error initiating video call:', error)
    
    // Provide detailed error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json({
      error: 'Failed to initiate video call',
      details: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}