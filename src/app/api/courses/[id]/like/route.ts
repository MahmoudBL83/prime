import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/courses/[id]/like - Toggle like status
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const { id: courseId } = await params
        const body = await request.json()
        const { liked } = body

        // Check if course exists
        const course = await prisma.course.findUnique({
            where: { id: courseId }
        })

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 })
        }

        // Update like status
        const interaction = await prisma.courseInteraction.upsert({
            where: {
                userId_courseId: {
                    userId: user.id,
                    courseId: courseId
                }
            },
            create: {
                userId: user.id,
                courseId: courseId,
                liked: liked
            },
            update: {
                liked: liked
            }
        })

        return NextResponse.json({
            success: true,
            liked: interaction.liked
        })
    } catch (error) {
        console.error('Error updating like status:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
