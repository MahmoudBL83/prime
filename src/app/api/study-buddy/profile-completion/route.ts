import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface ProfileCompletionStatus {
    isComplete: boolean
    missingFields: string[]
    completionPercentage: number
    requiredForStudyBuddy: {
        hasInterests: boolean
        hasGoals: boolean
        hasSkillLevel: boolean
        hasLearningMode: boolean
        hasStudyPreferences: boolean
    }
    nextSteps: string[]
}

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user with all profile data
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                studyPreferences: true,
            }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Check profile completion
        const missingFields: string[] = []
        const nextSteps: string[] = []

        // Basic profile fields
        if (!user.interests || user.interests.trim() === '') {
            missingFields.push('interests')
            nextSteps.push('Add your interests to help us find compatible study partners')
        }

        if (!user.goals || user.goals.trim() === '') {
            missingFields.push('goals')
            nextSteps.push('Set your learning goals to match with like-minded peers')
        }

        if (!user.skillLevel) {
            missingFields.push('skillLevel')
            nextSteps.push('Select your skill level (Beginner, Intermediate, Advanced)')
        }

        if (!user.learningMode) {
            missingFields.push('learningMode')
            nextSteps.push('Choose your preferred learning mode')
        }

        if (!user.bio || user.bio.trim() === '') {
            missingFields.push('bio')
            nextSteps.push('Write a brief bio to introduce yourself')
        }

        // Study preferences
        if (!user.studyPreferences) {
            missingFields.push('studyPreferences')
            nextSteps.push('Complete your study preferences for better matching')
        } else {
            const prefs = user.studyPreferences
            if (!prefs.communicationStyle) {
                missingFields.push('communicationStyle')
                nextSteps.push('Set your communication style preference')
            }
            if (!prefs.languagePreference) {
                missingFields.push('languagePreference')
                nextSteps.push('Choose your preferred language for study sessions')
            }
            if (!prefs.learningStyle) {
                missingFields.push('learningStyle')
                nextSteps.push('Select your learning style')
            }
        }

        // Calculate completion percentage
        const totalFields = 8 // interests, goals, skillLevel, learningMode, bio, studyPreferences, communicationStyle, languagePreference
        const completedFields = totalFields - missingFields.length
        const completionPercentage = Math.round((completedFields / totalFields) * 100)

        // Study buddy specific requirements
        const requiredForStudyBuddy = {
            hasInterests: !!(user.interests && user.interests.trim()),
            hasGoals: !!(user.goals && user.goals.trim()),
            hasSkillLevel: !!user.skillLevel,
            hasLearningMode: !!user.learningMode,
            hasStudyPreferences: !!user.studyPreferences
        }

        const isComplete = missingFields.length === 0
        const canUseStudyBuddy = requiredForStudyBuddy.hasInterests && 
                                 requiredForStudyBuddy.hasGoals && 
                                 requiredForStudyBuddy.hasSkillLevel

        const response: ProfileCompletionStatus = {
            isComplete,
            missingFields,
            completionPercentage,
            requiredForStudyBuddy,
            nextSteps: nextSteps.slice(0, 3) // Limit to top 3 priorities
        }

        return NextResponse.json({
            ...response,
            canUseStudyBuddy,
            profileData: {
                name: user.name,
                email: user.email,
                bio: user.bio,
                interests: user.interests,
                goals: user.goals,
                skillLevel: user.skillLevel,
                learningMode: user.learningMode,
                hasStudyPreferences: !!user.studyPreferences
            }
        })

    } catch (error) {
        console.error('Profile completion check error:', error)
        return NextResponse.json(
            { error: 'Failed to check profile completion' },
            { status: 500 }
        )
    }
}