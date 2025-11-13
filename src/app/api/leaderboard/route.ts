import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCourseLeaderboard, getUserLeaderboardPosition } from '@/services/leaderboardService'
import { prisma } from '@/lib/prisma'

// GET /api/leaderboard?courseId=xxx&userId=xxx&limit=10
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const courseId = searchParams.get('courseId')
    const userId = searchParams.get('userId') || session.user.id
    const limit = parseInt(searchParams.get('limit') || '10')

    let leaderboard

    if (courseId) {
      // Get course-specific leaderboard
      leaderboard = await getCourseLeaderboard(courseId, limit)
    } else {
      // Get global leaderboard (aggregate across all courses)
      const allEntries = await prisma.leaderboardEntry.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              arabicName: true,
              profileImage: true,
              image: true,
            }
          }
        }
      })

      // Group by user and sum scores
      const userScoresMap = new Map<string, any>()
      allEntries.forEach((entry) => {
        const existing = userScoresMap.get(entry.userId)
        if (existing) {
          existing.totalScore += entry.totalScore || 0
          existing.quizScore += entry.quizScore || 0
          existing.projectScore += entry.projectScore || 0
          existing.participationScore += entry.participationScore || 0
        } else {
          userScoresMap.set(entry.userId, {
            userId: entry.userId,
            user: entry.user,
            totalScore: entry.totalScore || 0,
            quizScore: entry.quizScore || 0,
            projectScore: entry.projectScore || 0,
            participationScore: entry.participationScore || 0,
          })
        }
      })

      // Sort by total score and limit
      leaderboard = Array.from(userScoresMap.values())
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, limit)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }))
    }

    // Mark current user
    const transformedLeaderboard = leaderboard.map(entry => ({
      rank: entry.rank,
      userId: entry.user?.id || entry.userId,
      userName: entry.user?.name || entry.user?.arabicName || 'Anonymous',
      userImage: entry.user?.profileImage || entry.user?.image,
      totalScore: entry.totalScore || 0,
      quizScore: entry.quizScore || 0,
      projectScore: entry.projectScore || 0,
      participationScore: entry.participationScore || 0,
      isCurrentUser: entry.userId === userId || entry.user?.id === userId,
    }))

    // Get current user's position if not in top list
    let userPosition = null
    if (courseId) {
      userPosition = await getUserLeaderboardPosition(userId, courseId)
    }

    return NextResponse.json({
      leaderboard: transformedLeaderboard,
      userPosition,
      total: transformedLeaderboard.length,
    })
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}
