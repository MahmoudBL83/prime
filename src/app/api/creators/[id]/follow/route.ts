import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Follow a creator
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: creatorId } = await params

        // Check if the creator exists
        const creator = await prisma.creator.findUnique({
            where: { id: creatorId }
        })

        if (!creator) {
            return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
        }

        // Check if already following
        const existingFollow = await prisma.instructorFollow.findUnique({
            where: {
                userId_creatorId: {
                    userId: session.user.id,
                    creatorId: creatorId
                }
            }
        })

        if (existingFollow) {
            return NextResponse.json({ error: 'Already following this creator' }, { status: 400 })
        }

        // Create follow relationship
        await prisma.instructorFollow.create({
            data: {
                userId: session.user.id,
                creatorId: creatorId
            }
        })

        // Update creator's follower count
        await prisma.creator.update({
            where: { id: creatorId },
            data: {
                totalSubscribers: {
                    increment: 1
                }
            }
        })

        return NextResponse.json({ 
            success: true,
            message: 'Successfully followed creator',
            isFollowing: true
        })
    } catch (error) {
        console.error('Follow creator error:', error)
        return NextResponse.json(
            { error: 'Failed to follow creator' },
            { status: 500 }
        )
    }
}

// DELETE - Unfollow a creator
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: creatorId } = await params

        // Check if currently following
        const existingFollow = await prisma.instructorFollow.findUnique({
            where: {
                userId_creatorId: {
                    userId: session.user.id,
                    creatorId: creatorId
                }
            }
        })

        if (!existingFollow) {
            return NextResponse.json({ error: 'Not following this creator' }, { status: 400 })
        }

        // Remove follow relationship
        await prisma.instructorFollow.delete({
            where: {
                id: existingFollow.id
            }
        })

        // Update creator's follower count
        await prisma.creator.update({
            where: { id: creatorId },
            data: {
                totalSubscribers: {
                    decrement: 1
                }
            }
        })

        return NextResponse.json({ 
            success: true,
            message: 'Successfully unfollowed creator',
            isFollowing: false
        })
    } catch (error) {
        console.error('Unfollow creator error:', error)
        return NextResponse.json(
            { error: 'Failed to unfollow creator' },
            { status: 500 }
        )
    }
}

// GET - Check follow status
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        const { id: creatorId } = await params

        let isFollowing = false

        if (session?.user) {
            const follow = await prisma.instructorFollow.findUnique({
                where: {
                    userId_creatorId: {
                        userId: session.user.id,
                        creatorId: creatorId
                    }
                }
            })
            isFollowing = !!follow
        }

        return NextResponse.json({ isFollowing })
    } catch (error) {
        console.error('Check follow status error:', error)
        return NextResponse.json(
            { error: 'Failed to check follow status' },
            { status: 500 }
        )
    }
}
