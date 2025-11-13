import { prisma } from '@/lib/prisma'

/**
 * Leaderboard Service
 * Handles course leaderboards, rankings, and score calculations
 */

// Get course leaderboard
export async function getCourseLeaderboard(courseId: string, limit: number = 10) {
  const entries = await prisma.leaderboardEntry.findMany({
    where: { courseId },
    orderBy: { totalScore: 'desc' },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          arabicName: true,
          profileImage: true
        }
      }
    }
  })

  // Calculate ranks
  const rankedEntries = entries.map((entry, index) => ({
    ...entry,
    rank: index + 1
  }))

  return rankedEntries
}

// Get user's leaderboard position
export async function getUserLeaderboardPosition(userId: string, courseId: string) {
  const entry = await prisma.leaderboardEntry.findUnique({
    where: {
      userId_courseId: { userId, courseId }
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          arabicName: true,
          profileImage: true
        }
      }
    }
  })

  if (!entry) {
    return null
  }

  // Get rank by counting entries with higher score
  const higherScores = await prisma.leaderboardEntry.count({
    where: {
      courseId,
      totalScore: { gt: entry.totalScore }
    }
  })

  const rank = higherScores + 1

  // Get total participants
  const totalParticipants = await prisma.leaderboardEntry.count({
    where: { courseId }
  })

  return {
    ...entry,
    rank,
    totalParticipants
  }
}

// Update leaderboard entry scores
export async function updateLeaderboardScore(
  userId: string,
  courseId: string,
  scores: {
    quizScore?: number
    projectScore?: number
    participationScore?: number
  }
) {
  const existing = await prisma.leaderboardEntry.findUnique({
    where: {
      userId_courseId: { userId, courseId }
    }
  })

  const totalScore = (scores.quizScore || existing?.quizScore || 0) +
                    (scores.projectScore || existing?.projectScore || 0) +
                    (scores.participationScore || existing?.participationScore || 0)

  const entry = await prisma.leaderboardEntry.upsert({
    where: {
      userId_courseId: { userId, courseId }
    },
    create: {
      userId,
      courseId,
      quizScore: scores.quizScore || 0,
      projectScore: scores.projectScore || 0,
      participationScore: scores.participationScore || 0,
      totalScore,
      lastUpdated: new Date()
    },
    update: {
      quizScore: scores.quizScore !== undefined ? scores.quizScore : undefined,
      projectScore: scores.projectScore !== undefined ? scores.projectScore : undefined,
      participationScore: scores.participationScore !== undefined ? scores.participationScore : undefined,
      totalScore,
      lastUpdated: new Date()
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          arabicName: true,
          profileImage: true
        }
      }
    }
  })

  return entry
}

// Record quiz attempt and update leaderboard
export async function recordQuizAttempt(
  userId: string,
  courseId: string,
  quizId: string,
  data: {
    score: number
    maxScore: number
    timeSpent: number
    answers?: any
  }
) {
  const percentage = (data.score / data.maxScore) * 100

  // Create quiz attempt (check for existing model structure)
  const attempt = await prisma.quizAttempt.create({
    data: {
      userId,
      quizId,
      score: data.score,
      maxScore: data.maxScore,
      passed: percentage >= 60, // 60% pass threshold
      timeSpent: data.timeSpent,
      completedAt: new Date()
    }
  })

  // Update leaderboard quiz score
  const existingEntry = await prisma.leaderboardEntry.findUnique({
    where: {
      userId_courseId: { userId, courseId }
    }
  })

  const newQuizScore = (existingEntry?.quizScore || 0) + data.score

  await updateLeaderboardScore(userId, courseId, {
    quizScore: newQuizScore
  })

  // Check for achievements
  await checkQuizAchievements(userId, courseId, data.score, data.maxScore)

  return attempt
}

// Get user achievements
export async function getUserAchievements(userId: string, courseId?: string) {
  const where: any = { userId }
  if (courseId) {
    where.OR = [
      { courseId },
      { courseId: null } // Global achievements
    ]
  }

  const achievements = await prisma.achievement.findMany({
    where,
    orderBy: { unlockedAt: 'desc' },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          titleAr: true
        }
      }
    }
  })

  return achievements
}

// Unlock achievement
export async function unlockAchievement(
  userId: string,
  type: string,
  data: {
    title: string
    titleAr?: string
    description: string
    descriptionAr?: string
    points?: number
    courseId?: string
    icon?: string
  }
) {
  // Check if already unlocked
  const existing = await prisma.achievement.findFirst({
    where: {
      userId,
      type: type as any,
      courseId: data.courseId || null
    }
  })

  if (existing) {
    return existing
  }

  const achievement = await prisma.achievement.create({
    data: {
      userId,
      type: type as any,
      title: data.title,
      titleAr: data.titleAr,
      description: data.description,
      descriptionAr: data.descriptionAr,
      points: data.points || 10,
      courseId: data.courseId,
      icon: data.icon
    }
  })

  // Update participation score
  if (data.courseId) {
    const existing = await prisma.leaderboardEntry.findUnique({
      where: {
        userId_courseId: { userId, courseId: data.courseId }
      }
    })

    await updateLeaderboardScore(userId, data.courseId, {
      participationScore: (existing?.participationScore || 0) + (data.points || 10)
    })
  }

  return achievement
}

