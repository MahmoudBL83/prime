import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/gamification/achievements
 * Get user's achievements and progress
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.user.id

        // Get all user achievements
        const achievements = await prisma.achievement.findMany({
            where: { userId },
            include: {
                course: {
                    select: {
                        title: true,
                        thumbnail: true
                    }
                }
            },
            orderBy: { unlockedAt: 'desc' }
        })

        // Get total points from achievements
        const totalPoints = achievements.reduce((sum, a) => sum + a.points, 0)

        // Count by type
        const achievementCounts = achievements.reduce((acc, a) => {
            acc[a.type] = (acc[a.type] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        return NextResponse.json({
            achievements: achievements.map(a => ({
                id: a.id,
                type: a.type,
                title: a.title,
                titleAr: a.titleAr,
                description: a.description,
                descriptionAr: a.descriptionAr,
                icon: a.icon,
                points: a.points,
                unlockedAt: a.unlockedAt,
                course: a.course ? {
                    title: a.course.title,
                    thumbnail: a.course.thumbnail
                } : null
            })),
            stats: {
                totalAchievements: achievements.length,
                totalPoints,
                achievementsByType: achievementCounts
            }
        })
    } catch (error) {
        console.error('Error fetching achievements:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * POST /api/gamification/achievements
 * Unlock a new achievement for user
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { type, title, description, icon, points, courseId } = await request.json()

        if (!type || !title || !description) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const userId = session.user.id

        // Check if achievement already exists
        const existing = await prisma.achievement.findFirst({
            where: {
                userId,
                type,
                courseId: courseId || null
            }
        })

        if (existing) {
            return NextResponse.json({ 
                error: 'Achievement already unlocked',
                achievement: existing 
            }, { status: 400 })
        }

        // Create achievement
        const achievement = await prisma.achievement.create({
            data: {
                userId,
                type,
                title,
                description,
                icon: icon || '🏆',
                points: points || 0,
                courseId
            }
        })

        // Award XP if points > 0
        if (points > 0) {
            const userXP = await prisma.userXP.findUnique({ where: { userId } })
            
            if (userXP) {
                const newTotalXP = userXP.totalXP + points
                const newLevel = Math.floor(Math.sqrt(newTotalXP / 50)) + 1
                const xpForNextLevel = 50 * Math.pow(newLevel, 2)

                await prisma.userXP.update({
                    where: { userId },
                    data: {
                        totalXP: newTotalXP,
                        lifetimeXP: userXP.lifetimeXP + points,
                        currentLevel: newLevel,
                        xpToNextLevel: xpForNextLevel - newTotalXP,
                        lastActivityAt: new Date()
                    }
                })

                // Create XP transaction
                await prisma.xPTransaction.create({
                    data: {
                        userId,
                        userXPId: userXP.id,
                        amount: points,
                        reason: `Achievement unlocked: ${title}`,
                        type: 'ACHIEVEMENT_UNLOCKED',
                        relatedEntityId: achievement.id,
                        relatedEntityType: 'Achievement'
                    }
                })
            }
        }

        return NextResponse.json({
            success: true,
            achievement: {
                id: achievement.id,
                type: achievement.type,
                title: achievement.title,
                description: achievement.description,
                icon: achievement.icon,
                points: achievement.points,
                unlockedAt: achievement.unlockedAt
            }
        })
    } catch (error) {
        console.error('Error creating achievement:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
