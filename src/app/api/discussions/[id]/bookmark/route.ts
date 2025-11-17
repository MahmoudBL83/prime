/**
 * Discussion Bookmark API
 * POST /api/discussions/[id]/bookmark
 * DELETE /api/discussions/[id]/bookmark
 * 
 * Save discussions for later reference
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Bookmark discussion
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        // Note: Using PostBookmark as discussionBookmark doesn't exist
        // This is a workaround - ideally we'd have a DiscussionBookmark model
        const existing = await prisma.postBookmark.findFirst({
            where: {
                postId: id, // Using postId instead of discussionId
                userId: (session.user as any).id
            }
        })

        if (existing) {
            return NextResponse.json({
                success: true,
                message: 'Already bookmarked'
            })
        }

        // Create bookmark (using PostBookmark as workaround)
        const bookmark = await prisma.postBookmark.create({
            data: {
                postId: id, // Using postId instead of discussionId
                userId: (session.user as any).id
            }
        })

        return NextResponse.json({
            success: true,
            data: bookmark
        }, { status: 201 })

    } catch (error) {
        console.error('Bookmark error:', error)
        return NextResponse.json(
            { error: 'Failed to bookmark discussion' },
            { status: 500 }
        )
    }
}

// DELETE - Remove bookmark
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        // Find and delete bookmark (using PostBookmark as workaround)
        const bookmark = await prisma.postBookmark.findFirst({
            where: {
                postId: id, // Using postId instead of discussionId
                userId: (session.user as any).id
            }
        })

        if (!bookmark) {
            return NextResponse.json({
                success: true,
                message: 'Bookmark not found'
            })
        }

        await prisma.postBookmark.delete({
            where: { id: bookmark.id }
        })

        return NextResponse.json({
            success: true
        })

    } catch (error) {
        console.error('Remove bookmark error:', error)
        return NextResponse.json(
            { error: 'Failed to remove bookmark' },
            { status: 500 }
        )
    }
}

// GET - Get user's bookmarks
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        // Note: This is simplified since discussionBookmark model doesn't exist
        // In a real implementation, we'd need proper DiscussionBookmark model
        const bookmarks = await prisma.postBookmark.findMany({
            where: {
                userId: (session.user as any).id
            },
            include: {
                post: {
                    select: {
                        id: true,
                        content: true,
                        createdAt: true,
                        channel: {
                            select: {
                                id: true,
                                name: true,
                                creator: {
                                    select: {
                                        id: true,
                                        user: {
                                            select: {
                                                id: true,
                                                name: true,
                                                profileImage: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json({
            success: true,
            data: bookmarks
        })

    } catch (error) {
        console.error('Get bookmarks error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch bookmarks' },
            { status: 500 }
        )
    }
}
