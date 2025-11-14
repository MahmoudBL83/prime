import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSubscriptionPrice, MONTHLY_PRICES } from '@/config/pricing'

/**
 * POST /api/subscriptions/subscribe
 * 
 * Creates a new subscription and auto-enrolls user based on subscription type:
 * - CATEGORY_A: Enroll in ALL Category A courses (All-Access Library)
 * - CATEGORY_B: Enroll in ALL Category B courses (Signature Courses)
 * - CATEGORY_C: Enroll in specific creator's channel content
 * - BUNDLE_AB: Enroll in both Category A and B courses
 * - BUNDLE_ABC: Enroll in everything
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await req.json()
        const { 
            type,           // CATEGORY_A | CATEGORY_B | CATEGORY_C | BUNDLE_AB | BUNDLE_ABC
            channelId,      // Optional for CATEGORY_C (if channel exists)
            creatorId,      // Alternative to channelId for CATEGORY_C
            tier,           // Required for CATEGORY_C (Basic, Premium, VIP)
            price,          // Optional override price
            billingCycle,   // 'monthly' | 'yearly'
            paymentMethodId // Stripe payment method ID
        } = body

        // Validate required fields
        if (!type || !billingCycle) {
            return NextResponse.json(
                { error: 'Missing required fields: type, billingCycle' },
                { status: 400 }
            )
        }

        // Validate Category C specific fields
        if (type === 'CATEGORY_C' && !tier) {
            return NextResponse.json(
                { error: 'tier is required for CATEGORY_C subscription' },
                { status: 400 }
            )
        }

        // Check for existing active subscription of same type
        // For CATEGORY_C, we need to check by creator, not just type
        // since channelId is now null, we can't use it for comparison
        // Instead, we'll allow multiple CATEGORY_C subscriptions (one per creator)
        // and rely on enrollment deduplication
        
        if (type !== 'CATEGORY_C') {
            // For other subscription types, prevent duplicates
            const existingSubscription = await prisma.subscription.findFirst({
                where: {
                    userId: session.user.id,
                    type,
                    status: 'ACTIVE'
                }
            })

            if (existingSubscription) {
                return NextResponse.json(
                    { error: 'You already have an active subscription of this type' },
                    { status: 400 }
                )
            }
        }
        
        // For CATEGORY_C, we allow multiple subscriptions to different creators
        // The enrollment system will handle duplicate course enrollments

        // Calculate pricing based on type and billing cycle
        const pricing = price ? { pricePerMonth: price } : calculateSubscriptionPrice(type, billingCycle, tier)

        // Create subscription and auto-enroll in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create the subscription (without channelId to avoid foreign key constraint)
            // For CATEGORY_C subscriptions, store the creatorId in metadata
            const metadata: any = {}
            if (type === 'CATEGORY_C' && (channelId || creatorId)) {
                metadata.creatorId = channelId || creatorId
                metadata.tier = tier
            }

            const subscription = await tx.subscription.create({
                data: {
                    userId: session.user.id,
                    type,
                    channelId: null, // Set to null to avoid foreign key constraint until channels are created
                    pricePerMonth: pricing.pricePerMonth,
                    status: 'ACTIVE',
                    startDate: new Date(),
                    endDate: billingCycle === 'yearly' 
                        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    paymentMethodId,
                    // Will be populated after Stripe integration
                    subscriptionId: null,
                    // Store creator info in metadata as JSON string for CATEGORY_C
                    metadata: Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : null
                }
            })

            // 2. Auto-enroll based on subscription type
            const enrollments = await autoEnrollUser(
                tx,
                session.user.id,
                type,
                channelId || creatorId // Use creatorId if channelId is not provided
            )

            return {
                subscription,
                enrollments,
                enrollmentCount: enrollments.length
            }
        })

        return NextResponse.json({
            success: true,
            message: `Successfully subscribed! You now have access to ${result.enrollmentCount} courses.`,
            subscription: {
                id: result.subscription.id,
                type: result.subscription.type,
                status: result.subscription.status,
                startDate: result.subscription.startDate,
                endDate: result.subscription.endDate,
                pricePerMonth: result.subscription.pricePerMonth
            },
            enrollmentCount: result.enrollmentCount
        })

    } catch (error) {
        console.error('Subscription error:', error)
        return NextResponse.json(
            { error: 'Failed to create subscription' },
            { status: 500 }
        )
    }
}

/**
 * Calculate subscription pricing based on type and billing cycle
 */
