import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/subscriptions/status
 * 
 * Returns user's current subscription status and what content they have access to
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Get all active subscriptions
        const subscriptions = await prisma.subscription.findMany({
            where: {
                userId: session.user.id,
                status: {
                    in: ['ACTIVE', 'CANCELLED'] // Include cancelled but still valid
                },
                endDate: {
                    gte: new Date() // Only include subscriptions that haven't expired
                }
            },
            include: {
                channel: {
                    include: {
                        creator: {
                            include: {
                                user: {
                                    select: {
                                        name: true,
                                        profileImage: true
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

        // Get enrollment count
        const enrollmentCount = await prisma.enrollment.count({
            where: {
                userId: session.user.id
            }
        })

        // Determine what content user has access to
        const accessLevels = {
            hasCategoryA: subscriptions.some(s => 
                s.type === 'CATEGORY_A' || s.type === 'BUNDLE_AB' || s.type === 'BUNDLE_ABC'
            ),
            hasCategoryB: subscriptions.some(s => 
                s.type === 'CATEGORY_B' || s.type === 'BUNDLE_AB' || s.type === 'BUNDLE_ABC'
            ),
            categoryCChannels: subscriptions
                .filter(s => s.type === 'CATEGORY_C')
                .map(s => ({
                    channelId: s.channelId,
                    channelName: s.channel?.name,
                    creatorName: s.channel?.creator?.user?.name,
                    creatorImage: s.channel?.creator?.user?.profileImage
                }))
        }

        // Get course counts by category
        const courseCounts = await prisma.course.groupBy({
            by: ['contentCategory'],
            where: {
                status: 'PUBLISHED'
            },
            _count: true
        })

        // Get creator channels count
        const channelCount = await prisma.creatorChannel.count()

        const courseCountByCategory = {
            CATEGORY_A: courseCounts.find(c => c.contentCategory === 'CATEGORY_A')?._count || 0,
            CATEGORY_B: courseCounts.find(c => c.contentCategory === 'CATEGORY_B')?._count || 0,
            CATEGORY_C: channelCount // Use channel count for Category C
        }

        const availableCourseCounts = {
            categoryA: courseCountByCategory.CATEGORY_A,
            categoryB: courseCountByCategory.CATEGORY_B,
            categoryC: channelCount
        }

        return NextResponse.json({
            subscriptions: subscriptions.map(sub => ({
                id: sub.id,
                type: sub.type,
                status: sub.status,
                startDate: sub.startDate,
                endDate: sub.endDate,
                cancelledAt: sub.cancelledAt,
                pricePerMonth: sub.pricePerMonth,
                metadata: sub.metadata ? JSON.parse(sub.metadata) : null, // Parse JSON metadata which may contain creatorId and tier
                channelInfo: sub.channel ? {
                    id: sub.channel.id,
                    name: sub.channel.name,
                    nameAr: sub.channel.nameAr,
                    creator: {
                        name: sub.channel.creator.user.name,
                        image: sub.channel.creator.user.profileImage
                    }
                } : null
            })),
            access: accessLevels,
            enrollmentCount,
            courseCountByCategory, // Add this for subscribe page
            availableCourseCounts,
            hasActiveSubscription: subscriptions.length > 0,
            recommendations: generateSubscriptionRecommendations(subscriptions, availableCourseCounts)
        })

    } catch (error) {
        console.error('Subscription status error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch subscription status' },
            { status: 500 }
        )
    }
}

/**
 * Generate subscription recommendations based on current status
 */
function generateSubscriptionRecommendations(
    subscriptions: any[],
    courseCounts: any
): string[] {
    const recommendations: string[] = []
    
    const hasA = subscriptions.some(s => 
        s.type === 'CATEGORY_A' || s.type === 'BUNDLE_AB' || s.type === 'BUNDLE_ABC'
    )
    const hasB = subscriptions.some(s => 
        s.type === 'CATEGORY_B' || s.type === 'BUNDLE_AB' || s.type === 'BUNDLE_ABC'
    )

    if (!hasA && courseCounts.categoryA > 0) {
        recommendations.push(
            `Unlock ${courseCounts.categoryA}+ courses with the All-Access Library subscription!`
        )
    }

    if (!hasB && courseCounts.categoryB > 0) {
        recommendations.push(
            `Get access to ${courseCounts.categoryB} premium Signature Courses!`
        )
    }

    if (hasA && hasB) {
        recommendations.push(
            'You have full access to our course library! Explore Creator Channels for personalized learning.'
        )
    }

    if (subscriptions.length === 0) {
        recommendations.push(
            'Start your learning journey today with a subscription plan that fits your goals!'
        )
    }

    return recommendations
}
