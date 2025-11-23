import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/bookmarks - Toggle bookmark for a post
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

        const { postId } = await req.json()

        if (!postId) {
            return NextResponse.json({ error: 'Post ID is required' }, { status: 400 })
        }

        // Check if bookmark already exists
        const existingBookmark = await prisma.postBookmark.findUnique({
            where: {
                userId_postId: {
                    userId,
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
                        userId,
                        postId: postId
                    }
                }
            })
            bookmarked = false
        } else {
            // Add bookmark
            await prisma.postBookmark.create({
                data: {
                    userId,
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

        const bookmarks = await prisma.postBookmark.findMany({
            where: {
                userId
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
