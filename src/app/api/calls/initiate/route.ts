import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()
    const { inviteeId, title, description, callType } = body

    // Validate input
    if (!inviteeId || !title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
    )
    }

    // Generate unique session token
    const sessionToken = crypto.randomBytes(32).toString('hex')

    // Create video call session
    const videoCallSession = await prisma.videoCallSession.create({
      data: {
        hostId: userId,
        inviteeId,
        title,
        description: description || null,
        sessionToken,
        status: 'PENDING',
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        invitee: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
    })

    // Create notification for invitee
    await prisma.notification.create({
      data: {
        userId: inviteeId,
        type: 'VIDEO_CALL_INCOMING',
        title: callType === 'video' ? 'Incoming Video Call' : 'Incoming Voice Call',
        message: `${session.user.name} is calling you`,
        data: {
          sessionId: videoCallSession.id,
          sessionToken,
          callType,
          hostId: userId,
          hostName: session.user.name,
          hostImage: session.user.image,
        },
      },
    })

    return NextResponse.json({
      session: {
        id: videoCallSession.id,
        sessionToken,
        hostId: videoCallSession.hostId,
        hostName: videoCallSession.host.name,
        hostImage: videoCallSession.host.profileImage,
        inviteeId: videoCallSession.inviteeId,
        inviteeName: videoCallSession.invitee.name,
        inviteeImage: videoCallSession.invitee.profileImage,
        title: videoCallSession.title,
        description: videoCallSession.description,
        status: videoCallSession.status,
        callType,
      },
    })
  } catch (error) {
    console.error('Error initiating call:', error)
    return NextResponse.json(
      { error: 'Failed to initiate call' },
      { status: 500 }
    )
  }
}
