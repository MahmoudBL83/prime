import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/gamification/xp
 * Get user's XP stats and recent transactions
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.user.id

        // Get or create user XP record
        let userXP = await prisma.userXP.findUnique({
            where: { userId },
            include: {
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 20
                }
            }
        })

        if (!userXP) {
            // Create initial XP record for user
            userXP = await prisma.userXP.create({
                data: {
                    userId,
                    totalXP: 0,
                    currentLevel: 1,
                    xpToNextLevel: 100,
                    lifetimeXP: 0,
                    currentStreak: 0,
                    longestStreak: 0
                },
                include: {
                    transactions: true
                }
            })
        }

        // Calculate level progress
        const levelProgress = ((userXP.xpToNextLevel - (calculateXPForLevel(userXP.currentLevel + 1) - userXP.totalXP)) / userXP.xpToNextLevel) * 100

        return NextResponse.json({
            xp: {
                totalXP: userXP.totalXP,
                lifetimeXP: userXP.lifetimeXP,
                currentLevel: userXP.currentLevel,
                xpToNextLevel: userXP.xpToNextLevel,
                levelProgress: Math.round(levelProgress),
                currentStreak: userXP.currentStreak,
                longestStreak: userXP.longestStreak,
                lastActivityAt: userXP.lastActivityAt
            },
            recentTransactions: userXP.transactions.map(t => ({
                id: t.id,
                amount: t.amount,
                reason: t.reason,
                type: t.type,
                createdAt: t.createdAt
            }))
        })
    } catch (error) {
        console.error('Error fetching XP:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * POST /api/gamification/xp
 * Award XP to user (internal use or admin)
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { amount, reason, type, relatedEntityId, relatedEntityType } = await request.json()

        if (!amount || !reason || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const userId = session.user.id

        // Get or create user XP
        let userXP = await prisma.userXP.findUnique({ where: { userId } })
        
        if (!userXP) {
            userXP = await prisma.userXP.create({
                data: {
                    userId,
                    totalXP: 0,
                    currentLevel: 1,
                    xpToNextLevel: 100,
                    lifetimeXP: 0
                }
            })
        }

        // Add XP
        const newTotalXP = userXP.totalXP + amount
        const newLifetimeXP = userXP.lifetimeXP + (amount > 0 ? amount : 0)

        // Calculate new level
        const newLevel = calculateLevel(newTotalXP)
        const leveledUp = newLevel > userXP.currentLevel
        const xpForNextLevel = calculateXPForLevel(newLevel + 1)
        const xpToNext = xpForNextLevel - newTotalXP

        // Update user XP
        const updatedUserXP = await prisma.userXP.update({
            where: { userId },
            data: {
                totalXP: newTotalXP,
                lifetimeXP: newLifetimeXP,
                currentLevel: newLevel,
                xpToNextLevel: xpToNext,
                lastActivityAt: new Date()
            }
        })

        // Create transaction record
        await prisma.xPTransaction.create({
            data: {
                userId,
                userXPId: updatedUserXP.id,
                amount,
                reason,
                type,
                relatedEntityId,
                relatedEntityType
            }
        })

        return NextResponse.json({
            success: true,
            xp: {
                totalXP: updatedUserXP.totalXP,
                currentLevel: updatedUserXP.currentLevel,
                xpToNextLevel: updatedUserXP.xpToNextLevel,
                leveledUp,
                xpGained: amount
            }
        })
    } catch (error) {
        console.error('Error awarding XP:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// Calculate level based on total XP (using exponential curve)
function calculateLevel(totalXP: number): number {
    if (totalXP < 0) return 1
    // Level formula: level = floor(sqrt(totalXP / 50)) + 1
    return Math.floor(Math.sqrt(totalXP / 50)) + 1
}

// Calculate XP required for a given level
function calculateXPForLevel(level: number): number {
    if (level <= 1) return 0
    // Inverse of level formula: xp = 50 * (level - 1)^2
    return 50 * Math.pow(level - 1, 2)
}
