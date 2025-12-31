import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/user/lists
 * Get all user lists
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const lists = await prisma.userList.findMany({
            where: { userId: session.user.id },
            include: {
                items: {
                    include: {
                        post: {
                            select: {
                                id: true,
                                content: true,
                                thumbnailUrl: true,
                                type: true,
                                createdAt: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ lists })
    } catch (error) {
        console.error('Error fetching lists:', error)
        return NextResponse.json(
            { error: 'Failed to fetch lists' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/user/lists
 * Create a new list or add/remove post from list
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await req.json()
        const { action, listId, listName, postId } = body

        // Create new list
        if (action === 'create') {
            if (!listName) {
                return NextResponse.json(
                    { error: 'List name is required' },
                    { status: 400 }
                )
            }

            const list = await prisma.userList.create({
                data: {
                    userId: session.user.id,
                    name: listName
                }
            })

            return NextResponse.json({
                success: true,
                list,
                message: 'List created successfully'
            })
        }

        // Add post to list
        if (action === 'add') {
            if (!listId || !postId) {
                return NextResponse.json(
                    { error: 'List ID and Post ID are required' },
                    { status: 400 }
                )
            }

            // Verify list belongs to user
            const list = await prisma.userList.findFirst({
                where: { id: listId, userId: session.user.id }
            })

            if (!list) {
                return NextResponse.json(
                    { error: 'List not found' },
                    { status: 404 }
                )
            }

            // Check if already in list
            const existing = await prisma.userListItem.findFirst({
                where: { listId, postId }
            })

            if (existing) {
                return NextResponse.json(
                    { error: 'Post already in list' },
                    { status: 400 }
                )
            }

            await prisma.userListItem.create({
                data: { listId, postId }
            })

            return NextResponse.json({
                success: true,
                message: 'Post added to list'
            })
        }

        // Remove post from list
        if (action === 'remove') {
            if (!listId || !postId) {
                return NextResponse.json(
                    { error: 'List ID and Post ID are required' },
                    { status: 400 }
                )
            }

            await prisma.userListItem.deleteMany({
                where: { listId, postId }
            })

            return NextResponse.json({
                success: true,
                message: 'Post removed from list'
            })
        }

        return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
        )

    } catch (error) {
        console.error('List operation error:', error)
        return NextResponse.json(
            { error: 'Failed to perform list operation' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/user/lists
 * Delete a list
 */
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(req.url)
        const listId = searchParams.get('listId')

        if (!listId) {
            return NextResponse.json(
                { error: 'List ID is required' },
                { status: 400 }
            )
        }

        // Verify list belongs to user
        const list = await prisma.userList.findFirst({
            where: { id: listId, userId: session.user.id }
        })

        if (!list) {
            return NextResponse.json(
                { error: 'List not found' },
                { status: 404 }
            )
        }

        // Delete list items first, then the list
        await prisma.userListItem.deleteMany({
            where: { listId }
        })

        await prisma.userList.delete({
            where: { id: listId }
        })

        return NextResponse.json({
            success: true,
            message: 'List deleted successfully'
        })

    } catch (error) {
        console.error('Delete list error:', error)
        return NextResponse.json(
            { error: 'Failed to delete list' },
            { status: 500 }
        )
    }
}
