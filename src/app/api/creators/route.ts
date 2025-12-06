import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        console.log('Creators API: Session user:', session?.user?.id)
        const { searchParams } = new URL(req.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const search = searchParams.get('search')
        const filter = searchParams.get('filter') || 'all' // all, trending, new, top

        const skip = (page - 1) * limit

        // Build where clause for filtering
        const where: any = {
            kycStatus: 'VERIFIED', // Only show verified creators
        }

        if (search) {
            where.OR = [
                { user: { name: { contains: search, mode: 'insensitive' } } },
                { user: { arabicName: { contains: search, mode: 'insensitive' } } },
                { expertise: { contains: search, mode: 'insensitive' } }
            ]
        }

        // Determine ordering based on filter
        let orderBy: any = []
        if (filter === 'trending') {
            orderBy = [{ totalSubscribers: 'desc' }, { totalEarnings: 'desc' }]
        } else if (filter === 'new') {
            orderBy = [{ createdAt: 'desc' }]
        } else if (filter === 'top') {
            orderBy = [{ totalEarnings: 'desc' }, { totalSubscribers: 'desc' }]
        } else {
            orderBy = [{ totalSubscribers: 'desc' }, { createdAt: 'desc' }]
        }

        // Fetch creators with full OnlyFans-style data
        const [allCreators, total] = await Promise.all([
            prisma.creator.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            arabicName: true,
                            email: true,
                            profileImage: true,
                            bio: true,
                        },
                    },
                    channels: {
                        select: {
                            id: true,
                            name: true,
                            nameAr: true,
                            description: true,
                            coverImage: true,
                        },
                    },
                    _count: {
                        select: {
                            courses: true,
                        },
                    },
                    analytics: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                    },
                },
                orderBy,
                skip,
                take: limit,
            }),
            prisma.creator.count({ where }),
        ])

        // Filter out creators without valid user relations (orphaned records)
        const creators = allCreators.filter(creator => creator.user !== null)

        // If user is logged in, also fetch their creator profile (even if not verified)
        let userCreator = null
        if (session?.user) {
            console.log('Creators API: Fetching creator for userId:', session.user.id)
            const fetchedUserCreator = await prisma.creator.findFirst({
                where: { userId: session.user.id },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            arabicName: true,
                            email: true,
                            profileImage: true,
                            bio: true,
                        },
                    },
                    channels: {
                        select: {
                            id: true,
                            name: true,
                            nameAr: true,
                            description: true,
                            coverImage: true,
                        },
                    },
                    _count: {
                        select: {
                            courses: true,
                        },
                    },
                    analytics: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                    },
                },
            })
            // Only set userCreator if it has a valid user relation
            if (fetchedUserCreator && fetchedUserCreator.user) {
                userCreator = fetchedUserCreator
                console.log('Creators API: User creator found:', userCreator.id)
            } else {
                console.log('Creators API: User creator not found or has no user relation')
            }
        } else {
            console.log('Creators API: No session, skipping user creator fetch')
        }

        // Combine creators list with user's creator (if exists and not already in list)
        let finalCreators = creators
        if (userCreator && !creators.find(c => c.id === userCreator.id)) {
            console.log('Creators API: Adding user creator to list')
            finalCreators = [userCreator, ...creators]
        } else if (userCreator) {
            console.log('Creators API: User creator already in list')
        }

        const now = new Date()

        // Calculate stats for each creator using real data only
        const creatorsWithStats = await Promise.all(
            finalCreators.map(async (creator) => {
                const [courses, totalPosts, latestPost, analytics] = await Promise.all([
                    prisma.course.findMany({
                        where: { creatorId: creator.id },
                        select: { rating: true, totalEnrollments: true },
                    }),
                    prisma.channelPost.count({
                        where: {
                            channel: { creatorId: creator.id },
                            publishedAt: { lte: now },
                        },
                    }),
                    prisma.channelPost.findFirst({
                        where: {
                            channel: { creatorId: creator.id },
                            publishedAt: { lte: now },
                        },
                        orderBy: { publishedAt: 'desc' },
                        select: { publishedAt: true },
                    }),
                    creator.analytics[0],
                ])

                const totalRatings = courses.reduce((sum, course) => sum + course.rating, 0)
                const averageRating = courses.length > 0 ? totalRatings / courses.length : 0
                const hasNewContent = latestPost ? (now.getTime() - latestPost.publishedAt.getTime()) <= 14 * 24 * 60 * 60 * 1000 : false
                const yearsOfExperience = Math.max(1, Math.floor((now.getTime() - new Date(creator.createdAt).getTime()) / (365 * 24 * 60 * 60 * 1000)))

                // Prefer a real channel id if present for navigation
                const primaryChannelId = creator.channels?.[0]?.id || creator.id

                return {
                    id: creator.id,
                    userId: creator.userId,
                    channelId: primaryChannelId,
                    user: {
                        id: creator.user.id,
                        name: creator.user.name,
                        arabicName: creator.user.arabicName,
                        profileImage: creator.user.profileImage,
                        bio: creator.user.bio || '',
                    },
                    channels: creator.channels,
                    expertise: creator.expertise || '',
                    basicMonthlyPrice: creator.basicMonthlyPrice || 0,
                    premiumMonthlyPrice: creator.premiumMonthlyPrice || 0,
                    vipMonthlyPrice: creator.vipMonthlyPrice || 0,
                    totalSubscribers: creator.totalSubscribers || 0,
                    stats: {
                        averageRating,
                        totalPosts,
                        yearsOfExperience,
                        totalViews: analytics?.totalViews || 0,
                    },
                    isOnline: false,
                    hasNewContent,
                    subscriptionBenefits: creator.subscriptionBenefits || null,
                    socialLinks: creator.socialLinks || null,
                    verified: creator.kycStatus === ('VERIFIED' as any),
                    createdAt: creator.createdAt,
                }
            })
        )

        return NextResponse.json({
            creators: creatorsWithStats,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        console.error('Creators fetch error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch creators' },
            { status: 500 }
        )
    }
}
