import { prisma } from '@/lib/prisma'

export type EventType =
  | 'LESSON_COMPLETED'
  | 'QUIZ_PASSED'
  | 'COURSE_COMPLETED'
  | 'DAILY_LOGIN'
  | 'CERTIFICATE_EARNED'
  | 'REVIEW_SUBMITTED'
  | 'BONUS'

/**
 * Award XP to a user and optionally trigger level up logic
 */
export async function awardXP(userId: string, amount: number, reason = 'Activity', type: string | null = null, relatedEntityId: string | null = null) {
  if (!userId || !amount) return null

  // ensure userXP exists
  let userXP = await prisma.userXP.findUnique({ where: { userId } })
  if (!userXP) {
    userXP = await prisma.userXP.create({ data: { userId, totalXP: 0, currentLevel: 1, xpToNextLevel: 100, lifetimeXP: 0 } })
  }

  const newTotal = userXP.totalXP + amount
  const newLifetime = userXP.lifetimeXP + Math.max(0, amount)
  const newLevel = calculateLevel(newTotal)
  const xpForNext = calculateXPForLevel(newLevel + 1)
  const xpToNext = xpForNext - newTotal

  const updated = await prisma.userXP.update({
    where: { userId },
    data: {
      totalXP: newTotal,
      lifetimeXP: newLifetime,
      currentLevel: newLevel,
      xpToNextLevel: xpToNext,
      lastActivityAt: new Date()
    }
  })

  // record transaction
  await prisma.xPTransaction.create({
    data: {
      userId,
      userXPId: updated.id,
      amount,
      reason,
      type: (type || 'BONUS') as any,
      relatedEntityId,
      relatedEntityType: relatedEntityId ? (type || null) : null
    }
  })

  return updated
}

export async function unlockBadge(userId: string, badgeCode: string) {
  const badge = await prisma.badgeDefinition.findUnique({ where: { code: badgeCode } })
  if (!badge || !badge.isActive) return null

  const existing = await prisma.userBadge.findUnique({ where: { userId_badgeDefId: { userId, badgeDefId: badge.id } } })

  if (existing && existing.isEarned) return existing

  // upsert userBadge as earned
  const userBadge = await prisma.userBadge.upsert({
    where: { userId_badgeDefId: { userId, badgeDefId: badge.id } },
    update: { isEarned: true, progress: 100, earnedAt: new Date() },
    create: { userId, badgeDefId: badge.id, isEarned: true, progress: 100, earnedAt: new Date() }
  })

  // award XP if applicable
  if (badge.xpReward && badge.xpReward > 0) {
    await awardXP(userId, badge.xpReward, `Badge earned: ${badge.title}`, 'BADGE_EARNED', badge.id)
  }

  return userBadge
}

export async function unlockAchievement(userId: string, type: string, title: string, description: string, points = 0, courseId: string | null = null) {
  // avoid duplicates for same type + course
  const existing = await prisma.achievement.findFirst({ where: { userId, type, courseId } })
  if (existing) return existing

  const achievement = await prisma.achievement.create({
    data: {
      userId,
      type: type as any,
      title,
      description,
      points,
      courseId: courseId || undefined
    }
  })

  if (points > 0) {
    await awardXP(userId, points, `Achievement: ${title}`, 'ACHIEVEMENT_UNLOCKED', achievement.id)
  }

  return achievement
}

function calculateLevel(totalXP: number): number {
  if (totalXP < 0) return 1
  return Math.floor(Math.sqrt(totalXP / 50)) + 1
}

function calculateXPForLevel(level: number): number {
  if (level <= 1) return 0
  return 50 * Math.pow(level - 1, 2)
}
