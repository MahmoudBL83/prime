import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EnhancedMatchingService } from '@/services/EnhancedMatchingService'
import { z } from 'zod'

const matchRequestSchema = z.object({
    limit: z.number().min(1).max(50).optional().default(20),
    skillLevel: z.string().optional(),
    learningMode: z.string().optional(),
})

interface StudyBuddyMatch {
    id: string
    name: string
    arabicName?: string | null
    interests: string[]
    goals: string[]
    skillLevel: string | null
    learningMode?: string | null
    profileImage?: string | null
    compatibilityScore: number
    sharedInterests: string[]
    sharedGoals: string[]
}

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ 
                error: 'Please log in to find study buddies',
                code: 'NOT_AUTHENTICATED',
                matches: [],
                totalFound: 0,
                totalAvailable: 0
            }, { status: 401 })
        }

        // Parse query parameters
        const { searchParams } = new URL(req.url)
        const validation = matchRequestSchema.safeParse({
            limit: parseInt(searchParams.get('limit') || '20'),
            skillLevel: searchParams.get('skillLevel') || undefined,
            learningMode: searchParams.get('learningMode') || undefined,
        })

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues },
                { status: 400 }
            )
        }

        const { limit } = validation.data
        const sessionUser = session.user

        console.log('🔍 Study Buddy API - Session user:', {
            id: sessionUser.id,
            email: sessionUser.email,
            name: sessionUser.name,
            role: sessionUser.role
        })

        // Use the enhanced matching service
        const compatibilityScores = await EnhancedMatchingService.findMatches(sessionUser.id, limit)
        
        if (!compatibilityScores) {
            return NextResponse.json({
                matches: [],
                totalFound: 0,
                totalAvailable: 0,
                message: 'No matches found at this time',
                enhancedMatching: true,
                algorithm: 'preferences-based'
            })
        }

        // Get user details for each match
        const userIds = compatibilityScores.map(score => score.userId)
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: {
                id: true,
                name: true,
                arabicName: true,
                profileImage: true,
                interests: true,
                goals: true,
                skillLevel: true,
                learningMode: true,
            }
        })

        // Helper function to parse interests/goals that might be JSON or comma-separated strings
        const parseArrayField = (field: string | null): string[] => {
            if (!field) return []
            try {
                // Try to parse as JSON first
                return JSON.parse(field)
            } catch {
                // If JSON parse fails, treat as comma-separated string
                return field.split(',').map(item => item.trim()).filter(Boolean)
            }
        }

        // Combine user details with compatibility scores
        const matches = compatibilityScores.map(score => {
            const user = users.find(u => u.id === score.userId)
            if (!user) return null

            return {
                id: user.id,
                name: user.name,
                arabicName: user.arabicName,
                interests: parseArrayField(user.interests),
                goals: parseArrayField(user.goals),
                skillLevel: user.skillLevel,
                learningMode: user.learningMode,
                profileImage: user.profileImage,
                compatibilityScore: score.totalScore,
                compatibilityBreakdown: score.breakdown,
                sharedInterests: score.sharedInterests,
                sharedGoals: score.sharedGoals,
                reasonsForMatch: score.reasonsForMatch,
            }
        }).filter(match => match !== null) // Filter out any missing users

        // Get total available matches count for reference
        const totalAvailable = await prisma.user.count({
            where: {
                id: { not: sessionUser.id },
                role: 'LEARNER',
                onboardingCompleted: true,
                // Exclude existing matches
                studyBuddyMatches: {
                    none: {
                        OR: [
                            {
                                user1Id: sessionUser.id,
                                status: { in: ['pending', 'accepted'] },
                            },
                            {
                                user2Id: sessionUser.id,
                                status: { in: ['pending', 'accepted'] },
                            },
                        ],
                    },
                },
            }
        })

        return NextResponse.json({
            matches,
            totalFound: matches.length,
            totalAvailable,
            enhancedMatching: true, // Flag to indicate enhanced algorithm is being used
            algorithm: 'preferences-based', // Algorithm type identifier
        })
    } catch (error) {
        console.error('Enhanced study buddy matching error:', error)
        
        // Check if it's a user not found error
        if (error instanceof Error && error.message === 'User not found') {
            // Check profile completion to provide helpful guidance
            try {
                const user = await prisma.user.findUnique({
                    where: { id: sessionUser.id },
                    select: {
                        interests: true,
                        goals: true,
                        skillLevel: true,
                        learningMode: true,
                        studyPreferences: true
                    }
                })

                if (!user) {
                    return NextResponse.json({
                        error: 'User profile not found. Please contact support.',
                        code: 'USER_NOT_FOUND',
                        matches: [],
                        totalFound: 0,
                        totalAvailable: 0
                    }, { status: 404 })
                }

                // Check what's missing for study buddy functionality
                const missingFields = []
                const missingFieldsDetail = []
                
                if (!user.interests || user.interests.trim() === '' || user.interests === '[]') {
                    missingFields.push('interests')
                    missingFieldsDetail.push('Add at least one interest')
                }
                if (!user.goals || user.goals.trim() === '' || user.goals === '[]') {
                    missingFields.push('goals')
                    missingFieldsDetail.push('Add at least one learning goal')
                }
                if (!user.skillLevel) {
                    missingFields.push('skill level')
                    missingFieldsDetail.push('Select your skill level')
                }
                if (!user.learningMode) {
                    missingFields.push('learning mode')
                    missingFieldsDetail.push('Choose your learning mode preference')
                }

                return NextResponse.json({
                    error: `Study Buddy profile incomplete. Missing: ${missingFields.join(', ')}`,
                    code: 'PROFILE_INCOMPLETE',
                    missingFields,
                    missingFieldsDetail,
                    action: 'COMPLETE_PROFILE',
                    message: `To use Study Buddy, please complete these fields: ${missingFieldsDetail.join(', ')}`,
                    matches: [],
                    totalFound: 0,
                    totalAvailable: 0
                }, { status: 400 })
                
            } catch (profileError) {
                console.error('Error checking profile completion:', profileError)
            }
            
            return NextResponse.json({
                error: 'User profile not found. Please complete your profile first.',
                code: 'USER_NOT_FOUND',
                action: 'COMPLETE_PROFILE',
                matches: [],
                totalFound: 0,
                totalAvailable: 0
            }, { status: 404 })
        }
        
        return NextResponse.json(
            { 
                error: 'Failed to find matches. Please try again later.',
                code: 'INTERNAL_ERROR',
                matches: [],
                totalFound: 0,
                totalAvailable: 0
            },
            { status: 500 }
        )
    }
}
