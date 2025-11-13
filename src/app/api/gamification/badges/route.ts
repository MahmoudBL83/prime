import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/gamification/badges
 * Get all badges (earned and available)
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.user.id

        // Get all badge definitions
        const badgeDefinitions = await prisma.badgeDefinition.findMany({
            where: { isActive: true },
            include: {
                earnedBadges: {
                    where: { userId }
                }
            },
            orderBy: [
                { rarity: 'desc' },
                { category: 'asc' }
            ]
        })

        // Format response
        const badges = badgeDefinitions.map(def => {
            const userBadge = def.earnedBadges[0]
            return {
                id: def.id,
                code: def.code,
                title: def.title,
                titleAr: def.titleAr,
                description: def.description,
                descriptionAr: def.descriptionAr,
                icon: def.icon,
                color: def.color,
                rarity: def.rarity,
                category: def.category,
                xpReward: def.xpReward,
                requirements: def.requirements,
                isEarned: userBadge?.isEarned || false,
                progress: userBadge?.progress || 0,
                earnedAt: userBadge?.earnedAt || null
            }
        })

        // Calculate stats
        const earnedBadges = badges.filter(b => b.isEarned)
        const totalXPFromBadges = earnedBadges.reduce((sum, b) => sum + b.xpReward, 0)
        
        const badgesByCategory = badges.reduce((acc, b) => {
            if (!acc[b.category]) {
                acc[b.category] = { total: 0, earned: 0 }
            }
            acc[b.category].total++
            if (b.isEarned) acc[b.category].earned++
            return acc
        }, {} as Record<string, { total: number; earned: number }>)

        const badgesByRarity = badges.reduce((acc, b) => {
            if (!acc[b.rarity]) {
                acc[b.rarity] = { total: 0, earned: 0 }
            }
            acc[b.rarity].total++
            if (b.isEarned) acc[b.rarity].earned++
            return acc
        }, {} as Record<string, { total: number; earned: number }>)

        return NextResponse.json({
            badges,
            stats: {
                totalBadges: badges.length,
                earnedBadges: earnedBadges.length,
                completionRate: Math.round((earnedBadges.length / badges.length) * 100),
                totalXPFromBadges,
                badgesByCategory,
                badgesByRarity
            }
        })
    } catch (error) {
        console.error('Error fetching badges:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * POST /api/gamification/badges/earn
 * Award a badge to user
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { badgeCode } = await request.json()

        if (!badgeCode) {
            return NextResponse.json({ error: 'Badge code required' }, { status: 400 })
        }

        const userId = session.user.id

        // Get badge definition
        const badgeDef = await prisma.badgeDefinition.findUnique({
            where: { code: badgeCode }
        })

        if (!badgeDef || !badgeDef.isActive) {
            return NextResponse.json({ error: 'Badge not found' }, { status: 404 })
        }

        // Check if already earned
        const existing = await prisma.userBadge.findUnique({
            where: {
                userId_badgeDefId: {
                    userId,
                    badgeDefId: badgeDef.id
                }
            }
        })

        if (existing?.isEarned) {
            return NextResponse.json({ 
                error: 'Badge already earned',
                badge: existing
            }, { status: 400 })
        }

        // Award badge
        const userBadge = await prisma.userBadge.upsert({
            where: {
                userId_badgeDefId: {
                    userId,
                    badgeDefId: badgeDef.id
                }
            },
            update: {
                isEarned: true,
                progress: 100,
                earnedAt: new Date()
            },
            create: {
                userId,
                badgeDefId: badgeDef.id,
                isEarned: true,
                progress: 100,
                earnedAt: new Date()
            }
        })

        // Award XP
        if (badgeDef.xpReward > 0) {
            const userXP = await prisma.userXP.findUnique({ where: { userId } })
            
            if (userXP) {
                const newTotalXP = userXP.totalXP + badgeDef.xpReward
                const newLevel = Math.floor(Math.sqrt(newTotalXP / 50)) + 1
                const xpForNextLevel = 50 * Math.pow(newLevel, 2)

                await prisma.userXP.update({
                    where: { userId },
                    data: {
                        totalXP: newTotalXP,
                        lifetimeXP: userXP.lifetimeXP + badgeDef.xpReward,
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
                        amount: badgeDef.xpReward,
                        reason: `Badge earned: ${badgeDef.title}`,
                        type: 'BADGE_EARNED',
                        relatedEntityId: badgeDef.id,
                        relatedEntityType: 'Badge'
                    }
                })
            }
        }

        return NextResponse.json({
            success: true,
            badge: {
                id: userBadge.id,
                code: badgeDef.code,
                title: badgeDef.title,
                description: badgeDef.description,
                icon: badgeDef.icon,
                color: badgeDef.color,
                rarity: badgeDef.rarity,
                xpReward: badgeDef.xpReward,
                earnedAt: userBadge.earnedAt
            }
        })
    } catch (error) {
        console.error('Error earning badge:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
