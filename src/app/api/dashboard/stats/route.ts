import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Fetch all dashboard data in parallel
    const [
      enrolledCourses,
      studyBuddyMatches,
      upcomingSessions,
      achievements,
      learningStreak,
      recentActivity
    ] = await Promise.all([
      // Enrolled courses with progress
      prisma.enrollment.findMany({
        where: { userId },
        include: {
          course: {
            include: {
              creator: {
                include: {
                  user: {
                    select: {
                      name: true,
                      arabicName: true,
                      profileImage: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { lastAccessedAt: 'desc' },
        take: 10
      }),

      // Study Buddy matches (active only)
      prisma.studyBuddyMatch.findMany({
        where: {
          OR: [
            { user1Id: userId },
            { user2Id: userId }
          ],
          status: { in: ['accepted', 'ACTIVE'] }
        },
        include: {
          user1: {
            select: {
              id: true,
              name: true,
              arabicName: true,
              profileImage: true
            }
          },
          user2: {
            select: {
              id: true,
              name: true,
              arabicName: true,
              profileImage: true
            }
          }
        },
        take: 6
      }),

      // Upcoming study sessions
      prisma.studySession.findMany({
        where: {
          match: {
            OR: [
              { user1Id: userId },
              { user2Id: userId }
            ]
          },
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
          scheduledAt: {
            gte: new Date()
          }
        },
        include: {
          match: {
            include: {
              user1: {
                select: {
                  id: true,
                  name: true,
                  arabicName: true,
                  profileImage: true
                }
              },
              user2: {
                select: {
                  id: true,
                  name: true,
                  arabicName: true,
                  profileImage: true
                }
              }
            }
          }
        },
        orderBy: { scheduledAt: 'asc' },
        take: 5
      }),

      // Calculate achievements
      calculateAchievements(userId),

      // Learning streak
      calculateLearningStreak(userId),

      // Recent activity
      getRecentActivity(userId)
    ])

    // Calculate statistics
    const completedCourses = enrolledCourses.filter(e => e.progress === 100).length
    const inProgressCourses = enrolledCourses.filter(e => e.progress > 0 && e.progress < 100).length
    const totalLearningHours = enrolledCourses.reduce((sum, e) => {
      return sum + (e.course.duration * (e.progress / 100))
    }, 0)
    const averageProgress = enrolledCourses.length > 0
      ? enrolledCourses.reduce((sum, e) => sum + e.progress, 0) / enrolledCourses.length
      : 0

    // Format continue learning data
    const continueLearning = enrolledCourses
      .filter(e => e.progress > 0 && e.progress < 100)
      .slice(0, 3)
      .map(e => ({
        id: e.course.id,
        title: e.course.title,
        titleAr: e.course.titleAr,
        progress: e.progress,
        lastAccessed: e.lastAccessedAt?.toISOString() || e.createdAt.toISOString(),
        thumbnail: e.course.thumbnail,
        instructor: {
          name: e.course.creator.user.name,
          arabicName: e.course.creator.user.arabicName
        }
      }))

    // Format study buddy matches
    const formattedMatches = studyBuddyMatches.map(match => {
      const otherUser = match.user1Id === userId ? match.user2 : match.user1
      return {
        id: match.id,
        userId: otherUser.id,
        name: otherUser.name,
        arabicName: otherUser.arabicName,
        profileImage: otherUser.profileImage,
        sharedSubjects: match.sharedSubjects,
        sharedGoals: match.sharedGoals,
        createdAt: match.createdAt.toISOString()
      }
    })

    // Format upcoming sessions
    const formattedSessions = upcomingSessions.map(session => {
      const otherUser = session.match.user1Id === userId 
        ? session.match.user2 
        : session.match.user1
      return {
        id: session.id,
        title: session.title,
        scheduledAt: session.scheduledAt.toISOString(),
        duration: session.duration,
        status: session.status,
        studyTopics: session.studyTopics ? JSON.parse(session.studyTopics) : [],
        partner: {
          id: otherUser.id,
          name: otherUser.name,
          arabicName: otherUser.arabicName,
          profileImage: otherUser.profileImage
        }
      }
    })

    return NextResponse.json({
      stats: {
        totalCourses: enrolledCourses.length,
        completedCourses,
        inProgressCourses,
        averageProgress: Math.round(averageProgress),
        totalLearningHours: Math.round(totalLearningHours),
        studyBuddyMatches: studyBuddyMatches.length,
        upcomingSessionsCount: upcomingSessions.length,
        learningStreak,
        continueLearning,
        studyBuddies: formattedMatches,
        upcomingSessions: formattedSessions,
        achievements,
        recentActivity
      }
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}

async function calculateAchievements(userId: string) {
  const [
    totalCourses,
    completedCourses,
    totalSessions,
    completedSessions,
    studyBuddyMatches
  ] = await Promise.all([
    prisma.enrollment.count({ where: { userId } }),
    prisma.enrollment.count({ where: { userId, progress: 100 } }),
    prisma.studySession.count({
      where: {
        match: {
          OR: [{ user1Id: userId }, { user2Id: userId }]
        }
      }
    }),
    prisma.studySession.count({
      where: {
        match: {
          OR: [{ user1Id: userId }, { user2Id: userId }]
        },
        status: 'COMPLETED'
      }
    }),
    prisma.studyBuddyMatch.count({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
        status: { in: ['accepted', 'ACTIVE'] }
      }
    })
  ])

  const achievements = []

  // Course achievements
  if (completedCourses >= 1) achievements.push({ 
    id: 'first-course', 
    name: 'First Steps', 
    nameAr: 'الخطوات الأولى',
    description: 'Complete your first course', 
    descriptionAr: 'أكمل دورتك الأولى',
    icon: 'trophy',
    color: 'bronze',
    unlockedAt: new Date().toISOString()
  })
  if (completedCourses >= 5) achievements.push({ 
    id: 'five-courses', 
    name: 'Knowledge Seeker', 
    nameAr: 'باحث المعرفة',
    description: 'Complete 5 courses', 
    descriptionAr: 'أكمل 5 دورات',
    icon: 'book',
    color: 'silver',
    unlockedAt: new Date().toISOString()
  })
  if (completedCourses >= 10) achievements.push({ 
    id: 'ten-courses', 
    name: 'Master Learner', 
    nameAr: 'متعلم متمكن',
    description: 'Complete 10 courses', 
    descriptionAr: 'أكمل 10 دورات',
    icon: 'award',
    color: 'gold',
    unlockedAt: new Date().toISOString()
  })

  // Study Buddy achievements
  if (studyBuddyMatches >= 1) achievements.push({ 
    id: 'first-buddy', 
    name: 'Social Learner', 
    nameAr: 'متعلم اجتماعي',
    description: 'Find your first study buddy', 
    descriptionAr: 'ابحث عن رفيق دراسة',
    icon: 'users',
    color: 'green',
    unlockedAt: new Date().toISOString()
  })
  if (completedSessions >= 5) achievements.push({ 
    id: 'five-sessions', 
    name: 'Team Player', 
    nameAr: 'لاعب جماعي',
    description: 'Complete 5 study sessions', 
    descriptionAr: 'أكمل 5 جلسات دراسية',
    icon: 'calendar-check',
    color: 'blue',
    unlockedAt: new Date().toISOString()
  })

  return achievements
}

async function calculateLearningStreak(userId: string) {
  // Get last 30 days of activity
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId,
      lastAccessedAt: {
        gte: thirtyDaysAgo
      }
    },
    orderBy: { lastAccessedAt: 'desc' }
  })

  // Calculate streak
  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0
  let lastDate: Date | null = null

  const activityDates = enrollments
    .map(e => e.lastAccessedAt)
    .filter(date => date !== null) as Date[]

  activityDates.sort((a, b) => b.getTime() - a.getTime())

  for (const date of activityDates) {
    if (!lastDate) {
      tempStreak = 1
      lastDate = date
      continue
    }

    const daysDiff = Math.floor((lastDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff === 1) {
      tempStreak++
    } else if (daysDiff > 1) {
      longestStreak = Math.max(longestStreak, tempStreak)
      tempStreak = 1
    }

    lastDate = date
  }

  currentStreak = tempStreak
  longestStreak = Math.max(longestStreak, tempStreak)

  return {
    current: currentStreak,
    longest: longestStreak,
    lastActivity: activityDates[0]?.toISOString() || null
  }
}

async function getRecentActivity(userId: string) {
  const activities = []

  // Recent enrollments
  const recentEnrollments = await prisma.enrollment.findMany({
    where: { userId },
    include: {
      course: {
        select: {
          title: true,
          titleAr: true,
          thumbnail: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 3
  })

  activities.push(...recentEnrollments.map(e => ({
    type: 'enrollment',
    title: e.course.title,
    titleAr: e.course.titleAr,
    description: 'Started a new course',
    descriptionAr: 'بدأ دورة جديدة',
    timestamp: e.createdAt.toISOString(),
    icon: 'book-open',
    thumbnail: e.course.thumbnail
  })))

  // Recent matches
  const recentMatches = await prisma.studyBuddyMatch.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
      status: { in: ['accepted', 'ACTIVE'] }
    },
    include: {
      user1: { select: { name: true, arabicName: true } },
      user2: { select: { name: true, arabicName: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 2
  })

  activities.push(...recentMatches.map(m => {
    const otherUser = m.user1Id === userId ? m.user2 : m.user1
    return {
      type: 'match',
      title: `New study buddy: ${otherUser.name}`,
      titleAr: `رفيق دراسة جديد: ${otherUser.arabicName || otherUser.name}`,
      description: 'Found a new learning partner',
      descriptionAr: 'وجدت شريك تعلم جديد',
      timestamp: m.createdAt.toISOString(),
      icon: 'users'
    }
  }))

  // Sort by timestamp and take top 5
  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5)
}
