import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { startCoWatchSession, updateCoWatchState } from '@/services/studyWorkspaceService'

// POST /api/study-buddy/workspace/co-watch - Start co-watch session
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { workspaceId, videoUrl, videoTitle, videoThumbnail, duration } = body

    if (!workspaceId || !videoUrl || !videoTitle) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const coWatchSession = await startCoWatchSession(workspaceId, session.user.id, {
      videoUrl,
      videoTitle,
      videoThumbnail,
      duration
    })

    return NextResponse.json({ session: coWatchSession })
  } catch (error: any) {
    console.error('Co-watch start error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to start co-watch session' },
      { status: 500 }
    )
  }
}

// PATCH /api/study-buddy/workspace/co-watch - Update playback state
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { sessionId, currentTime, isPlaying } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const updated = await updateCoWatchState(sessionId, session.user.id, {
      currentTime,
      isPlaying
    })

    return NextResponse.json({ session: updated })
  } catch (error: any) {
    console.error('Co-watch update error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update co-watch session' },
      { status: 500 }
    )
  }
}