function calculateSubscriptionPrice(
    type: string, 
    billingCycle: string,
    tier?: string
): { pricePerMonth: number } {
    // Use centralized pricing configuration
    let basePrice = MONTHLY_PRICES[type as keyof typeof MONTHLY_PRICES] || MONTHLY_PRICES.CATEGORY_A

    // Category C tier pricing
    const tierMultipliers: Record<string, number> = {
        'Basic': 1.0,
        'Premium': 1.5,
        'VIP': 2.0
    }

    // Apply tier multiplier for Category C
    if (type === 'CATEGORY_C' && tier) {
        basePrice *= (tierMultipliers[tier] || 1.0)
    }

    // Apply yearly discount (20% off)
    if (billingCycle === 'yearly') {
        basePrice *= 0.8
    }

    return {
        pricePerMonth: Math.round(basePrice)
    }
}

/**
 * Auto-enroll user in courses based on subscription type
 */
async function autoEnrollUser(
    tx: any,
    userId: string,
    subscriptionType: string,
    channelId?: string
): Promise<any[]> {
    let coursesToEnroll: any[] = []

    switch (subscriptionType) {
        case 'CATEGORY_A':
            // Enroll in ALL Category A courses
            coursesToEnroll = await tx.course.findMany({
                where: {
                    contentCategory: 'CATEGORY_A',
                    status: 'PUBLISHED'
                },
                select: { id: true }
            })
            break

        case 'CATEGORY_B':
            // Enroll in ALL Category B courses
            coursesToEnroll = await tx.course.findMany({
                where: {
                    contentCategory: 'CATEGORY_B',
                    status: 'PUBLISHED'
                },
                select: { id: true }
            })
            break

        case 'CATEGORY_C':
            // Enroll in specific creator's courses
            if (!channelId) break
            
            // Try to find channel first
            const channel = await tx.creatorChannel.findUnique({
                where: { id: channelId },
                include: { creator: true }
            }).catch(() => null)

            if (channel) {
                // If channel exists, use its creatorId
                coursesToEnroll = await tx.course.findMany({
                    where: {
                        creatorId: channel.creatorId,
                        contentCategory: 'CATEGORY_C',
                        status: 'PUBLISHED'
                    },
                    select: { id: true }
                })
            } else {
                // If no channel, assume channelId is actually creatorId (instructor ID)
                // Enroll in courses created by this instructor
                coursesToEnroll = await tx.course.findMany({
                    where: {
                        OR: [
                            { instructorId: channelId },
                            { creatorId: channelId }
                        ],
                        status: 'PUBLISHED'
                    },
                    select: { id: true }
                }).catch(() => [])
            }
            break

        case 'BUNDLE_AB':
            // Enroll in Category A + B courses
            coursesToEnroll = await tx.course.findMany({
                where: {
                    contentCategory: {
                        in: ['CATEGORY_A', 'CATEGORY_B']
                    },
                    status: 'PUBLISHED'
                },
                select: { id: true }
            })
            break

        case 'BUNDLE_ABC':
            // Enroll in ALL courses
            coursesToEnroll = await tx.course.findMany({
                where: {
                    status: 'PUBLISHED'
                },
                select: { id: true }
            })
            break

        default:
            console.warn(`Unknown subscription type: ${subscriptionType}`)
    }

    // Create enrollments (upsert to avoid duplicates)
    const enrollments = await Promise.all(
        coursesToEnroll.map(course =>
            tx.enrollment.upsert({
                where: {
                    userId_courseId: {
                        userId,
                        courseId: course.id
                    }
                },
                create: {
                    userId,
                    courseId: course.id,
                    progress: 0,
                    lastAccessedAt: new Date()
                },
                update: {
                    lastAccessedAt: new Date()
                }
            })
        )
    )

    return enrollments
}
