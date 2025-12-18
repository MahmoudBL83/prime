import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // Verify admin authentication
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        // Get current user from database
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!currentUser || currentUser.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            )
        }

        // Fetch user's subscriptions
        const subscriptions = await prisma.subscription.findMany({
            where: { userId: id },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
                channel: {
                    select: {
                        name: true
                    }
                }
            }
        })

        // Fetch user's support tickets
        const tickets = await prisma.supportTicket.findMany({
            where: { userId: id },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
                id: true,
                subject: true,
                status: true,
                priority: true,
                category: true,
                createdAt: true
            }
        })

        // Fetch recent activity - payment transactions as activity proxy
        const transactions = await prisma.paymentTransaction.findMany({
            where: { userId: id },
            orderBy: { createdAt: 'desc' },
            take: 20,
            select: {
                id: true,
                amount: true,
                currency: true,
                status: true,
                paymentMethod: true,
                createdAt: true,
                paidAt: true
            }
        })

        // Map subscriptions to frontend format
        const formattedSubscriptions = subscriptions.map(sub => ({
            id: sub.id,
            plan: sub.type.toLowerCase() as 'all-access' | 'signature' | 'channel',
            status: mapSubscriptionStatus(sub.status),
            startDate: sub.startDate.toISOString(),
            renewalDate: sub.endDate?.toISOString() || sub.startDate.toISOString(),
            price: sub.pricePerMonth,
            autoRenew: sub.autoRenew,
            channelName: sub.channel?.name
        }))

        // Map tickets to frontend format
        const formattedTickets = tickets.map(ticket => ({
            id: ticket.id,
            ticketNumber: `TKT-${ticket.id.slice(-6).toUpperCase()}`,
            subject: ticket.subject,
            status: ticket.status.toLowerCase() as 'open' | 'in_progress' | 'resolved' | 'closed',
            priority: ticket.priority.toLowerCase() as 'low' | 'medium' | 'high' | 'urgent',
            createdAt: ticket.createdAt.toISOString()
        }))

        // Create activity logs from transactions
        const activityLogs = transactions.map(tx => ({
            id: tx.id,
            action: `Payment ${tx.status.toLowerCase()}`,
            details: `${tx.currency} ${tx.amount} via ${tx.paymentMethod || 'Unknown'}`,
            timestamp: (tx.paidAt || tx.createdAt).toISOString(),
            ipAddress: undefined
        }))

        // Risk flags - check for failed payments or chargebacks
        const riskFlags = await generateRiskFlags(id)

        return NextResponse.json({
            subscriptions: formattedSubscriptions,
            tickets: formattedTickets,
            riskFlags,
            activityLogs
        })

    } catch (error) {
        console.error('Admin user details API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

function mapSubscriptionStatus(status: string): 'active' | 'cancelled' | 'expired' | 'suspended' {
    const statusLower = status.toLowerCase()
    if (statusLower === 'active') return 'active'
    if (statusLower === 'cancelled' || statusLower === 'canceled') return 'cancelled'
    if (statusLower === 'expired') return 'expired'
    if (statusLower === 'suspended' || statusLower === 'paused') return 'suspended'
    return 'expired' // default
}

async function generateRiskFlags(userId: string) {
    const riskFlags: {
        id: string
        type: 'chargeback' | 'payment_dispute' | 'abuse_report' | 'suspicious_activity' | 'multiple_accounts'
        severity: 'low' | 'medium' | 'high' | 'critical'
        description: string
        createdAt: string
        status: 'open' | 'investigating' | 'resolved' | 'dismissed'
    }[] = []

    // Check for failed payments
    const failedPayments = await prisma.paymentTransaction.count({
        where: {
            userId,
            status: 'FAILED'
        }
    })

    if (failedPayments >= 3) {
        riskFlags.push({
            id: `risk-failed-${userId}`,
            type: 'payment_dispute',
            severity: failedPayments >= 5 ? 'high' : 'medium',
            description: `User has ${failedPayments} failed payment attempts`,
            createdAt: new Date().toISOString(),
            status: 'open'
        })
    }

    // Check for multiple cancelled subscriptions
    const cancelledSubs = await prisma.subscription.count({
        where: {
            userId,
            status: { contains: 'cancelled' }
        }
    })

    if (cancelledSubs >= 2) {
        riskFlags.push({
            id: `risk-cancelled-${userId}`,
            type: 'chargeback',
            severity: cancelledSubs >= 4 ? 'high' : 'low',
            description: `User has cancelled ${cancelledSubs} subscriptions`,
            createdAt: new Date().toISOString(),
            status: 'open'
        })
    }

    // Check if user is blocked by multiple people (abuse indicator)
    const blockedByCount = await prisma.userBlock.count({
        where: { blockedId: userId }
    })

    if (blockedByCount >= 2) {
        riskFlags.push({
            id: `risk-blocked-${userId}`,
            type: 'abuse_report',
            severity: blockedByCount >= 5 ? 'critical' : blockedByCount >= 3 ? 'high' : 'medium',
            description: `User has been blocked by ${blockedByCount} other users`,
            createdAt: new Date().toISOString(),
            status: 'investigating'
        })
    }

    return riskFlags
}
