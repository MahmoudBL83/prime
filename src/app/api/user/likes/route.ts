import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Get all post IDs liked by the current user
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json(
                { likedPostIds: [] },
                { status: 200 }
            )
        }

        const likes = await prisma.postLike.findMany({
            where: {
                userId: session.user.id
            },
            select: {
                postId: true
            }
        })

        const likedPostIds = likes.map(like => like.postId)

        return NextResponse.json({ likedPostIds })
    } catch (error) {
        console.error('Error fetching user likes:', error)
        return NextResponse.json(
            { error: 'Failed to fetch user likes' },
            { status: 500 }
        )
    }
}
