import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Like a post
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Ensure we have a valid user record in the database
        const sessionEmail = session.user.email
        let dbUser = await prisma.user.findUnique({ where: { id: session.user.id } })

        if (!dbUser && sessionEmail) {
            dbUser = await prisma.user.findUnique({ where: { email: sessionEmail } })
        }

        if (!dbUser) {
            return NextResponse.json(
                { error: 'User account not found. Please re-login.' },
                { status: 404 }
            )
        }

        const userId = dbUser.id

        const { id: postId } = await params

        // Check if post exists
        const post = await prisma.channelPost.findUnique({
            where: { id: postId }
        })

        if (!post) {
            return NextResponse.json(
                { error: 'Post not found' },
                { status: 404 }
            )
        }

        // Check if already liked
        const existingLike = await prisma.postLike.findUnique({
            where: {
                postId_userId: {
                    postId,
                    userId
                }
            }
        })

        if (existingLike) {
            return NextResponse.json(
                { error: 'Already liked' },
                { status: 400 }
            )
        }

        // Create like
        const like = await prisma.postLike.create({
            data: {
                postId,
                userId
            }
        })

        return NextResponse.json({ like })
    } catch (error) {
        console.error('Error liking post:', error)
        return NextResponse.json(
            { error: 'Failed to like post' },
            { status: 500 }
        )
    }
}

// Unlike a post
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Ensure we have a valid user record in the database
        const sessionEmail = session.user.email
        let dbUser = await prisma.user.findUnique({ where: { id: session.user.id } })

        if (!dbUser && sessionEmail) {
            dbUser = await prisma.user.findUnique({ where: { email: sessionEmail } })
        }

        if (!dbUser) {
            return NextResponse.json(
                { error: 'User account not found. Please re-login.' },
                { status: 404 }
            )
        }

        const userId = dbUser.id

        const { id: postId } = await params

        // Delete like
        await prisma.postLike.delete({
            where: {
                postId_userId: {
                    postId,
                    userId
                }
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error unliking post:', error)
        return NextResponse.json(
            { error: 'Failed to unlike post' },
            { status: 500 }
        )
    }
}
