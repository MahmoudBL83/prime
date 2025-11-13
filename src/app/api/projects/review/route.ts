import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { submitPeerReview } from '@/services/leaderboardService'

// POST /api/projects/review - Submit peer review
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { submissionId, rating, feedback } = body

    if (!submissionId || rating === undefined) {
      return NextResponse.json(
        { error: 'submissionId and rating required' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    const review = await submitPeerReview(
      submissionId,
      session.user.id,
      { rating, feedback }
    )

    return NextResponse.json({ review })
  } catch (error: any) {
    console.error('Error submitting peer review:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to submit review' },
      { status: 500 }
    )
  }
}
