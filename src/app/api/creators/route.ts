import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
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
            kycStatus: 'VERIFIED' as any, // Only show verified creators
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
        const [creators, total] = await Promise.all([
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

        // If user is logged in, also fetch their creator profile (even if not verified)
        let userCreator = null
        if (session?.user) {
            console.log('Creators API: Fetching creator for userId:', session.user.id)
            userCreator = await prisma.creator.findFirst({
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
            console.log('Creators API: User creator found?', userCreator ? 'YES' : 'NO', userCreator?.id)
        } else {
            console.log('Creators API: No session, skipping user creator fetch')
        }

        // Combine creators list with user's creator (if exists and not already in list)
        let allCreators = creators
        if (userCreator && !creators.find(c => c.id === userCreator.id)) {
            console.log('Creators API: Adding user creator to list')
            allCreators = [userCreator, ...creators]
        } else if (userCreator) {
            console.log('Creators API: User creator already in list')
        }

        // Calculate stats for each creator
        const creatorsWithStats = await Promise.all(
            allCreators.map(async (creator) => {
                const courses = await prisma.course.findMany({
                    where: { creatorId: creator.id },
                    select: { rating: true, totalEnrollments: true },
                })

                const totalRatings = courses.reduce((sum, course) => sum + course.rating, 0)
                const averageRating = courses.length > 0 ? totalRatings / courses.length : 0
                const totalEnrollments = courses.reduce((sum, course) => sum + course.totalEnrollments, 0)

                // Get recent activity (mock data - could be from posts/content table)
                const hasNewContent = Math.random() > 0.5
                const isOnline = Math.random() > 0.6

                // Get analytics
                const analytics = creator.analytics[0]

                return {
                    id: creator.id,
                    userId: creator.userId, // Add userId for matching with session
                    channelId: creator.id, // For navigation
                    user: {
                        id: creator.user.id,
                        name: creator.user.name,
                        arabicName: creator.user.arabicName,
                        profileImage: creator.user.profileImage,
                        bio: creator.user.bio || 'Educational content creator',
                    },
                    channels: creator.channels, // Add channels with coverImage
                    expertise: creator.expertise || 'General Education',
                    basicMonthlyPrice: creator.basicMonthlyPrice || 49,
                    premiumMonthlyPrice: creator.premiumMonthlyPrice || 99,
                    vipMonthlyPrice: creator.vipMonthlyPrice || 199,
                    totalSubscribers: creator.totalSubscribers,
                    stats: {
                        averageRating,
                        totalPosts: analytics?.totalViews ? Math.floor(analytics.totalViews / 100) : Math.floor(Math.random() * 200) + 50,
                        yearsOfExperience: Math.floor((Date.now() - new Date(creator.createdAt).getTime()) / (365 * 24 * 60 * 60 * 1000)) || 1,
                        totalViews: analytics?.totalViews || Math.floor(Math.random() * 50000) + 10000,
                    },
                    isOnline,
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
