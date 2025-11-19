import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getCourseRewards, awardReward } from '@/services/leaderboardService'

// GET /api/rewards?courseId=xxx&status=active
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const courseId = searchParams.get('courseId') || undefined
    const status = searchParams.get('status') // 'active' or 'past'

    let rewards = await getCourseRewards(courseId)

    // Filter by status if specified
    const now = new Date()
    if (status === 'active') {
      rewards = rewards.filter(r => !r.endDate || r.endDate >= now)
    } else if (status === 'past') {
      rewards = rewards.filter(r => r.endDate && r.endDate < now)
    }

    // Transform to include current winners count
    const transformedRewards = rewards.map(reward => ({
      ...reward,
      currentWinners: reward.winners?.length || 0,
      courseTitle: reward.course?.title,
      isActive: !reward.endDate || reward.endDate >= now,
    }))

    return NextResponse.json({ 
      rewards: transformedRewards,
      total: transformedRewards.length
    })
  } catch (error) {
    console.error('Error fetching rewards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rewards' },
      { status: 500 }
    )
  }
}

// POST /api/rewards - Award reward
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can award rewards
    if (session.user.role !== 'ADMIN' && session.user.role !== 'CREATOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { rewardId, userId, rank } = body

    if (!rewardId || !userId) {
      return NextResponse.json(
        { error: 'rewardId and userId required' },
        { status: 400 }
      )
    }

    const winner = await awardReward(rewardId, userId, rank)

    return NextResponse.json({ winner })
  } catch (error: any) {
    console.error('Error awarding reward:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to award reward' },
      { status: 500 }
    )
  }
}
