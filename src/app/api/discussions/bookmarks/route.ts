/**
 * User Bookmarks API
 * GET /api/discussions/bookmarks
 * 
 * Fetch all bookmarks for current user
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get user's bookmarked discussions
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
            select: {
                discussionId: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json({
            success: true,
            bookmarks
        })

    } catch (error) {
        console.error('Get bookmarks error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch bookmarks' },
            { status: 500 }
        )
    }
}
