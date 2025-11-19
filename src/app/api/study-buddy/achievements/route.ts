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

    const achievements = await generateUserAchievements(session.user.id)

    return NextResponse.json({
      achievements
    })

  } catch (error) {
    console.error('Failed to fetch achievements:', error)
    return NextResponse.json({
      error: 'Failed to fetch achievements'
    }, { status: 500 })
  }
}

async function generateUserAchievements(userId: string) {
  try {
    // Get user stats
    const [
      completedSessions,
      totalMatches,
      studyTimeResult,
      videoCallsResult
    ] = await Promise.all([
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
      }),
      prisma.videoCallSession.count({
        where: {
          OR: [
            { hostId: userId },
            { inviteeId: userId }
          ],
          status: 'COMPLETED'
        }
      })
    ])

    const studyMinutes = studyTimeResult._sum.duration || 0
    const studyHours = studyMinutes / 60
    const currentStreak = await calculateCurrentStreak(userId)

    const achievements = []

    // Session-based achievements
    const sessionAchievements = [
      {
        id: 'first-session',
        title: 'First Steps',
        description: 'Complete your first study session',
        pointsValue: 50,
        category: 'study' as const,
        required: 1,
        current: completedSessions
      },
      {
        id: 'study-starter',
        title: 'Study Starter',
        description: 'Complete 5 study sessions',
        pointsValue: 100,
        category: 'study' as const,
        required: 5,
        current: completedSessions
      },
      {
        id: 'committed-learner',
        title: 'Committed Learner',
        description: 'Complete 10 study sessions',
        pointsValue: 200,
        category: 'study' as const,
        required: 10,
        current: completedSessions
      },
      {
        id: 'study-enthusiast',
        title: 'Study Enthusiast',
        description: 'Complete 25 study sessions',
        pointsValue: 500,
        category: 'milestone' as const,
        required: 25,
        current: completedSessions
      },
      {
        id: 'study-master',
        title: 'Study Master',
        description: 'Complete 50 study sessions',
        pointsValue: 1000,
        category: 'milestone' as const,
        required: 50,
        current: completedSessions
      }
    ]

    // Social achievements
    const socialAchievements = [
      {
        id: 'first-match',
        title: 'Making Friends',
        description: 'Get your first study buddy match',
        pointsValue: 75,
        category: 'social' as const,
        required: 1,
        current: totalMatches
      },
      {
        id: 'social-butterfly',
        title: 'Social Butterfly',
        description: 'Connect with 3 study buddies',
        pointsValue: 150,
        category: 'social' as const,
        required: 3,
        current: totalMatches
      },
      {
        id: 'community-builder',
        title: 'Community Builder',
        description: 'Connect with 5 study buddies',
        pointsValue: 250,
        category: 'social' as const,
        required: 5,
        current: totalMatches
      },
      {
        id: 'super-connector',
        title: 'Super Connector',
        description: 'Connect with 10 study buddies',
        pointsValue: 500,
        category: 'milestone' as const,
        required: 10,
        current: totalMatches
      }
    ]

    // Streak achievements
    const streakAchievements = [
      {
        id: 'getting-started',
        title: 'Getting Started',
        description: 'Maintain a 3-day study streak',
        pointsValue: 100,
        category: 'streak' as const,
        required: 3,
        current: currentStreak
      },
      {
        id: 'week-warrior',
        title: 'Week Warrior',
        description: 'Maintain a 7-day study streak',
        pointsValue: 200,
        category: 'streak' as const,
        required: 7,
        current: currentStreak
      },
      {
        id: 'two-week-champion',
        title: 'Two Week Champion',
        description: 'Maintain a 14-day study streak',
        pointsValue: 400,
        category: 'streak' as const,
        required: 14,
        current: currentStreak
      },
      {
        id: 'monthly-master',
        title: 'Monthly Master',
        description: 'Maintain a 30-day study streak',
        pointsValue: 800,
        category: 'milestone' as const,
        required: 30,
        current: currentStreak
      },
      {
        id: 'streak-legend',
        title: 'Streak Legend',
        description: 'Maintain a 60-day study streak',
        pointsValue: 1500,
        category: 'milestone' as const,
        required: 60,
        current: currentStreak
      }
    ]

    // Study time achievements
    const timeAchievements = [
      {
        id: 'first-hour',
        title: 'First Hour',
        description: 'Study for a total of 1 hour',
        pointsValue: 50,
        category: 'study' as const,
        required: 1,
        current: Math.floor(studyHours)
      },
      {
        id: 'ten-hour-club',
        title: '10 Hour Club',
        description: 'Study for a total of 10 hours',
        pointsValue: 200,
        category: 'study' as const,
        required: 10,
        current: Math.floor(studyHours)
      },
      {
        id: 'dedicated-student',
        title: 'Dedicated Student',
        description: 'Study for a total of 25 hours',
        pointsValue: 400,
        category: 'milestone' as const,
        required: 25,
        current: Math.floor(studyHours)
      },
      {
        id: 'study-marathon',
        title: 'Study Marathon',
        description: 'Study for a total of 50 hours',
        pointsValue: 800,
        category: 'milestone' as const,
        required: 50,
        current: Math.floor(studyHours)
      },
      {
        id: 'century-scholar',
        title: 'Century Scholar',
        description: 'Study for a total of 100 hours',
        pointsValue: 1500,
        category: 'milestone' as const,
        required: 100,
        current: Math.floor(studyHours)
      }
    ]

    // Video call achievements
    const videoAchievements = [
      {
        id: 'first-video-call',
        title: 'Face to Face',
        description: 'Complete your first video call study session',
        pointsValue: 100,
        category: 'study' as const,
        required: 1,
        current: videoCallsResult
      },
      {
        id: 'video-enthusiast',
        title: 'Video Enthusiast',
        description: 'Complete 5 video call study sessions',
        pointsValue: 250,
        category: 'study' as const,
        required: 5,
        current: videoCallsResult
      }
    ]

    // Combine all achievements and process them
    const allPossibleAchievements = [
      ...sessionAchievements,
      ...socialAchievements,
      ...streakAchievements,
      ...timeAchievements,
      ...videoAchievements
    ]

    for (const achievement of allPossibleAchievements) {
      const isUnlocked = achievement.current >= achievement.required
      
      achievements.push({
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        icon: 'trophy', // Could be different icons based on category
        category: achievement.category,
        pointsValue: achievement.pointsValue,
        unlockedAt: isUnlocked ? new Date().toISOString() : undefined,
        progress: {
          current: Math.min(achievement.current, achievement.required),
          required: achievement.required
        }
      })
    }

    // Return only unlocked achievements first, then locked ones
    return achievements.sort((a, b) => {
      if (a.unlockedAt && !b.unlockedAt) return -1
      if (!a.unlockedAt && b.unlockedAt) return 1
      return b.pointsValue - a.pointsValue // Higher value achievements first
    })

  } catch (error) {
    console.error('Error generating achievements:', error)
    return []
  }
}

async function calculateCurrentStreak(userId: string): Promise<number> {
  try {
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

    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const sessionDates = sessions.map(s => {
      const date = new Date(s.createdAt)
      date.setHours(0, 0, 0, 0)
      return date.getTime()
    })
    
    const uniqueDates = [...new Set(sessionDates)].sort((a, b) => b - a)
    let expectedDate = today.getTime()
    
    for (const sessionDate of uniqueDates) {
      if (sessionDate === expectedDate) {
        streak++
        expectedDate -= 24 * 60 * 60 * 1000
      } else if (sessionDate < expectedDate - 24 * 60 * 60 * 1000) {
        break
      }
    }

    return streak

  } catch (error) {
    console.error('Error calculating streak:', error)
    return 0
  }
}
