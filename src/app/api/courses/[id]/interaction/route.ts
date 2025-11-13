import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/courses/[id]/interaction - Get user's interaction with course
export async function GET(
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

        const { id } = await params

        const interaction = await prisma.courseInteraction.findUnique({
            where: {
                userId_courseId: {
                    userId: user.id,
                    courseId: id
                }
            }
        })

        return NextResponse.json({
            liked: interaction?.liked ?? null,
            inMyList: interaction?.inMyList ?? false
        })
    } catch (error) {
        console.error('Error fetching interaction:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/courses/[id]/interaction - Update interaction (like/dislike/mylist)
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

        const { id } = await params
        const body = await request.json()
        const { action, value } = body

        // action can be: "like", "dislike", "clearRating", "addToList", "removeFromList"
        let updateData: any = {}

        switch (action) {
            case 'like':
                updateData.liked = true
                break
            case 'dislike':
                updateData.liked = false
                break
            case 'clearRating':
                updateData.liked = null
                break
            case 'addToList':
                updateData.inMyList = true
                break
            case 'removeFromList':
                updateData.inMyList = false
                break
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

        const interaction = await prisma.courseInteraction.upsert({
            where: {
                userId_courseId: {
                    userId: user.id,
                    courseId: id
                }
            },
            create: {
                userId: user.id,
                courseId: id,
                ...updateData
            },
            update: updateData
        })

        return NextResponse.json({
            success: true,
            liked: interaction.liked,
            inMyList: interaction.inMyList
        })
    } catch (error) {
        console.error('Error updating interaction:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
