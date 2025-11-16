import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params;
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: session.user.id,
                    courseId: id,
                },
            },
        })

        return NextResponse.json({ enrollment })
    } catch (error) {
        console.error('Enrollment check error:', error)
        return NextResponse.json(
            { error: 'Failed to check enrollment' },
            { status: 500 }
        )
    }
}

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
        })

        if (!course || course.status !== 'PUBLISHED') {
            return NextResponse.json(
                { error: 'Course not available' },
                { status: 404 }
            )
        }

        // Create enrollment
        const enrollment = await prisma.enrollment.create({
            data: {
                userId: session.user.id,
                courseId: id,
                progress: 0,
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
