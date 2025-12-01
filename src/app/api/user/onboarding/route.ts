import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const onboardingSchema = z.object({
    interests: z.array(z.string()).min(1),
    goals: z.array(z.string()).min(1),
    skillLevel: z.enum(['beginner', 'intermediate', 'advanced']),
    availability: z.enum(['weekdays-morning', 'weekdays-evening', 'weekends', 'flexible']),
    studyBuddyOptIn: z.boolean(),
    age: z.string(),
    avatar: z.string(),
})

export async function POST(req: NextRequest) {
    console.log('🔥 Onboarding API called!')

    try {
        const session = await getServerSession(authOptions)
        console.log('👤 Session check:', {
            hasSession: !!session,
            userId: session?.user?.id,
            userEmail: session?.user?.email
        })

        if (!session?.user) {
            console.log('🚫 No session found, returning unauthorized')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        console.log('📥 Received onboarding data keys:', Object.keys(body))
        console.log('📥 Full onboarding data:', body)

        const validation = onboardingSchema.safeParse(body)

        if (!validation.success) {
            console.log('❌ Validation failed:', validation.error.issues)
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.issues },
                { status: 400 }
            )
        }

        const data = validation.data

        // Update user profile with onboarding data
        console.log('📝 Updating user with data:', {
            userId: session.user.id,
            dataKeys: Object.keys(data),
            hasStudyBuddy: !!data.studyBuddyOptIn
        })

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                interests: JSON.stringify(data.interests),
                goals: JSON.stringify(data.goals),
                skillLevel: data.skillLevel,
                age: data.age,
                avatar: data.avatar,
                onboardingCompleted: true,
            },
        })

        // Create or update study buddy preferences
        // Note: In a real implementation, you might want to store these preferences
        // in a separate table or as part of the user profile
        // For now, we'll just acknowledge that the preferences were set

        console.log('✅ User onboarding completed successfully:', updatedUser.id)

        return NextResponse.json({
            message: 'Onboarding completed successfully',
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                interests: data.interests, // Return the original array
                goals: data.goals, // Return the original array
                skillLevel: updatedUser.skillLevel,
                learningMode: updatedUser.learningMode,
                age: updatedUser.age,
                avatar: updatedUser.avatar,
                arabicName: updatedUser.arabicName,
                phone: updatedUser.phone,
            },
        })
    } catch (error) {
        console.error('💥 Onboarding API Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : 'No stack',
            error
        })
        return NextResponse.json(
            { error: 'Failed to complete onboarding' },
            { status: 500 }
        )
    }
}
