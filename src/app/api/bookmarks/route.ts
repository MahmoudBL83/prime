import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/bookmarks - Toggle bookmark for a post
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { postId } = await req.json()

        if (!postId) {
            return NextResponse.json({ error: 'Post ID is required' }, { status: 400 })
        }

        // Check if bookmark already exists
        const existingBookmark = await prisma.postBookmark.findUnique({
            where: {
                userId_postId: {
                    userId: session.user.id,
                    postId: postId
                }
            }
        })

        let bookmarked = false

        if (existingBookmark) {
            // Remove bookmark
            await prisma.postBookmark.delete({
                where: {
                    userId_postId: {
                        userId: session.user.id,
                        postId: postId
                    }
                }
            })
            bookmarked = false
        } else {
            // Add bookmark
            await prisma.postBookmark.create({
                data: {
                    userId: session.user.id,
                    postId: postId
                }
            })
            bookmarked = true
        }

        return NextResponse.json({ 
            success: true,
            bookmarked
        })

    } catch (error) {
        console.error('Bookmark error:', error)
        return NextResponse.json(
            { error: 'Failed to toggle bookmark' },
            { status: 500 }
        )
    }
}

// GET /api/bookmarks - Get user's bookmarked posts
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const bookmarks = await prisma.postBookmark.findMany({
            where: {
                userId: session.user.id
            },
            include: {
                post: {
                    include: {
                        channel: {
                            include: {
                                creator: {
                                    include: {
                                        user: {
                                            select: {
                                                id: true,
                                                name: true,
                                                arabicName: true,
                                                profileImage: true
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        _count: {
                            select: {
                                likes: true,
                                comments: true
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
            bookmarks: bookmarks.map(b => ({
                ...b.post,
                bookmarkedAt: b.createdAt
            }))
        })

    } catch (error) {
        console.error('Failed to fetch bookmarks:', error)
        return NextResponse.json(
            { error: 'Failed to fetch bookmarks' },
            { status: 500 }
        )
    }
}
