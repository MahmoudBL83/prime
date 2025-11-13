import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/courses/[id]/my-list - Add to My List
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

        // Check if course exists
        const course = await prisma.course.findUnique({
            where: { id: courseId }
        })

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 })
        }

        // Add to My List
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
                inMyList: true
            },
            update: {
                inMyList: true
            }
        })

        return NextResponse.json({
            success: true,
            inMyList: interaction.inMyList
        })
    } catch (error) {
        console.error('Error adding to my list:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/courses/[id]/my-list - Remove from My List
export async function DELETE(
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

        // Remove from My List
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
                inMyList: false
            },
            update: {
                inMyList: false
            }
        })

        return NextResponse.json({
            success: true,
            inMyList: interaction.inMyList
        })
    } catch (error) {
        console.error('Error removing from my list:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
