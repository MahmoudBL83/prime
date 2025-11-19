import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const filter = searchParams.get('filter') || 'all'

    // Get user's recent activities
    const activities = await generateUserActivities(session.user.id, limit, filter)

    return NextResponse.json({
      activities,
      total: activities.length
    })

  } catch (error) {
    console.error('Failed to fetch activity feed:', error)
    return NextResponse.json({
      error: 'Failed to fetch activity feed'
    }, { status: 500 })
  }
}

async function generateUserActivities(userId: string, limit: number, filter: string) {
  const activities: any[] = []

  try {
    // Recent study sessions
    if (filter === 'all' || filter === 'sessions') {
      const recentSessions = await prisma.studySession.findMany({
        where: {
          OR: [
            { createdBy: userId },
            {
              match: {
                OR: [
                  { user1Id: userId },
                  { user2Id: userId }
                ]
              }
            }
          ],
          status: 'COMPLETED'
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          match: {
            include: {
              user1: { select: { id: true, name: true, arabicName: true, profileImage: true } },
              user2: { select: { id: true, name: true, arabicName: true, profileImage: true } }
            }
          }
        }
      })

      for (const session of recentSessions) {
        // Get other participant info from match
        let relatedUser = null
        
        if (session.match) {
          const otherUser = session.match.user1Id === userId ? session.match.user2 : session.match.user1
          if (otherUser) {
            relatedUser = otherUser
          }
        }

        activities.push({
          id: `session-${session.id}`,
          type: 'study_session_completed',
          title: `Completed study session: ${session.title}`,
          description: `You studied for ${session.duration} minutes`,
          timestamp: session.createdAt.toISOString(),
          points: Math.floor(session.duration * 0.5), // 0.5 points per minute
          metadata: {
            sessionId: session.id,
            duration: session.duration
          },
          relatedUser
        })
      }
    }

    // Recent matches
    if (filter === 'all' || filter === 'social') {
      const recentMatches = await prisma.studyBuddyMatch.findMany({
        where: {
          OR: [
            { user1Id: userId },
            { user2Id: userId }
          ],
          status: 'accepted'
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: {
          user1: { select: { id: true, name: true, arabicName: true, profileImage: true } },
          user2: { select: { id: true, name: true, arabicName: true, profileImage: true } }
        }
      })

      for (const match of recentMatches) {
        const otherUser = match.user1Id === userId ? match.user2 : match.user1
        
        activities.push({
          id: `match-${match.id}`,
          type: 'match_created',
          title: 'New study buddy match!',
          description: `You matched with ${otherUser.arabicName || otherUser.name}`,
          timestamp: match.updatedAt.toISOString(),
          points: 50, // Fixed points for matches
          metadata: {
            matchId: match.id
          },
          relatedUser: otherUser
        })
      }
    }

    // Calculate current streak and add streak milestones
    if (filter === 'all' || filter === 'achievements') {
      const streak = await calculateStudyStreak(userId)
      
      if (streak > 0 && [7, 14, 30, 60, 100].includes(streak)) {
        activities.push({
          id: `streak-${streak}`,
          type: 'streak_milestone',
          title: `${streak} Day Study Streak! 🔥`,
          description: `Amazing! You've studied for ${streak} days in a row`,
          timestamp: new Date().toISOString(),
          points: streak * 10, // More points for longer streaks
          metadata: {
            streakDays: streak
          }
        })
      }
    }

    // Mock achievements for demo (in real app, these would be stored in database)
    if (filter === 'all' || filter === 'achievements') {
      const userStats = await calculateUserStats(userId)
      
      const mockAchievements = []
      
      if (userStats.completedSessions >= 5 && userStats.completedSessions < 10) {
        mockAchievements.push({
          id: 'first-five-sessions',
          type: 'achievement_unlocked',
          title: 'Study Starter',
          description: 'Completed your first 5 study sessions!',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          points: 100
        })
      }
      
      if (userStats.totalMatches >= 3) {
        mockAchievements.push({
          id: 'social-butterfly',
          type: 'achievement_unlocked',
          title: 'Social Butterfly',
          description: 'Made 3+ study buddy connections!',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          points: 150
        })
      }

      activities.push(...mockAchievements)
    }

    // Sort all activities by timestamp and limit
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)

  } catch (error) {
    console.error('Error generating user activities:', error)
    return []
  }
}

async function calculateStudyStreak(userId: string): Promise<number> {
  try {
    // Get all completed study sessions ordered by date
    const sessions = await prisma.studySession.findMany({
      where: {
        OR: [
          { createdBy: userId },
          {
            match: {
              OR: [
                { user1Id: userId },
                { user2Id: userId }
              ]
            }
          }
        ],
        status: 'COMPLETED'
      },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    })

    if (sessions.length === 0) return 0

    // Calculate consecutive days
    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const sessionDates = sessions.map(s => {
      const date = new Date(s.createdAt)
      date.setHours(0, 0, 0, 0)
      return date.getTime()
    })
    
    // Remove duplicates and sort
    const uniqueDates = [...new Set(sessionDates)].sort((a, b) => b - a)
    
    let expectedDate = today.getTime()
    
    for (const sessionDate of uniqueDates) {
      if (sessionDate === expectedDate) {
        streak++
        expectedDate -= 24 * 60 * 60 * 1000 // Previous day
      } else if (sessionDate < expectedDate - 24 * 60 * 60 * 1000) {
        // Gap in streak
        break
      }
    }

    return streak

  } catch (error) {
    console.error('Error calculating streak:', error)
    return 0
  }
}

async function calculateUserStats(userId: string) {
  try {
    const [sessions, matches, studyTime] = await Promise.all([
      prisma.studySession.count({
        where: {
          OR: [
            { createdBy: userId },
            {
              match: {
                OR: [
                  { user1Id: userId },
                  { user2Id: userId }
                ]
              }
            }
          ],
          status: 'COMPLETED'
        }
      }),
      prisma.studyBuddyMatch.count({
        where: {
          OR: [
            { user1Id: userId },
            { user2Id: userId }
          ],
          status: 'accepted'
        }
      }),
      prisma.studySession.aggregate({
        where: {
          OR: [
            { createdBy: userId },
            {
              match: {
                OR: [
                  { user1Id: userId },
                  { user2Id: userId }
                ]
              }
            }
          ],
          status: 'COMPLETED'
        },
        _sum: {
          duration: true
        }
      })
    ])

    return {
      completedSessions: sessions,
      totalMatches: matches,
      studyMinutes: studyTime._sum?.duration || 0
    }

  } catch (error) {
    console.error('Error calculating user stats:', error)
    return {
      completedSessions: 0,
      totalMatches: 0,
      studyMinutes: 0
    }
  }
}
