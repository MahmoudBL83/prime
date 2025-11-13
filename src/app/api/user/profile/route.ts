import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateProfileSchema = z.object({
    name: z.string().min(1).optional(),
    arabicName: z.string().optional(),
    phone: z.string().optional(),
    interests: z.array(z.string()).optional(),
    goals: z.array(z.string()).optional(),
    skillLevel: z.string().optional(),
    learningMode: z.string().optional(),
})

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                arabicName: true,
                phone: true,
                interests: true,
                goals: true,
                skillLevel: true,
                learningMode: true,
                onboardingCompleted: true,
                role: true,
                emailVerified: true,
                createdAt: true,
                updatedAt: true,
                // Include subscription and enrollment data
                subscriptions: {
                    where: {
                        status: 'ACTIVE'
                    },
                    select: {
                        status: true,
                        startDate: true,
                        endDate: true,
                        type: true,
                        pricePerMonth: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1
                },
                enrollments: {
                    select: {
                        courseId: true,
                        progress: true,
                        createdAt: true,
                        lastAccessedAt: true,
                        completedAt: true
                    }
                }
            },
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Parse JSON strings back to arrays for interests and goals
        const parsedUser = {
            ...user,
            interests: (() => {
                try {
                    return user.interests ? JSON.parse(user.interests) : []
                } catch {
                    return []
                }
            })(),
            goals: (() => {
                try {
                    return user.goals ? JSON.parse(user.goals) : []
                } catch {
                    return []
                }
            })(),
            // Add subscription status
            subscriptionStatus: user.subscriptions.length > 0 ? user.subscriptions[0].status : 'NONE',
            // Format enrollment data
            enrollments: user.enrollments.map(enrollment => ({
                courseId: enrollment.courseId,
                progress: enrollment.progress,
                lastAccessed: enrollment.lastAccessedAt?.toISOString(),
                enrolledAt: enrollment.createdAt.toISOString(),
                completedAt: enrollment.completedAt?.toISOString()
            }))
        }

        return NextResponse.json({ user: parsedUser })
    } catch (error) {
        console.error('Profile fetch error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch profile' },
            { status: 500 }
        )
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const validation = updateProfileSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: validation.error.issues },
                { status: 400 }
            )
        }

        const updateData: any = {}
        
        if (validation.data.name !== undefined) {
            updateData.name = validation.data.name
        }
        
        if (validation.data.arabicName !== undefined) {
            updateData.arabicName = validation.data.arabicName
        }
        
        if (validation.data.phone !== undefined) {
            updateData.phone = validation.data.phone
        }
        
        if (validation.data.interests !== undefined) {
            updateData.interests = JSON.stringify(validation.data.interests)
        }
        
        if (validation.data.goals !== undefined) {
            updateData.goals = JSON.stringify(validation.data.goals)
        }
        
        if (validation.data.skillLevel !== undefined) {
            updateData.skillLevel = validation.data.skillLevel
        }
        
        if (validation.data.learningMode !== undefined) {
            updateData.learningMode = validation.data.learningMode
        }

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                arabicName: true,
                phone: true,
                interests: true,
                goals: true,
                skillLevel: true,
                learningMode: true,
                updatedAt: true
            }
        })

        return NextResponse.json({
            user: updatedUser,
            message: 'Profile updated successfully'
        })
    } catch (error) {
        console.error('Profile update error:', error)
        return NextResponse.json(
            { error: 'Failed to update profile' },
            { status: 500 }
        )
    }
}
