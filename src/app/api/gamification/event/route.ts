import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { awardXP, unlockBadge, unlockAchievement } from '@/lib/gamification'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/gamification/event
 * Trigger gamification events (XP, badges, achievements)
 * 
 * Body: {
 *   eventType: 'LESSON_COMPLETED' | 'QUIZ_PASSED' | 'COURSE_COMPLETED' | 'CERTIFICATE_EARNED' | 'DAILY_LOGIN',
 *   data: { courseId?, lessonId?, score?, ... }
 * }
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { eventType, data } = await request.json()
        const userId = session.user.id

        if (!eventType) {
            return NextResponse.json({ error: 'eventType required' }, { status: 400 })
        }

        const results: any = {
            xp: null,
            badges: [],
            achievements: []
        }

        // Handle different event types
        switch (eventType) {
            case 'LESSON_COMPLETED':
                // Award XP for lesson completion
                results.xp = await awardXP(userId, 10, 'Lesson completed', 'LESSON_COMPLETED', data?.lessonId)
                
                // Check for first lesson badge
                const lessonsCompleted = await prisma.lessonProgress.count({
                    where: { userId, completed: true }
                })
                if (lessonsCompleted === 1) {
                    const badge = await unlockBadge(userId, 'FIRST_LESSON')
                    if (badge) results.badges.push('FIRST_LESSON')
                }
                break

            case 'QUIZ_PASSED':
                const score = data?.score || 0
                const maxScore = data?.maxScore || 100
                const percentage = (score / maxScore) * 100

                // Award XP based on score
                const xpAmount = Math.round(20 * (percentage / 100))
                results.xp = await awardXP(userId, xpAmount, 'Quiz passed', 'QUIZ_COMPLETED', data?.quizId)

                // Check for perfect score
                if (percentage === 100) {
                    results.xp = await awardXP(userId, 30, 'Perfect quiz score!', 'PERFECT_SCORE', data?.quizId)
                    
                    // Check for Quiz Master badge (5 perfect scores)
                    const perfectQuizzes = await prisma.quizAttempt.count({
                        where: {
                            userId,
                            score: { gte: 100 }
                        }
                    })
                    if (perfectQuizzes >= 5) {
                        const badge = await unlockBadge(userId, 'QUIZ_MASTER')
                        if (badge) results.badges.push('QUIZ_MASTER')
                    }
                }
                break

            case 'COURSE_COMPLETED':
                // Award significant XP for course completion
                results.xp = await awardXP(userId, 100, 'Course completed!', 'COURSE_COMPLETED', data?.courseId)

                // Create achievement
                const course = await prisma.course.findUnique({
                    where: { id: data?.courseId },
                    select: { title: true, titleAr: true }
                })

                if (course) {
                    const achievement = await unlockAchievement(
                        userId,
                        'FIRST_COURSE_COMPLETED',
                        'Course Completed',
                        `Completed: ${course.title}`,
                        100,
                        data?.courseId
                    )
                    if (achievement) results.achievements.push('FIRST_COURSE_COMPLETED')

                    // Check for first course badge
                    const coursesCompleted = await prisma.certificate.count({
                        where: { userId }
                    })
                    if (coursesCompleted === 1) {
                        const badge = await unlockBadge(userId, 'FIRST_COURSE')
                        if (badge) results.badges.push('FIRST_COURSE')
                    }
                }
                break

            case 'CERTIFICATE_EARNED':
                // Award XP for certificate
                results.xp = await awardXP(userId, 150, 'Certificate earned!', 'CERTIFICATE_EARNED', data?.certificateId)

                // Create achievement
                const achievement = await unlockAchievement(
                    userId,
                    'CERTIFICATE_EARNED',
                    'Certificate Earned',
                    'Successfully completed a course and earned a certificate',
                    50,
                    data?.courseId
                )
                if (achievement) results.achievements.push('CERTIFICATE_EARNED')

                // Check for certificate collector badge (3 certificates)
                const certificatesEarned = await prisma.certificate.count({
                    where: { userId }
                })
                if (certificatesEarned >= 3) {
                    const badge = await unlockBadge(userId, 'CERTIFICATE_COLLECTOR')
                    if (badge) results.badges.push('CERTIFICATE_COLLECTOR')
                }
                break

            case 'DAILY_LOGIN':
                // Update streak
                const userXP = await prisma.userXP.findUnique({ where: { userId } })
                if (userXP) {
                    const lastActivity = new Date(userXP.lastActivityAt)
                    const now = new Date()
                    const daysSinceLastActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))

                    let newStreak = userXP.currentStreak
                    if (daysSinceLastActivity === 1) {
                        // Continue streak
                        newStreak = userXP.currentStreak + 1
                    } else if (daysSinceLastActivity > 1) {
                        // Streak broken, reset
                        newStreak = 1
                    }

                    await prisma.userXP.update({
                        where: { userId },
                        data: {
                            currentStreak: newStreak,
                            longestStreak: Math.max(newStreak, userXP.longestStreak),
                            lastActivityAt: now
                        }
                    })

                    // Award XP for daily login
                    results.xp = await awardXP(userId, 5, 'Daily login', 'DAILY_LOGIN', null)

                    // Check for streak badges
                    if (newStreak === 7) {
                        const badge = await unlockBadge(userId, 'LESSON_STREAK_7')
                        if (badge) results.badges.push('LESSON_STREAK_7')
                    } else if (newStreak === 30) {
                        const badge = await unlockBadge(userId, 'EARLY_BIRD')
                        if (badge) results.badges.push('EARLY_BIRD')
                    }

                    // Create streak milestone achievement
                    if (newStreak % 10 === 0 && newStreak > 0) {
                        await unlockAchievement(
                            userId,
                            'STREAK_MILESTONE',
                            `${newStreak}-Day Streak!`,
                            `Maintained a ${newStreak}-day learning streak`,
                            newStreak * 5
                        )
                        results.achievements.push('STREAK_MILESTONE')
                    }
                }
                break

            case 'REVIEW_SUBMITTED':
                // Award XP for helpful review
                results.xp = await awardXP(userId, 15, 'Review submitted', 'REVIEW_SUBMITTED', data?.reviewId)

                // Check for community hero badge (10 reviews)
                const reviewsCount = await prisma.review.count({
                    where: { userId }
                })
                if (reviewsCount >= 10) {
                    const badge = await unlockBadge(userId, 'COMMUNITY_HERO')
                    if (badge) results.badges.push('COMMUNITY_HERO')
                }
                break

            default:
                return NextResponse.json({ error: 'Unknown event type' }, { status: 400 })
        }

        // Check for legendary learner badge
        const userXPData = await prisma.userXP.findUnique({ where: { userId } })
        const certificatesCount = await prisma.certificate.count({ where: { userId } })
        if (userXPData && userXPData.currentLevel >= 10 && certificatesCount >= 5) {
            const badge = await unlockBadge(userId, 'LEGENDARY_LEARNER')
            if (badge) results.badges.push('LEGENDARY_LEARNER')
        }

        return NextResponse.json({
            success: true,
            eventType,
            results
        })
    } catch (error) {
        console.error('Error processing gamification event:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
