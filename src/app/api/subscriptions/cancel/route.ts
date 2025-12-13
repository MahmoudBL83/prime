import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/config/stripe'
import { sendEmail } from '@/lib/email'

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
            },
            include: {
                user: true,
                channel: {
                    include: {
                        creator: {
                            include: { user: true }
                        }
                    }
                }
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

        // Cancel with Stripe if there's a Stripe subscription ID
        let stripeCancelled = false
        if (subscription.stripeSubscriptionId) {
            try {
                const stripe = await getStripe()
                // Cancel at period end so user retains access until billing cycle ends
                await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
                    cancel_at_period_end: true,
                    metadata: {
                        cancellationReason: cancellationReason || 'User requested',
                        feedback: feedback || ''
                    }
                })
                stripeCancelled = true
                console.log(`Stripe subscription ${subscription.stripeSubscriptionId} set to cancel at period end`)
            } catch (stripeError: any) {
                console.error('Stripe cancellation error:', stripeError.message)
                // Continue with local cancellation even if Stripe fails
                // This ensures the user can still cancel
            }
        }

        // Update subscription to cancelled status
        const updatedSubscription = await prisma.subscription.update({
            where: { id: subscriptionId },
            data: {
                status: 'CANCELLED',
                cancelledAt: new Date(),
                autoRenew: false,
                // Store feedback in metadata
                metadata: JSON.stringify({
                    ...(subscription.metadata ? JSON.parse(subscription.metadata) : {}),
                    cancellationReason,
                    feedback,
                    stripeCancelled
                })
            }
        })

        // Send cancellation confirmation email
        try {
            const userName = subscription.user?.name || 'there'
            const channelName = subscription.channel?.name || 'the channel'
            const endDate = subscription.endDate 
                ? new Date(subscription.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                : 'end of billing period'
            
            await sendEmail({
                to: subscription.user?.email || session.user.email || '',
                subject: 'Subscription Cancellation Confirmation',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); padding: 30px; text-align: center;">
                            <h1 style="color: white; margin: 0;">Subscription Cancelled</h1>
                        </div>
                        <div style="padding: 30px; background: #ffffff;">
                            <p>Hi ${userName},</p>
                            <p>Your subscription to <strong>${channelName}</strong> has been cancelled.</p>
                            <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0;">
                                <p style="margin: 0;"><strong>You will retain access until ${endDate}</strong></p>
                                <p style="margin: 10px 0 0 0; font-size: 14px; color: #6B7280;">After this date, you'll lose access to exclusive content.</p>
                            </div>
                            <p>We're sorry to see you go! If you change your mind, you can resubscribe anytime.</p>
                            <p style="color: #6B7280; font-size: 14px;">Thank you for being part of our community.</p>
                        </div>
                    </div>
                `
            })
        } catch (emailError) {
            console.error('Failed to send cancellation email:', emailError)
            // Don't fail the cancellation if email fails
        }

        return NextResponse.json({
            success: true,
            message: 'Subscription cancelled successfully. You will retain access until the end of your billing period.',
            subscription: {
                id: updatedSubscription.id,
                status: updatedSubscription.status,
                cancelledAt: updatedSubscription.cancelledAt,
                endDate: updatedSubscription.endDate,
                stripeCancelled
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
