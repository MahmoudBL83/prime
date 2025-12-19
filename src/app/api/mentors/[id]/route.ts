import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        const { id: mentorId } = await context.params

        console.log('Fetching mentor profile for ID:', mentorId)

        // Fetch mentor/creator details
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
                            take: 50
                        }
                    }
                },
                courses: {
                    include: {
                        enrollments: true
                    }
                }
            }
        })

        if (!mentor) {
            console.log('Mentor not found for ID:', mentorId)
            return NextResponse.json(
                { error: 'Mentor not found' },
                { status: 404 }
            )
        }

        console.log('Found mentor:', mentor.user.name)

        // Get additional stats
        const completedMeetings = await prisma.meeting.count({
            where: {
                creatorId: mentor.id,
                status: 'COMPLETED'
            }
        })

        const reviews = await prisma.review.findMany({
            where: {
                courseId: {
                    in: mentor.courses.map(course => course.id)
                }
            }
        })

        const averageRating = reviews.length > 0
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
            : 0 // No fake rating - show 0 if no reviews

        const totalStudents = mentor.courses.reduce(
            (sum, course) => sum + course.enrollments.length,
            0
        )

        // Calculate years of experience
        const yearsOfExperience = Math.max(1,
            Math.floor((new Date().getTime() - new Date(mentor.createdAt || new Date()).getTime()) / (1000 * 60 * 60 * 24 * 365))
        )

        // Calculate followers count
        const totalFollowersCount = await prisma.instructorFollow.count({
            where: {
                creatorId: mentor.id
            }
        })

        const totalFollowers = totalFollowersCount;

        // Check if user is subscribed
        let isSubscribed = false
        let userTier = undefined

        if (session?.user?.id) {
            const subscription = await prisma.subscription.findFirst({
                where: {
                    userId: session.user.id,
                    channelId: mentor.channels[0]?.id,
                    status: 'ACTIVE'
                }
            })
            isSubscribed = !!subscription
            if (subscription?.metadata) {
                try {
                    const meta = JSON.parse(subscription.metadata)
                    userTier = meta.tier
                } catch (e) {
                    // ignore
                }
            }
        }

        // Process posts with access control and engagement data
        const channel = mentor.channels[0]
        let processedPosts: Array<{
            id: string;
            title: string;
            titleAr?: string;
            content: string;
            contentAr?: string;
            type: string;
            tier: string;
            mediaUrl?: string;
            mediaType?: string;
            publishedAt?: Date | string | null;
            viewCount?: number;
            isPinned?: boolean;
            hasAccess: boolean;
            likesCount: number;
            commentsCount: number;
            isLiked: boolean;
        }> = []

        if (channel) {
            const postsWithEngagement = await Promise.all(
                channel.posts.map(async (post: any) => {
                    // Count likes
                    const likesCount = await prisma.postLike.count({
                        where: { postId: post.id }
                    })

                    // Count comments
                    const commentsCount = await prisma.postComment.count({
                        where: { postId: post.id }
                    })

                    // Check if current user liked this post
                    let isLiked = false
                    if (session?.user?.id) {
                        const like = await prisma.postLike.findUnique({
                            where: {
                                postId_userId: {
                                    postId: post.id,
                                    userId: session.user.id
                                }
                            }
                        })
                        isLiked = !!like
                    }

                    // Determine access based on tier
                    const tierHierarchy = { BRONZE: 1, SILVER: 2, GOLD: 3, VIP: 4 }
                    const postTierLevel = tierHierarchy[post.tier as keyof typeof tierHierarchy] || 1
                    const userTierLevel = userTier ? tierHierarchy[userTier as keyof typeof tierHierarchy] || 0 : 0

                    const hasAccess = isSubscribed && userTierLevel >= postTierLevel

                    return {
                        id: post.id,
                        title: post.title,
                        titleAr: post.titleAr,
                        content: post.content,
                        contentAr: post.contentAr,
                        type: post.type,
                        tier: post.tier,
                        mediaUrl: post.mediaUrl,
                        mediaType: post.mediaType,
                        publishedAt: post.publishedAt,
                        viewCount: post.viewCount,
                        isPinned: post.isPinned,
                        hasAccess,
                        likesCount,
                        commentsCount,
                        isLiked
                    }
                })
            )

            processedPosts = postsWithEngagement
        }

        // Build response
        const response = {
            id: mentor.id,
            user: {
                ...mentor.user,
                arabicName: mentor.user.arabicName || mentor.user.name, // Fallback to name if no Arabic name
                bio: mentor.user.bio || '' // Empty string if no bio - no fake text
            },
            expertise: mentor.expertise || '',
            languages: mentor.languages || '',
            timezone: mentor.timezone || '',
            monthlyPrice: (mentor as any).monthlyPrice || mentor.basicMonthlyPrice || 0, // No fake price - 0 if not set
            currency: 'EUR',
            hourlyRate: mentor.hourlyRate || null,
            availableForMeetings: mentor.availableForMeetings ?? true,
            socialLinks: mentor.socialLinks || null,
            totalSubscribers: mentor.totalSubscribers || 0,
            stats: {
                averageRating: parseFloat(averageRating.toFixed(1)),
                totalPosts: channel?.posts.length || 0,
                yearsOfExperience,
                totalStudents,
                completedMeetings,
                totalFollowers,
                totalCourses: mentor.courses.length
            },
            // Include courses list for reviews
            courses: mentor.courses.map(course => ({
                id: course.id,
                title: (course as any).title || 'Untitled Course',
                titleAr: (course as any).titleAr || null
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
            userTier
        }

        console.log('Sending response for mentor:', mentor.user.name, 'with', response.stats.totalPosts, 'posts')

        return NextResponse.json(response)

    } catch (error) {
        console.error('Error fetching mentor profile:', error)
        return NextResponse.json(
            { error: 'Failed to fetch mentor profile' },
            { status: 500 }
        )
    }
}
