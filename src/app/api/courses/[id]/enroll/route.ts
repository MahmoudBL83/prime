import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkCourseAccess } from '@/lib/subscription-access'
import { Prisma } from '@prisma/client'

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params;
        // Check if user is already enrolled
        const existingEnrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: session.user.id,
                    courseId: id,
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
            where: { id: id },
            select: { id: true, status: true, isHidden: true, contentCategory: true, creator: { select: { userId: true } } },
        })

        if (!course || course.status !== 'PUBLISHED' || course.isHidden) {
            return NextResponse.json(
                { error: 'Course not available' },
                { status: 404 }
            )
        }

        const access = await checkCourseAccess(session.user.id, id)
        if (!access.hasAccess && course.creator.userId !== session.user.id) {
            return NextResponse.json({
                error: 'Subscription required',
                message: access.reason,
                subscriptionRequired: true,
                subscriptionType: course.contentCategory,
            }, { status: 402 })
        }

        const enrollment = await prisma.$transaction(async tx => {
            const created = await tx.enrollment.create({
                data: {
                    userId: session.user.id,
                    courseId: id,
                    progress: 0,
                    completedLessons: JSON.stringify([]),
                },
            })
            await tx.course.update({
                where: { id },
                data: { totalEnrollments: { increment: 1 } },
            })
            return created
        })

        return NextResponse.json({ enrollment })
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return NextResponse.json({ error: 'Already enrolled in this course' }, { status: 400 })
        }
        console.error('Enrollment error:', error)
        return NextResponse.json(
            { error: 'Failed to enroll in course' },
            { status: 500 }
        )
    }
}
