import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getOrCreateWorkspace } from '@/services/studyWorkspaceService'

// GET /api/study-buddy/workspace?matchId=xxx - Get or create workspace
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const matchId = searchParams.get('matchId')

    if (!matchId) {
      return NextResponse.json(
        { error: 'Match ID is required' },
        { status: 400 }
      )
    }

    const workspace = await getOrCreateWorkspace(matchId, session.user.id)

    return NextResponse.json({ workspace })
  } catch (error: any) {
    console.error('Workspace fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch workspace' },
      { status: 500 }
    )
  }
}
