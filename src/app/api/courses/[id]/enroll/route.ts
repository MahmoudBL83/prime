import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if user is already enrolled
        const existingEnrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: session.user.id,
                    courseId: params.id,
                },
            },
        })

        if (existingEnrollment) {
            return NextResponse.json(
                { error: 'Already enrolled in this course' },
                { status: 400 }
            )
        }

        // Check if course exists and is published
        const course = await prisma.course.findUnique({
            where: { id: params.id },
        })

        if (!course || course.status !== 'PUBLISHED') {
            return NextResponse.json(
                { error: 'Course not available' },
                { status: 404 }
            )
        }

        // Check if user has required subscription for this course
        if (course.category && ['CATEGORY_A', 'CATEGORY_C'].includes(course.category)) {
            const hasActiveSubscription = await prisma.subscription.findFirst({
                where: {
                    userId: session.user.id,
                    type: course.category as 'CATEGORY_A' | 'CATEGORY_C',
                    status: 'ACTIVE',
                    startDate: { lte: new Date() },
                    endDate: { gte: new Date() }
                }
            })

            if (!hasActiveSubscription) {
                return NextResponse.json(
                    {
                        error: 'Subscription required',
                        message: `You need an active ${course.category} subscription to access this course`,
                        subscriptionRequired: true,
                        subscriptionType: course.category
                    },
                    { status: 402 } // Payment Required
                )
            }
        }

        // Create enrollment
        const enrollment = await prisma.enrollment.create({
            data: {
                userId: session.user.id,
                courseId: params.id,
                progress: 0,
                completedLessons: JSON.stringify([]),
            },
        })

        // Update course enrollment count
        await prisma.course.update({
            where: { id: params.id },
            data: {
                totalEnrollments: {
                    increment: 1,
                },
            },
        })

        return NextResponse.json({ enrollment })
    } catch (error) {
        console.error('Enrollment error:', error)
        return NextResponse.json(
            { error: 'Failed to enroll in course' },
            { status: 500 }
        )
    }
}