// Check for quiz-related achievements
async function checkQuizAchievements(
  userId: string,
  courseId: string,
  score: number,
  maxScore: number
) {
  const percentage = (score / maxScore) * 100

  // Perfect Score Achievement
  if (percentage === 100) {
    await unlockAchievement(userId, 'PERFECT_SCORE', {
      title: 'Perfect Score',
      titleAr: 'درجة كاملة',
      description: 'Achieved 100% on a quiz',
      descriptionAr: 'حصلت على 100٪ في اختبار',
      points: 50,
      courseId,
      icon: '🎯'
    })
  }

  // Quiz Master (check total quizzes completed)
  const quizCount = await prisma.quizAttempt.count({
    where: {
      userId,
      passed: true
    }
  })

  if (quizCount >= 10) {
    await unlockAchievement(userId, 'QUIZ_MASTER', {
      title: 'Quiz Master',
      titleAr: 'خبير الاختبارات',
      description: 'Passed 10 or more quizzes',
      descriptionAr: 'اجتاز 10 اختبارات أو أكثر',
      points: 100,
      icon: '🏆'
    })
  }
}

// Get active rewards for course
export async function getCourseRewards(courseId?: string) {
  const where: any = {
    isActive: true,
    OR: [
      { endDate: null },
      { endDate: { gte: new Date() } }
    ]
  }

  if (courseId) {
    where.courseId = courseId
  }

  const rewards = await prisma.reward.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          titleAr: true
        }
      },
      winners: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              arabicName: true,
              profileImage: true
            }
          }
        }
      }
    }
  })

  return rewards
}

// Award reward to user
export async function awardReward(
  rewardId: string,
  userId: string,
  rank?: number
) {
  const reward = await prisma.reward.findUnique({
    where: { id: rewardId }
  })

  if (!reward) {
    throw new Error('Reward not found')
  }

  // Check if already awarded
  const existing = await prisma.rewardWinner.findUnique({
    where: {
      rewardId_userId: { rewardId, userId }
    }
  })

  if (existing) {
    return existing
  }

  // Check max winners
  if (reward.maxWinners) {
    const winnersCount = await prisma.rewardWinner.count({
      where: { rewardId }
    })

    if (winnersCount >= reward.maxWinners) {
      throw new Error('Maximum winners reached')
    }
  }

  const winner = await prisma.rewardWinner.create({
    data: {
      rewardId,
      userId,
      rank,
      status: 'PENDING'
    },
    include: {
      reward: true,
      user: {
        select: {
          id: true,
          name: true,
          arabicName: true,
          email: true
        }
      }
    }
  })

  return winner
}

// Submit project
export async function submitProject(
  userId: string,
  courseId: string,
  projectId: string,
  data: {
    title: string
    description?: string
    fileUrls?: string[]
  }
) {
  const submission = await prisma.projectSubmission.create({
    data: {
      userId,
      courseId,
      projectId,
      title: data.title,
      description: data.description,
      fileUrls: data.fileUrls ? JSON.stringify(data.fileUrls) : null,
      status: 'SUBMITTED'
    }
  })

  return submission
}

// Grade project submission
export async function gradeProjectSubmission(
  submissionId: string,
  instructorId: string,
  data: {
    grade: number
    maxGrade: number
    feedback?: string
  }
) {
  const submission = await prisma.projectSubmission.findUnique({
    where: { id: submissionId }
  })

  if (!submission) {
    throw new Error('Submission not found')
  }

  const graded = await prisma.projectSubmission.update({
    where: { id: submissionId },
    data: {
      grade: data.grade,
      maxGrade: data.maxGrade,
      feedback: data.feedback,
      status: 'GRADED',
      reviewedAt: new Date(),
      reviewedBy: instructorId
    }
  })

  // Update leaderboard project score
  const existingEntry = await prisma.leaderboardEntry.findUnique({
    where: {
      userId_courseId: { userId: submission.userId, courseId: submission.courseId }
    }
  })

  const newProjectScore = (existingEntry?.projectScore || 0) + data.grade

  await updateLeaderboardScore(submission.userId, submission.courseId, {
    projectScore: newProjectScore
  })

  return graded
}

// Submit peer review
export async function submitPeerReview(
  submissionId: string,
  reviewerId: string,
  data: {
    rating: number
    feedback?: string
  }
) {
  // Check if already reviewed
  const existing = await prisma.peerReview.findFirst({
    where: {
      submissionId,
      reviewerId
    }
  })

  if (existing) {
    throw new Error('Already reviewed this submission')
  }

  const review = await prisma.peerReview.create({
    data: {
      submissionId,
      reviewerId,
      rating: data.rating,
      feedback: data.feedback
    }
  })

  // Award participation points to reviewer
  const submission = await prisma.projectSubmission.findUnique({
    where: { id: submissionId }
  })

  if (submission) {
    const existing = await prisma.leaderboardEntry.findUnique({
      where: {
        userId_courseId: { userId: reviewerId, courseId: submission.courseId }
      }
    })

    await updateLeaderboardScore(reviewerId, submission.courseId, {
      participationScore: (existing?.participationScore || 0) + 5 // 5 points for reviewing
    })

    // Check for peer reviewer achievement
    const reviewCount = await prisma.peerReview.count({
      where: { reviewerId }
    })

    if (reviewCount >= 5) {
      await unlockAchievement(reviewerId, 'PEER_REVIEWER', {
        title: 'Peer Reviewer',
        titleAr: 'مراجع الأقران',
        description: 'Reviewed 5 or more submissions',
        descriptionAr: 'راجع 5 تقديمات أو أكثر',
        points: 50,
        courseId: submission.courseId,
        icon: '👥'
      })
    }
  }

  return review
}
