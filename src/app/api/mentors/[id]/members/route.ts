import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch all members/subscribers for a mentor's channel
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify the user is the mentor/creator
        const creator = await prisma.creator.findUnique({
            where: { id },
            include: {
                channels: { select: { id: true }, take: 1 }
            }
        })

        if (!creator) {
            return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
        }

        if (creator.userId !== session.user.id) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
        }

        const channelId = creator.channels[0]?.id

        if (!channelId) {
            return NextResponse.json({ 
                members: [],
                total: 0,
                stats: { total: 0, active: 0, warned: 0, muted: 0, banned: 0, vip: 0, premium: 0, basic: 0 }
            })
        }

        // Get all subscribers from ChannelSubscription
        const subscriptions = await prisma.channelSubscription.findMany({
            where: {
                channelId,
                status: { in: ['ACTIVE', 'PAUSED'] }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        arabicName: true,
                        email: true,
                        profileImage: true
                    }
                },
                tier: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        // Check for any bans/warnings
        const userBans = await prisma.userBan.findMany({
            where: {
                bannedBy: creator.userId,
                status: 'ACTIVE'
            },
            select: {
                userId: true,
                banType: true,
                status: true,
                expiresAt: true
            }
        })

        const banMap = new Map(userBans.map(b => [b.userId, b]))

        const members = subscriptions.map(sub => {
            const ban = banMap.get(sub.userId)
            let status = 'active'
            if (ban) {
                if (ban.banType === 'WARNING') status = 'warned'
                else if (ban.banType === 'TEMPORARY') status = 'muted'
                else if (ban.banType === 'PERMANENT' || ban.banType === 'SHADOW') status = 'banned'
            }

            return {
                id: sub.user.id,
                subscriptionId: sub.id,
                name: sub.user.name,
                arabicName: sub.user.arabicName,
                email: sub.user.email,
                profileImage: sub.user.profileImage,
                tier: sub.tier?.name || 'SUBSCRIBER',
                joinedAt: sub.startedAt.toISOString(),
                joinDate: sub.startedAt.toISOString(),
                status,
                totalMessages: sub.totalMessages,
                totalDownloads: sub.totalDownloads,
                lastActivityAt: sub.lastActivityAt.toISOString(),
                banExpiresAt: ban?.expiresAt?.toISOString() || null
            }
        })

        return NextResponse.json({ 
            members,
            total: members.length,
            stats: {
                total: members.length,
                active: members.filter(m => m.status === 'active').length,
                warned: members.filter(m => m.status === 'warned').length,
                muted: members.filter(m => m.status === 'muted').length,
                banned: members.filter(m => m.status === 'banned').length,
                vip: members.filter(m => m.tier?.toLowerCase() === 'vip' || m.tier?.toLowerCase() === 'gold').length,
                premium: members.filter(m => m.tier?.toLowerCase() === 'premium' || m.tier?.toLowerCase() === 'silver').length,
                basic: members.filter(m => m.tier?.toLowerCase() === 'basic' || m.tier?.toLowerCase() === 'bronze' || m.tier?.toLowerCase() === 'subscriber').length
            }
        })
    } catch (error) {
        console.error('Error fetching members:', error)
        return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
    }
}

// POST - Perform actions on a member (warn, mute, remove)
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { memberId, action, reason, duration } = body

        if (!memberId || !action) {
            return NextResponse.json({ error: 'Member ID and action are required' }, { status: 400 })
        }

        // Verify the user is the mentor/creator
        const creator = await prisma.creator.findUnique({
            where: { id },
            include: {
                channels: { select: { id: true }, take: 1 }
            }
        })

        if (!creator) {
            return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
        }

        if (creator.userId !== session.user.id) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
        }

        const channelId = creator.channels[0]?.id

        // Verify the member is actually subscribed
        const subscription = await prisma.channelSubscription.findFirst({
            where: {
                userId: memberId,
                channelId
            }
        })

        if (!subscription) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 })
        }

        // Handle different actions
        switch (action) {
            case 'warn': {
                // Create a warning
                const existingWarning = await prisma.userBan.findFirst({
                    where: {
                        userId: memberId,
                        bannedBy: creator.userId,
                        banType: 'WARNING',
                        status: 'ACTIVE'
                    }
                })

                if (existingWarning) {
                    // Remove warning
                    await prisma.userBan.update({
                        where: { id: existingWarning.id },
                        data: { status: 'LIFTED', liftedAt: new Date(), liftedBy: session.user.id }
                    })
                    return NextResponse.json({ 
                        success: true, 
                        message: 'Warning removed',
                        newStatus: 'active'
                    })
                } else {
                    // Add warning
                    await prisma.userBan.create({
                        data: {
                            userId: memberId,
                            bannedBy: creator.userId,
                            banType: 'WARNING',
                            reason: reason || 'Community guidelines violation',
                            status: 'ACTIVE',
                            evidence: []
                        }
                    })
                    return NextResponse.json({ 
                        success: true, 
                        message: 'Warning issued',
                        newStatus: 'warned'
                    })
                }
            }

            case 'mute': {
                // Mute for duration (default 24 hours)
                const muteDuration = duration || 24 // hours
                const expiresAt = new Date(Date.now() + muteDuration * 60 * 60 * 1000)

                // Check if already muted
                const existingMute = await prisma.userBan.findFirst({
                    where: {
                        userId: memberId,
                        bannedBy: creator.userId,
                        banType: 'TEMPORARY',
                        status: 'ACTIVE'
                    }
                })

                if (existingMute) {
                    // Unmute
                    await prisma.userBan.update({
                        where: { id: existingMute.id },
                        data: { status: 'LIFTED', liftedAt: new Date(), liftedBy: session.user.id }
                    })
                    return NextResponse.json({ 
                        success: true, 
                        message: 'Member unmuted',
                        newStatus: 'active'
                    })
                } else {
                    // Mute
                    await prisma.userBan.create({
                        data: {
                            userId: memberId,
                            bannedBy: creator.userId,
                            banType: 'TEMPORARY',
                            duration: 'ONE_DAY',
                            reason: reason || 'Muted by creator',
                            status: 'ACTIVE',
                            expiresAt,
                            evidence: []
                        }
                    })
                    return NextResponse.json({ 
                        success: true, 
                        message: `Member muted for ${muteDuration} hours`,
                        newStatus: 'muted',
                        expiresAt: expiresAt.toISOString()
                    })
                }
            }

            case 'remove': {
                // Cancel the subscription
                await prisma.channelSubscription.update({
                    where: { id: subscription.id },
                    data: {
                        status: 'CANCELLED',
                        cancelledAt: new Date()
                    }
                })

                // Ban them from resubscribing
                await prisma.userBan.create({
                    data: {
                        userId: memberId,
                        bannedBy: creator.userId,
                        banType: 'PERMANENT',
                        reason: reason || 'Removed by creator',
                        status: 'ACTIVE',
                        evidence: []
                    }
                })

                return NextResponse.json({ 
                    success: true, 
                    message: 'Member removed from community',
                    newStatus: 'removed'
                })
            }

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }
    } catch (error) {
        console.error('Error performing member action:', error)
        return NextResponse.json({ error: 'Failed to perform action' }, { status: 500 })
    }
}
