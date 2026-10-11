import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requiredRankForPost } from '@/lib/content-access'

/**
 * Global Search API
 * Search across courses, creators, live sessions, and resources
 * GET /api/global-search?q=query&type=all|courses|creators|live|resources&limit=20
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const query = (searchParams.get('q') || '').trim().slice(0, 120)
        const type = searchParams.get('type') || 'all'
        const requestedLimit = Number(searchParams.get('limit'))
        const limit = Number.isFinite(requestedLimit) && requestedLimit > 0
            ? Math.min(30, Math.floor(requestedLimit))
            : 20

        if (!['all', 'courses', 'creators', 'live', 'resources'].includes(type)) {
            return NextResponse.json({ error: 'Invalid search type' }, { status: 400 })
        }

        if (query.length < 2) {
            return NextResponse.json({
                results: [],
                message: 'Query must be at least 2 characters'
            })
        }

        const searchQuery = query
        const results: any = {
            courses: [],
            creators: [],
            liveSessions: [],
            resources: [],
            totalCount: 0
        }

        // Search Courses
        if (type === 'all' || type === 'courses') {
            const courses = await prisma.course.findMany({
                where: {
                    status: 'PUBLISHED',
                    OR: [
                        { title: { contains: searchQuery, mode: 'insensitive' } },
                        { titleAr: { contains: searchQuery, mode: 'insensitive' } },
                        { description: { contains: searchQuery, mode: 'insensitive' } },
                        { category: { contains: searchQuery, mode: 'insensitive' } },
                    ]
                },
                include: {
                    creator: {
                        select: {
                            user: {
                                select: { name: true, arabicName: true, profileImage: true }
                            }
                        }
                    },
                    _count: { select: { enrollments: true, lessons: true } }
                },
                take: limit,
                orderBy: { totalEnrollments: 'desc' }
            })

            results.courses = courses.map(course => ({
                id: course.id,
                type: 'course',
                title: course.title,
                titleAr: course.titleAr,
                description: course.description?.substring(0, 150) + '...',
                thumbnail: course.thumbnail,
                category: course.category,
                skillLevel: course.skillLevel,
                duration: course.duration,
                rating: course.rating,
                enrollmentCount: course._count.enrollments,
                lessonCount: course._count.lessons,
                creator: {
                    name: course.creator.user.name,
                    arabicName: course.creator.user.arabicName,
                    profileImage: course.creator.user.profileImage
                }
            }))
        }

        // Search Creators
        if (type === 'all' || type === 'creators') {
            const creators = await prisma.creator.findMany({
                where: {
                    kycStatus: 'VERIFIED',
                    OR: [
                        { user: { name: { contains: searchQuery, mode: 'insensitive' } } },
                        { user: { arabicName: { contains: searchQuery, mode: 'insensitive' } } },
                        { expertise: { contains: searchQuery, mode: 'insensitive' } },
                    ]
                },
                include: {
                    user: {
                        select: { id: true, name: true, arabicName: true, profileImage: true, bio: true }
                    },
                    channels: { select: { id: true }, take: 1 },
                    _count: { select: { courses: true } }
                },
                take: limit,
                orderBy: { totalSubscribers: 'desc' }
            })

            results.creators = creators.map(creator => ({
                id: creator.id,
                type: 'creator',
                userId: creator.user.id,
                name: creator.user.name,
                arabicName: creator.user.arabicName,
                profileImage: creator.user.profileImage,
                bio: creator.user.bio?.substring(0, 150) + '...',
                expertise: creator.expertise,
                totalSubscribers: creator.totalSubscribers,
                courseCount: creator._count.courses,
                hasChannel: creator.channels.length > 0,
                channelId: creator.channels[0]?.id
            }))
        }

        // Search Live Sessions
        if (type === 'all' || type === 'live') {
            const liveSessions = await prisma.liveSession.findMany({
                where: {
                    status: { in: ['SCHEDULED', 'LIVE'] },
                    OR: [
                        { title: { contains: searchQuery, mode: 'insensitive' } },
                        { titleAr: { contains: searchQuery, mode: 'insensitive' } },
                        { description: { contains: searchQuery, mode: 'insensitive' } },
                    ]
                },
                include: {
                    channel: {
                        select: {
                            name: true,
                            creator: {
                                select: {
                                    user: { select: { name: true, arabicName: true, profileImage: true } }
                                }
                            }
                        }
                    },
                    _count: { select: { attendees: true } }
                },
                take: limit,
                orderBy: { scheduledAt: 'asc' }
            })

            results.liveSessions = liveSessions.map(session => ({
                id: session.id,
                type: 'live',
                title: session.title,
                titleAr: session.titleAr,
                description: session.description?.substring(0, 150) + '...',
                status: session.status,
                scheduledAt: session.scheduledAt,
                duration: session.duration,
                tier: session.tier,
                attendeeCount: session._count.attendees,
                maxAttendees: session.maxAttendees,
                creator: {
                    name: session.channel.creator.user.name,
                    arabicName: session.channel.creator.user.arabicName,
                    profileImage: session.channel.creator.user.profileImage
                },
                channelName: session.channel.name
            }))
        }

        // Search Channel Posts (Resources)
        if (type === 'all' || type === 'resources') {
            const posts = await prisma.channelPost.findMany({
                where: {
                    publishedAt: { lte: new Date() },
                    OR: [
                        { title: { contains: searchQuery, mode: 'insensitive' } },
                        { titleAr: { contains: searchQuery, mode: 'insensitive' } },
                        {
                            content: { contains: searchQuery, mode: 'insensitive' },
                            tier: { in: ['BRONZE', 'FREE', 'PUBLIC'] },
                        },
                    ]
                },
                select: {
                    id: true,
                    title: true,
                    titleAr: true,
                    content: true,
                    type: true,
                    mediaUrl: true,
                    thumbnailUrl: true,
                    tier: true,
                    publishedAt: true,
                    channel: {
                        select: {
                            name: true,
                            creator: {
                                select: {
                                    user: { select: { name: true, arabicName: true, profileImage: true } }
                                }
                            }
                        }
                    }
                },
                take: limit,
                orderBy: { publishedAt: 'desc' }
            })

            results.resources = posts.map(post => ({
                id: post.id,
                type: 'resource',
                title: post.title,
                titleAr: post.titleAr,
                content: requiredRankForPost(post.tier) === 0
                    ? post.content?.substring(0, 150) + '...'
                    : '',
                postType: post.type,
                mediaUrl: requiredRankForPost(post.tier) === 0 ? post.mediaUrl : null,
                thumbnailUrl: requiredRankForPost(post.tier) === 0 || post.type === 'VIDEO'
                    ? post.thumbnailUrl : null,
                tier: post.tier,
                publishedAt: post.publishedAt,
                creator: {
                    name: post.channel.creator.user.name,
                    arabicName: post.channel.creator.user.arabicName,
                    profileImage: post.channel.creator.user.profileImage
                },
                channelName: post.channel.name
            }))
        }

        // Calculate total count
        results.totalCount =
            results.courses.length +
            results.creators.length +
            results.liveSessions.length +
            results.resources.length

        return NextResponse.json(results)
    } catch (error) {
        console.error('Global search error:', error)
        return NextResponse.json(
            { error: 'Failed to perform search' },
            { status: 500 }
        )
    }
}
