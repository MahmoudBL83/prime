import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/gamification/leaderboard
 * Get leaderboard rankings
 * Query params: type (xp|course), courseId, limit
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        const searchParams = request.nextUrl.searchParams
        const type = searchParams.get('type') || 'xp'
        const courseId = searchParams.get('courseId')
        const limit = parseInt(searchParams.get('limit') || '50')
        const userId = session?.user?.id

        if (type === 'xp') {
            // Global XP leaderboard
            const topUsers = await prisma.userXP.findMany({
                take: limit,
                orderBy: { totalXP: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            profileImage: true,
                            arabicName: true
                        }
                    }
                }
            })

            // Get current user's rank if logged in
            let currentUserRank = null
            if (userId) {
                const userXP = await prisma.userXP.findUnique({
                    where: { userId }
                })

                if (userXP) {
                    const rank = await prisma.userXP.count({
                        where: {
                            totalXP: { gt: userXP.totalXP }
                        }
                    })
                    currentUserRank = {
                        rank: rank + 1,
                        totalXP: userXP.totalXP,
                        currentLevel: userXP.currentLevel,
                        currentStreak: userXP.currentStreak
                    }
                }
            }

            const leaderboard = topUsers.map((entry, index) => ({
                rank: index + 1,
                userId: entry.user.id,
                userName: entry.user.name,
                userNameAr: entry.user.arabicName,
                profileImage: entry.user.profileImage,
                totalXP: entry.totalXP,
                currentLevel: entry.currentLevel,
                currentStreak: entry.currentStreak,
                lifetimeXP: entry.lifetimeXP
            }))

            return NextResponse.json({
                type: 'xp',
                leaderboard,
                currentUserRank,
                totalUsers: await prisma.userXP.count()
            })

        } else if (type === 'course' && courseId) {
            // Course-specific leaderboard
            const leaderboardEntries = await prisma.leaderboardEntry.findMany({
                where: { courseId },
                take: limit,
                orderBy: { totalScore: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            profileImage: true,
                            arabicName: true
                        }
                    },
                    course: {
                        select: {
                            title: true,
                            titleAr: true
                        }
                    }
                }
            })

            // Get current user's rank
            let currentUserRank = null
            if (userId) {
                const userEntry = await prisma.leaderboardEntry.findUnique({
                    where: {
                        userId_courseId: {
                            userId,
                            courseId
                        }
                    }
                })

                if (userEntry) {
                    const rank = await prisma.leaderboardEntry.count({
                        where: {
                            courseId,
                            totalScore: { gt: userEntry.totalScore }
                        }
                    })
                    currentUserRank = {
                        rank: rank + 1,
                        totalScore: userEntry.totalScore,
                        quizScore: userEntry.quizScore,
                        projectScore: userEntry.projectScore,
                        participationScore: userEntry.participationScore
                    }
                }
            }

            const leaderboard = leaderboardEntries.map((entry, index) => ({
                rank: index + 1,
                userId: entry.user.id,
                userName: entry.user.name,
                userNameAr: entry.user.arabicName,
                profileImage: entry.user.profileImage,
                totalScore: entry.totalScore,
                quizScore: entry.quizScore,
                projectScore: entry.projectScore,
                participationScore: entry.participationScore,
                lastUpdated: entry.lastUpdated
            }))

            return NextResponse.json({
                type: 'course',
                courseId,
                courseTitle: leaderboardEntries[0]?.course.title,
                leaderboard,
                currentUserRank,
                totalParticipants: await prisma.leaderboardEntry.count({ where: { courseId } })
            })

        } else {
            return NextResponse.json({ error: 'Invalid type or missing courseId' }, { status: 400 })
        }

    } catch (error) {
        console.error('Error fetching leaderboard:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * POST /api/gamification/leaderboard
 * Update user's leaderboard score for a course
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { courseId, quizScore, projectScore, participationScore } = await request.json()

        if (!courseId) {
            return NextResponse.json({ error: 'Course ID required' }, { status: 400 })
        }

        const userId = session.user.id

        // Calculate total score
        const totalScore = (quizScore || 0) + (projectScore || 0) + (participationScore || 0)

        // Upsert leaderboard entry
        const entry = await prisma.leaderboardEntry.upsert({
            where: {
                userId_courseId: {
                    userId,
                    courseId
                }
            },
            update: {
                quizScore: quizScore !== undefined ? quizScore : undefined,
                projectScore: projectScore !== undefined ? projectScore : undefined,
                participationScore: participationScore !== undefined ? participationScore : undefined,
                totalScore,
                lastUpdated: new Date()
            },
            create: {
                userId,
                courseId,
                quizScore: quizScore || 0,
                projectScore: projectScore || 0,
                participationScore: participationScore || 0,
                totalScore
            }
        })

        // Calculate rank
        const rank = await prisma.leaderboardEntry.count({
            where: {
                courseId,
                totalScore: { gt: entry.totalScore }
            }
        }) + 1

        return NextResponse.json({
            success: true,
            entry: {
                userId: entry.userId,
                courseId: entry.courseId,
                totalScore: entry.totalScore,
                rank,
                quizScore: entry.quizScore,
                projectScore: entry.projectScore,
                participationScore: entry.participationScore,
                lastUpdated: entry.lastUpdated
            }
        })
    } catch (error) {
        console.error('Error updating leaderboard:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
