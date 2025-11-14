import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, sessionId, offer, answer, candidate } = await req.json()

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    // Store signaling data in database for real-time retrieval
    const signalingData = await prisma.videoCallSignal.create({
      data: {
        sessionId,
        fromUserId: session.user.id,
        type,
        data: JSON.stringify({ offer, answer, candidate }),
        createdAt: new Date()
      }
    })

    // In a production app, you would push this to a WebSocket connection
    // For now, we'll store it and let the other user poll for updates
    
    return NextResponse.json({ 
      success: true,
      signalId: signalingData.id 
    })

  } catch (error) {
    console.error('Video call signaling error:', error)
    return NextResponse.json(
      { error: 'Failed to process signaling message' },
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
    const sessionId = searchParams.get('sessionId')
    const lastSignalId = searchParams.get('lastSignalId') || '0'

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    // Get new signaling messages since last check
    const signals = await prisma.videoCallSignal.findMany({
      where: {
        sessionId,
        fromUserId: { not: session.user.id }, // Only get signals from other user
        id: { gt: parseInt(lastSignalId) }
      },
      orderBy: { createdAt: 'asc' },
      take: 10 // Limit to prevent spam
    })

    const formattedSignals = signals.map(signal => ({
      id: signal.id,
      type: signal.type,
      data: JSON.parse(signal.data),
      createdAt: signal.createdAt
    }))

    return NextResponse.json({ signals: formattedSignals })

  } catch (error) {
    console.error('Video call signaling fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch signaling messages' },
      { status: 500 }
    )
  }
}
