import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NO_SUBSCRIPTION, canViewPost, getViewerAccess } from '@/lib/content-access'

const visiblePostContent = (content: string | null, hasAccess: boolean, fallback: string) =>
    hasAccess ? content : fallback

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const [session, { id: mentorId }] = await Promise.all([
            getServerSession(authOptions),
            context.params,
        ])
        const viewerId = session?.user?.id

        const mentor = await prisma.creator.findUnique({
            where: { id: mentorId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        arabicName: true,
                        bio: true,
                        profileImage: true
                    }
                },
                channels: {
                    orderBy: { createdAt: 'asc' },
                    take: 1,
                    include: {
                        posts: {
                            where: {
                                publishedAt: {
                                    not: null
                                }
                            },
                            orderBy: [
                                { isPinned: 'desc' },
                                { publishedAt: 'desc' }
                            ],
                            take: 50,
                            include: {
                                _count: { select: { likes: true, comments: true } }
                            }
                        }
                    }
                },
                courses: {
                    where: { status: 'PUBLISHED', isHidden: false },
                    select: {
                        id: true,
                        title: true,
                        titleAr: true,
                        _count: { select: { enrollments: true } }
                    }
                }
            }
        })

        if (!mentor) {
            return NextResponse.json(
                { error: 'Mentor not found' },
                { status: 404 }
            )
        }

        const channel = mentor.channels[0]
        const courseIds = mentor.courses.map(course => course.id)
        const postIds = channel?.posts.map(post => post.id) ?? []

        // Everything below is independent - one round trip instead of many
        const [completedMeetings, ratingAggregate, totalFollowers, access, viewerLikes, publishedPostCount, application] = await Promise.all([
            prisma.meeting.count({
                where: {
                    creatorId: mentor.id,
                    status: 'COMPLETED'
                }
            }),
            courseIds.length > 0
                ? prisma.review.aggregate({ where: { courseId: { in: courseIds } }, _avg: { rating: true } })
                : Promise.resolve({ _avg: { rating: null as number | null } }),
            prisma.instructorFollow.count({
                where: {
                    creatorId: mentor.id
                }
            }),
            getViewerAccess(viewerId),
            viewerId && postIds.length > 0
                ? prisma.postLike.findMany({ where: { userId: viewerId, postId: { in: postIds } }, select: { postId: true } })
                : Promise.resolve([] as Array<{ postId: string }>),
            channel && channel.posts.length === 50
                ? prisma.channelPost.count({ where: { channelId: channel.id, publishedAt: { not: null } } })
                : Promise.resolve(channel?.posts.length ?? 0),
            prisma.creatorApplication.findUnique({
                where: { userId: mentor.userId },
                select: { experienceYears: true },
            }),
        ])

        const averageRating = ratingAggregate._avg.rating ?? 0 // No fake rating - 0 if no reviews
        const totalStudents = mentor.courses.reduce((sum, course) => sum + course._count.enrollments, 0)
        const yearsOfExperience = application?.experienceYears ?? null

        const isOwner = !!viewerId && mentor.userId === viewerId
        const viewerRank = access.rankFor(mentor.id, channel?.id)
        const isSubscribed = viewerRank !== NO_SUBSCRIPTION
        const userTier = access.tierFor(mentor.id, channel?.id)
        const likedPostIds = new Set(viewerLikes.map(like => like.postId))

        const processedPosts = (channel?.posts ?? []).map((post) => {
            const hasAccess = canViewPost(post.tier, viewerRank, isOwner)
            return {
                id: post.id,
                title: post.title,
                titleAr: post.titleAr,
                content: visiblePostContent(post.content, hasAccess, 'Subscribe to view this post.'),
                contentAr: visiblePostContent(post.contentAr, hasAccess, 'اشترك لعرض هذا المنشور.'),
                type: post.type,
                tier: post.tier,
                mediaUrl: hasAccess && post.mediaUrl !== '/images/demo-post-image.jpg' ? post.mediaUrl : null,
                thumbnailUrl: hasAccess || post.type === 'VIDEO' ? post.thumbnailUrl : null,
                mediaType: post.type,
                duration: post.duration,
                publishedAt: post.publishedAt,
                createdAt: post.createdAt,
                viewCount: post.viewCount,
                isPinned: post.isPinned,
                hasAccess,
                likesCount: post._count.likes,
                commentsCount: post._count.comments,
                isLiked: likedPostIds.has(post.id)
            }
        })

        return NextResponse.json({
            id: mentor.id,
            userId: mentor.userId,
            user: {
                ...mentor.user,
                arabicName: mentor.user.arabicName || mentor.user.name, // Fallback to name if no Arabic name
                bio: mentor.user.bio || '' // Empty string if no bio - no fake text
            },
            expertise: mentor.expertise || '',
            languages: mentor.languages || '',
            timezone: mentor.timezone || '',
            monthlyPrice: mentor.monthlyPrice ?? mentor.basicMonthlyPrice ?? 0,
            currency: 'EUR',
            hourlyRate: mentor.hourlyRate || null,
            availableForMeetings: mentor.availableForMeetings ?? true,
            socialLinks: mentor.socialLinks || null,
            totalSubscribers: mentor.totalSubscribers || 0,
            stats: {
                averageRating: parseFloat(averageRating.toFixed(1)),
                totalPosts: publishedPostCount,
                yearsOfExperience,
                totalStudents,
                completedMeetings,
                totalFollowers,
                totalCourses: mentor.courses.length
            },
            // Include courses list for reviews
            courses: mentor.courses.map(course => ({
                id: course.id,
                title: course.title || 'Untitled Course',
                titleAr: course.titleAr || null
            })),
            channel: channel ? {
                id: channel.id,
                name: channel.name,
                nameAr: channel.nameAr,
                description: channel.description,
                descriptionAr: channel.descriptionAr,
                coverImage: channel.coverImage,
                posts: processedPosts
            } : null,
            isSubscribed,
            isOwner,
            userTier
        })

    } catch (error) {
        console.error('Error fetching mentor profile:', error)
        return NextResponse.json(
            { error: 'Failed to fetch mentor profile' },
            { status: 500 }
        )
    }
}
