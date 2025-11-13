import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { sessionId, duration } = body

    // Update video call session
    await prisma.videoCallSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        endedAt: new Date(),
        duration: duration || 0,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error ending call:', error)
    return NextResponse.json(
      { error: 'Failed to end call' },
      { status: 500 }
    )
  }
}
