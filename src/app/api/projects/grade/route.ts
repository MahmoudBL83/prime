import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { gradeProjectSubmission } from '@/services/leaderboardService'

// POST /api/projects/grade - Grade a submission
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only instructors/admins can grade
    if (session.user.role !== 'admin' && session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { submissionId, grade, maxGrade, feedback } = body

    if (!submissionId || grade === undefined || !maxGrade) {
      return NextResponse.json(
        { error: 'submissionId, grade, and maxGrade required' },
        { status: 400 }
      )
    }

    const graded = await gradeProjectSubmission(
      submissionId,
      session.user.id,
      { grade, maxGrade, feedback }
    )

    return NextResponse.json({ submission: graded })
  } catch (error: any) {
    console.error('Error grading project:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to grade project' },
      { status: 500 }
    )
  }
}
