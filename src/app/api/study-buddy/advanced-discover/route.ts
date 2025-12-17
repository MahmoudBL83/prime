import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

/**
 * Enhanced Study Buddy Filters API
 * Advanced matching with more filter options
 * GET /api/study-buddy/advanced-discover
 */

const filterSchema = z.object({
    interests: z.array(z.string()).optional(),
    learningGoals: z.array(z.string()).optional(),
    experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    languages: z.array(z.string()).optional(),
    timezone: z.string().optional(),
    timezoneFlexibility: z.number().min(0).max(12).optional(), // hours
    studySchedule: z.enum(['morning', 'afternoon', 'evening', 'flexible']).optional(),
    courseIds: z.array(z.string()).optional(), // Specific courses
    ageRange: z.object({
        min: z.number().min(13),
        max: z.number().max(100)
    }).optional(),
    onlineOnly: z.boolean().optional(),
    maxDistance: z.number().optional(), // km, if location available
    communicationStyle: z.enum(['text', 'voice', 'video', 'any']).optional()
})

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '20')

        // Parse filters from query params
        const filters: any = {}
        const interestsParam = searchParams.get('interests')
        const goalsParam = searchParams.get('goals')
        const levelParam = searchParams.get('level')
        const languagesParam = searchParams.get('languages')
        const timezoneParam = searchParams.get('timezone')
        const scheduleParam = searchParams.get('schedule')
        const courseIdsParam = searchParams.get('courseIds')

        if (interestsParam) filters.interests = interestsParam.split(',')
        if (goalsParam) filters.learningGoals = goalsParam.split(',')
        if (levelParam) filters.experienceLevel = levelParam
        if (languagesParam) filters.languages = languagesParam.split(',')
        if (timezoneParam) filters.timezone = timezoneParam
        if (scheduleParam) filters.studySchedule = scheduleParam
        if (courseIdsParam) filters.courseIds = courseIdsParam.split(',')

        // Get current user's preferences
        const userPrefs = await prisma.studyPreferences.findUnique({
            where: { userId: session.user.id }
        })

        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                enrollments: { select: { courseId: true } }
            }
        })

        // Build query for potential buddies
        const whereClause: any = {
            userId: { not: session.user.id }
        }

        // Get all potential buddies with their preferences
        const potentialBuddies = await prisma.studyPreferences.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        arabicName: true,
                        profileImage: true,
                        country: true,
                        createdAt: true,
                        enrollments: {
                            select: { courseId: true }
                        }
                    }
                }
            },
            take: 100 // Get more for scoring
        })

        // Calculate compatibility scores
        const scoredBuddies = potentialBuddies.map(buddy => {
            let score = 0
            let matchDetails: string[] = []

            // Interest matching (30 points max) - using subjectExpertise as interests
            const userInterests = (userPrefs?.subjectExpertise as string[]) || filters.interests || []
            const buddyInterests = (buddy.subjectExpertise as string[]) || []
            const interestMatches = userInterests.filter(i => buddyInterests.includes(i)).length
            if (interestMatches > 0) {
                score += Math.min(interestMatches * 10, 30)
                matchDetails.push(`${interestMatches} shared interests`)
            }

            // Learning goals matching (20 points max) - using studyGoalType
            const userGoal = userPrefs?.studyGoalType || filters.learningGoals?.[0]
            const buddyGoal = buddy.studyGoalType
            if (userGoal && buddyGoal && userGoal === buddyGoal) {
                score += 20
                matchDetails.push('Same learning goal')
            }

            // Experience level matching (15 points) - using skillLevelPreference
            const userLevel = userPrefs?.skillLevelPreference || filters.experienceLevel
            if (userLevel && buddy.skillLevelPreference === userLevel) {
                score += 15
                matchDetails.push('Same experience level')
            }

            // Course overlap (25 points max)
            const userCourses = currentUser?.enrollments.map(e => e.courseId) || []
            const buddyCourses = buddy.user.enrollments.map(e => e.courseId)
            const courseMatches = userCourses.filter(c => buddyCourses.includes(c)).length
            if (courseMatches > 0) {
                score += Math.min(courseMatches * 5, 25)
                matchDetails.push(`${courseMatches} courses in common`)
            }

            // Timezone compatibility (10 points)
            if (filters.timezone && buddy.timezone) {
                const userOffset = parseInt(filters.timezone.replace('UTC', '')) || 0
                const buddyOffset = parseInt(buddy.timezone.replace('UTC', '')) || 0
                const timeDiff = Math.abs(userOffset - buddyOffset)
                if (timeDiff <= 3) {
                    score += 10
                    matchDetails.push('Compatible timezone')
                }
            }

            // Study schedule matching - using preferredStudyTimes
            const userSchedule = userPrefs?.preferredStudyTimes || filters.studySchedule
            if (userSchedule && buddy.preferredStudyTimes === userSchedule) {
                score += 5
                matchDetails.push('Same study schedule')
            }

            return {
                user: {
                    id: buddy.user.id,
                    name: buddy.user.name,
                    arabicName: buddy.user.arabicName,
                    profileImage: buddy.user.profileImage,
                    country: buddy.user.country
                },
                preferences: {
                    interests: buddyInterests,
                    goals: buddy.studyGoalType ? [buddy.studyGoalType] : [],
                    experienceLevel: buddy.skillLevelPreference,
                    studySchedule: buddy.preferredStudyTimes,
                    timezone: buddy.timezone
                },
                compatibility: {
                    score,
                    percentage: Math.round((score / 100) * 100),
                    matchDetails
                },
                coursesInCommon: courseMatches
            }
        })

        // Sort by score and filter by minimum compatibility
        const minScore = parseInt(searchParams.get('minScore') || '20')
        const filteredBuddies = scoredBuddies
            .filter(b => b.compatibility.score >= minScore)
            .sort((a, b) => b.compatibility.score - a.compatibility.score)
            .slice(0, limit)

        return NextResponse.json({
            buddies: filteredBuddies,
            totalFound: filteredBuddies.length,
            filtersApplied: Object.keys(filters).length,
            userPreferences: userPrefs ? {
                interests: userPrefs.subjectExpertise,
                goals: userPrefs.studyGoalType,
                experienceLevel: userPrefs.skillLevelPreference
            } : null
        })
    } catch (error) {
        console.error('Advanced discover error:', error)
        return NextResponse.json(
            { error: 'Failed to discover study buddies' },
            { status: 500 }
        )
    }
}

// POST: Update user's study preferences
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const parsed = filterSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
        }

        const data = parsed.data

        const preferences = await prisma.studyPreferences.upsert({
            where: { userId: session.user.id },
            create: {
                userId: session.user.id,
                subjectExpertise: data.interests || [],
                studyGoalType: data.learningGoals?.[0] || null,
                skillLevelPreference: data.experienceLevel || 'beginner',
                preferredStudyTimes: data.studySchedule || 'flexible',
                timezone: data.timezone
            },
            update: {
                subjectExpertise: data.interests,
                studyGoalType: data.learningGoals?.[0],
                skillLevelPreference: data.experienceLevel,
                preferredStudyTimes: data.studySchedule,
                timezone: data.timezone
            }
        })

        return NextResponse.json({
            preferences,
            message: 'Preferences updated successfully'
        })
    } catch (error) {
        console.error('Update preferences error:', error)
        return NextResponse.json(
            { error: 'Failed to update preferences' },
            { status: 500 }
        )
    }
}
