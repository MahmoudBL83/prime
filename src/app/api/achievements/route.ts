import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserAchievements } from '@/services/leaderboardService'

// GET /api/achievements?userId=xxx&courseId=xxx
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId') || session.user.id
    const courseId = searchParams.get('courseId') || undefined

    const achievements = await getUserAchievements(userId, courseId)

    // Group by type for UI
    const grouped = achievements.reduce((acc: any, achievement) => {
      if (!acc[achievement.type]) {
        acc[achievement.type] = []
      }
      acc[achievement.type].push(achievement)
      return acc
    }, {})

    return NextResponse.json({
      achievements,
      grouped,
      totalPoints: achievements.reduce((sum, a) => sum + a.points, 0),
      totalAchievements: achievements.length
    })
  } catch (error) {
    console.error('Error fetching achievements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    )
  }
}
