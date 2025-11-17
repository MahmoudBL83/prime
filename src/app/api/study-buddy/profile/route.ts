import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Helper function to parse array fields that might be strings
function parseArrayField(field: any): string[] {
    if (Array.isArray(field)) {
        return field
    }
    if (typeof field === 'string') {
        try {
            return JSON.parse(field)
        } catch {
            return field ? [field] : []
        }
    }
    return []
}

const updateProfileSchema = z.object({
    interests: z.array(z.string()).optional(),
    goals: z.array(z.string()).optional(),
    skillLevel: z.string().optional(),
    learningMode: z.string().optional(),
    studyBuddyPreferences: z.any().optional(),
    bio: z.string().optional()
})

// GET - Get current user's study buddy profile
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ 
                error: 'Please log in to view your profile',
                code: 'NOT_AUTHENTICATED'
            }, { status: 401 })
        }

        console.log('🔍 Profile GET - Session user:', {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name
        })

        let user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                arabicName: true,
                profileImage: true,
                bio: true,
                interests: true,
                goals: true,
                skillLevel: true,
                learningMode: true,
                studyBuddyPreferences: true,
                createdAt: true
            }
        })

        // If user not found by ID, try to find by email (session ID mismatch issue)
        if (!user && session.user.email) {
            console.log('⚠️ User not found by ID, trying email fallback:', session.user.email)
            user = await prisma.user.findUnique({
                where: { email: session.user.email },
                select: {
                    id: true,
                    name: true,
                    arabicName: true,
                    profileImage: true,
                    bio: true,
                    interests: true,
                    goals: true,
                    skillLevel: true,
                    learningMode: true,
                    studyBuddyPreferences: true,
                    createdAt: true
                }
            })
            
            if (user) {
                console.log('✅ Found user by email fallback:', user.id)
            }
        }

        if (!user) {
            console.error('❌ User not found in database:', {
                sessionId: session.user.id,
                sessionEmail: session.user.email,
                sessionName: session.user.name
            })
            
            // More helpful error message with instructions
            return NextResponse.json({ 
                error: 'Your session has expired or is invalid. Please log out and log back in.',
                code: 'SESSION_INVALID',
                details: {
                    sessionUserId: session.user.id,
                    sessionEmail: session.user.email,
                    suggestion: 'Clear cookies and login again'
                }
            }, { status: 404 })
        }

        // Parse JSON fields
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

        const profile = {
            ...user,
            interests: parseArrayField(user.interests),
            goals: parseArrayField(user.goals),
            studyBuddyPreferences: user.studyBuddyPreferences ? 
                (() => {
                    try {
                        return JSON.parse(user.studyBuddyPreferences)
                    } catch {
                        return {}
                    }
                })() : {}
        }

        // Get match statistics
        const matchStats = await prisma.studyBuddyMatch.aggregate({
            where: {
                OR: [
                    { user1Id: session.user.id },
                    { user2Id: session.user.id }
                ]
            },
            _count: {
                id: true
            }
        })

        const acceptedMatches = await prisma.studyBuddyMatch.count({
            where: {
                OR: [
                    { user1Id: session.user.id },
                    { user2Id: session.user.id }
                ],
                status: 'accepted'
            }
        })

        return NextResponse.json({
            profile,
            stats: {
                totalMatches: matchStats._count.id,
                acceptedMatches,
                profileCompleteness: calculateProfileCompleteness(profile)
            }
        })
    } catch (error) {
        console.error('Get study buddy profile error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch profile' },
            { status: 500 }
        )
    }
}

// PATCH - Update current user's study buddy profile
export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ 
                error: 'Please log in to update your profile',
                code: 'NOT_AUTHENTICATED'
            }, { status: 401 })
        }

        const body = await req.json()
        console.log('📝 Received profile update data:', body)
        
        const validation = updateProfileSchema.safeParse(body)

        if (!validation.success) {
            console.error('❌ Profile validation failed:', validation.error.issues)
            return NextResponse.json(
                { error: 'Invalid data', details: validation.error.issues },
                { status: 400 }
            )
        }

        const updateData: any = {}
        
        if (validation.data.interests !== undefined) {
            updateData.interests = JSON.stringify(validation.data.interests)
        }
        
        if (validation.data.goals !== undefined) {
            updateData.goals = JSON.stringify(validation.data.goals)
        }
        
        if (validation.data.studyBuddyPreferences !== undefined) {
            updateData.studyBuddyPreferences = typeof validation.data.studyBuddyPreferences === 'string' 
                ? validation.data.studyBuddyPreferences 
                : JSON.stringify(validation.data.studyBuddyPreferences)
        }

        if (validation.data.skillLevel !== undefined) {
            updateData.skillLevel = validation.data.skillLevel
        }

        if (validation.data.learningMode !== undefined) {
            updateData.learningMode = validation.data.learningMode
        }

        if (validation.data.bio !== undefined) {
            updateData.bio = validation.data.bio
        }

        console.log('🔧 Processed update data:', updateData)
        
        console.log('🔍 Profile Update - Session user:', {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name
        })

        // First check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, email: true, name: true }
        })

        let targetUserId = session.user.id

        if (!existingUser) {
            console.error('❌ Profile Update - User not found for ID:', session.user.id)
            
            // Try to find user by email as fallback
            const userByEmail = await prisma.user.findUnique({
                where: { email: session.user.email },
                select: { id: true, email: true, name: true }
            })

            if (userByEmail) {
                console.log('✅ Found user by email, updating session user ID:', userByEmail.id)
                targetUserId = userByEmail.id
            } else {
                return NextResponse.json({
                    error: 'User account not found. Please contact support.',
                    code: 'USER_NOT_FOUND'
                }, { status: 404 })
            }
        } else {
            console.log('✅ Profile Update - User found, proceeding with update')
        }

        // Update the user profile
        const updatedUser = await prisma.user.update({
            where: { id: targetUserId },
            data: updateData,
            select: {
                id: true,
                name: true,
                arabicName: true,
                profileImage: true,
                bio: true,
                interests: true,
                goals: true,
                skillLevel: true,
                learningMode: true,
                studyBuddyPreferences: true,
                updatedAt: true
            }
        })

        // Parse JSON fields for response
        const profile = {
            ...updatedUser,
            interests: parseArrayField(updatedUser.interests),
            goals: parseArrayField(updatedUser.goals),
            studyBuddyPreferences: updatedUser.studyBuddyPreferences ? 
                JSON.parse(updatedUser.studyBuddyPreferences) : {}
        }

        return NextResponse.json({
            profile,
            message: 'Profile updated successfully'
        })
    } catch (error) {
        console.error('Update study buddy profile error:', error)
        return NextResponse.json(
            { error: 'Failed to update profile' },
            { status: 500 }
        )
    }
}

function calculateProfileCompleteness(profile: any): number {
    let score = 0
    const maxScore = 100

    // Basic info (30 points)
    if (profile.name) score += 15
    if (profile.bio) score += 15

    // Learning preferences (40 points)
    if (profile.interests && profile.interests.length > 0) score += 20
    if (profile.goals && profile.goals.length > 0) score += 20

    // Additional details (30 points)
    if (profile.skillLevel) score += 15
    if (profile.learningMode) score += 15

    return Math.round((score / maxScore) * 100)
}
