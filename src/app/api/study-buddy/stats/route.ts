import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
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

    const userStats = await calculateComprehensiveUserStats(session.user.id)

    return NextResponse.json({
      stats: userStats
    })

  } catch (error) {
    console.error('Failed to fetch user stats:', error)
    return NextResponse.json({
      error: 'Failed to fetch user stats'
    }, { status: 500 })
  }
}

async function calculateComprehensiveUserStats(userId: string) {
  try {
    // Get basic counts and aggregations
    const [
      completedSessions,
      totalMatches,
      studyTimeResult,
      videoCallsResult
    ] = await Promise.all([
      prisma.studySession.count({
        where: {
          OR: [
            { createdById: userId },
            { participantIds: { has: userId } }
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
            { createdById: userId },
            { participantIds: { has: userId } }
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
            { initiatorId: userId },
            { participantId: userId }
          ],
          status: 'COMPLETED'
        }
      })
    ])

    const studyMinutes = studyTimeResult._sum.duration || 0
    const currentStreak = await calculateStudyStreak(userId)
    const longestStreak = await calculateLongestStreak(userId)

    // Calculate points based on activities
    const basePoints = completedSessions * 50 // 50 points per session
    const studyTimePoints = Math.floor(studyMinutes * 0.5) // 0.5 points per minute
    const matchPoints = totalMatches * 100 // 100 points per match
    const streakBonus = currentStreak * 10 // 10 points per streak day
    const videoCallPoints = videoCallsResult * 75 // 75 points per video call

    const totalPoints = basePoints + studyTimePoints + matchPoints + streakBonus + videoCallPoints

    // Calculate level (every 1000 points = 1 level)
    const level = Math.floor(totalPoints / 1000) + 1
    const currentLevelPoints = totalPoints % 1000
    const nextLevelPoints = 1000

    // Mock achievements count (in real app, this would be from achievements table)
    const achievements = calculateAchievementsCount(completedSessions, totalMatches, currentStreak, studyMinutes)

    return {
      totalPoints,
      currentStreak,
      longestStreak,
      studyMinutes,
      completedSessions,
      totalMatches,
      achievements,
      level,
      nextLevelPoints,
      currentLevelPoints,
      videoCallsCompleted: videoCallsResult,
      averageSessionDuration: completedSessions > 0 ? Math.round(studyMinutes / completedSessions) : 0,
      totalStudyHours: Math.round(studyMinutes / 60 * 10) / 10 // Round to 1 decimal place
    }

  } catch (error) {
    console.error('Error calculating comprehensive user stats:', error)
    return {
      totalPoints: 0,
      currentStreak: 0,
      longestStreak: 0,
      studyMinutes: 0,
      completedSessions: 0,
      totalMatches: 0,
      achievements: 0,
      level: 1,
      nextLevelPoints: 1000,
      currentLevelPoints: 0,
      videoCallsCompleted: 0,
      averageSessionDuration: 0,
      totalStudyHours: 0
    }
  }
}

async function calculateStudyStreak(userId: string): Promise<number> {
  try {
    const sessions = await prisma.studySession.findMany({
      where: {
        OR: [
          { createdById: userId },
          { participantIds: { has: userId } }
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

async function calculateLongestStreak(userId: string): Promise<number> {
  try {
    const sessions = await prisma.studySession.findMany({
      where: {
        OR: [
          { createdById: userId },
          { participantIds: { has: userId } }
        ],
        status: 'COMPLETED'
      },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true }
    })

    if (sessions.length === 0) return 0

    const sessionDates = sessions.map(s => {
      const date = new Date(s.createdAt)
      date.setHours(0, 0, 0, 0)
      return date.getTime()
    })
    
    const uniqueDates = [...new Set(sessionDates)].sort((a, b) => a - b)
    
    let maxStreak = 1
    let currentStreak = 1
    
    for (let i = 1; i < uniqueDates.length; i++) {
      const dayDiff = (uniqueDates[i] - uniqueDates[i - 1]) / (24 * 60 * 60 * 1000)
      
      if (dayDiff === 1) {
        currentStreak++
        maxStreak = Math.max(maxStreak, currentStreak)
      } else {
        currentStreak = 1
      }
    }

    return Math.max(maxStreak, currentStreak)

  } catch (error) {
    console.error('Error calculating longest streak:', error)
    return 0
  }
}

function calculateAchievementsCount(sessions: number, matches: number, streak: number, studyMinutes: number): number {
  let count = 0

  // Session milestones
  if (sessions >= 1) count++    // First Session
  if (sessions >= 5) count++    // Study Starter
  if (sessions >= 10) count++   // Committed Learner
  if (sessions >= 25) count++   // Study Enthusiast
  if (sessions >= 50) count++   // Study Master

  // Match milestones
  if (matches >= 1) count++     // First Match
  if (matches >= 3) count++     // Social Butterfly
  if (matches >= 5) count++     // Community Builder
  if (matches >= 10) count++    // Super Connector

  // Streak milestones
  if (streak >= 3) count++      // Getting Started
  if (streak >= 7) count++      // Week Warrior
  if (streak >= 14) count++     // Two Week Champion
  if (streak >= 30) count++     // Monthly Master
  if (streak >= 60) count++     // Streak Legend

  // Study time milestones (in hours)
  const studyHours = studyMinutes / 60
  if (studyHours >= 1) count++      // First Hour
  if (studyHours >= 10) count++     // 10 Hour Club
  if (studyHours >= 25) count++     // Dedicated Student
  if (studyHours >= 50) count++     // Study Marathon
  if (studyHours >= 100) count++    // Century Scholar

  return count
}