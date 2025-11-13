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
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        // Check if already bookmarked
        const existing = await prisma.discussionBookmark.findFirst({
            where: {
                discussionId: params.id,
                userId: session.user.id
            }
        })

        if (existing) {
            return NextResponse.json({
                success: true,
                message: 'Already bookmarked'
            })
        }

        // Create bookmark
        const bookmark = await prisma.discussionBookmark.create({
            data: {
                discussionId: params.id,
                userId: session.user.id
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
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        // Find and delete bookmark
        const bookmark = await prisma.discussionBookmark.findFirst({
            where: {
                discussionId: params.id,
                userId: session.user.id
            }
        })

        if (!bookmark) {
            return NextResponse.json({
                success: true,
                message: 'Bookmark not found'
            })
        }

        await prisma.discussionBookmark.delete({
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

        const bookmarks = await prisma.discussionBookmark.findMany({
            where: {
                userId: session.user.id
            },
            include: {
                discussion: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true,
                                image: true
                            }
                        },
                        course: {
                            select: {
                                id: true,
                                title: true,
                                titleAr: true
                            }
                        },
                        _count: {
                            select: {
                                replies: true
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
