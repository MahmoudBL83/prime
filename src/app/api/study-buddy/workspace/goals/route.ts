import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { saveGoal, deleteGoal } from '@/services/studyWorkspaceService'

// POST /api/study-buddy/workspace/goals - Create or update goal
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { 
      workspaceId, 
      id, 
      title, 
      description, 
      targetDate,
      status,
      progress,
      category,
      priority,
      milestones
    } = body

    if (!workspaceId || !title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const goal = await saveGoal(workspaceId, session.user.id, {
      id,
      title,
      description,
      targetDate: targetDate ? new Date(targetDate) : undefined,
      status,
      progress,
      category,
      priority,
      milestones
    })

    return NextResponse.json({ goal })
  } catch (error: any) {
    console.error('Goal save error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save goal' },
      { status: 500 }
    )
  }
}

// DELETE /api/study-buddy/workspace/goals?id=xxx - Delete goal
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const goalId = searchParams.get('id')

    if (!goalId) {
      return NextResponse.json(
        { error: 'Goal ID is required' },
        { status: 400 }
      )
    }

    await deleteGoal(goalId, session.user.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Goal delete error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete goal' },
      { status: 500 }
    )
  }
}
