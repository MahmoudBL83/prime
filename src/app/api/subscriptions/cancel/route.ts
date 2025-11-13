import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/subscriptions/cancel
 * 
 * Cancels a user's subscription. User retains access until end of billing period.
 * Enrollments are NOT deleted - user keeps their progress data.
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
        const { subscriptionId, cancellationReason, feedback } = body

        if (!subscriptionId) {
            return NextResponse.json(
                { error: 'Subscription ID is required' },
                { status: 400 }
            )
        }

        // Verify subscription belongs to user
        const subscription = await prisma.subscription.findFirst({
            where: {
                id: subscriptionId,
                userId: session.user.id
            }
        })

        if (!subscription) {
            return NextResponse.json(
                { error: 'Subscription not found' },
                { status: 404 }
            )
        }

        if (subscription.status === 'CANCELLED') {
            return NextResponse.json(
                { error: 'Subscription is already cancelled' },
                { status: 400 }
            )
        }

        // Update subscription to cancelled status
        const updatedSubscription = await prisma.subscription.update({
            where: { id: subscriptionId },
            data: {
                status: 'CANCELLED',
                cancelledAt: new Date(),
                // Store feedback for analytics
                // cancellationReason and feedback fields need to be added to schema
            }
        })

        // TODO: Cancel recurring payment with Stripe
        // if (updatedSubscription.subscriptionId) {
        //     await stripe.subscriptions.cancel(updatedSubscription.subscriptionId)
        // }

        return NextResponse.json({
            success: true,
            message: 'Subscription cancelled successfully. You will retain access until the end of your billing period.',
            subscription: {
                id: updatedSubscription.id,
                status: updatedSubscription.status,
                cancelledAt: updatedSubscription.cancelledAt,
                endDate: updatedSubscription.endDate
            }
        })

    } catch (error) {
        console.error('Subscription cancellation error:', error)
        return NextResponse.json(
            { error: 'Failed to cancel subscription' },
            { status: 500 }
        )
    }
}
