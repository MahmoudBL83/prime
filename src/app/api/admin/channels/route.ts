import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma, SubscriptionStatus, UserRole } from '@prisma/client'
import type { Session } from 'next-auth'

interface BaseStats {
    totals: {
        totalChannels: number
        pendingApproval: number
        activeChannels: number
        suspended: number
    }
    totalRevenue: number
    avgSubscribers: number
    flaggedContent: number
    reportCounts: Array<{ targetId: string; count: number }>
}

const channelInclude = {
    creator: {
        include: {
            user: {
                select: { id: true, name: true, email: true, profileImage: true }
            }
        }
    },
    membershipTiers: {
        select: {
            id: true,
            name: true,
            price: true,
            currency: true,
            subscriberCount: true,
            isActive: true
        },
        orderBy: { price: 'asc' }
    },
    channelSubscriptions: {
        select: {
            id: true,
            status: true,
            priceAtPurchase: true,
            lastActivityAt: true
        }
    }
} satisfies Prisma.CreatorChannelInclude

type ChannelWithRelations = Prisma.CreatorChannelGetPayload<{ include: typeof channelInclude }>

function assertAdmin(session: Session | null): asserts session is Session {
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
        throw new Error('UNAUTHORIZED')
    }
}

function deriveChannelStatus(options: { kycStatus: string; activeSubscribers: number; reportCount: number }) {
    if (options.reportCount >= 5) return 'suspended'
    if (options.reportCount > 0) return 'issues'
    if (options.kycStatus !== 'VERIFIED' || options.activeSubscribers === 0) return 'pending'
    return 'active'
}

function buildWhere(search?: string | null, status?: string | null) {
    const andFilters: any[] = []

    if (search) {
        andFilters.push({
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { creator: { user: { name: { contains: search, mode: 'insensitive' } } } },
                { creator: { user: { email: { contains: search, mode: 'insensitive' } } } }
            ]
        })
    }

    if (status === 'pending') {
        andFilters.push({
            OR: [
                { totalSubscribers: { equals: 0 } },
                { creator: { kycStatus: { not: 'VERIFIED' } } }
            ]
        })
    } else if (status === 'active') {
        andFilters.push({
            totalSubscribers: { gt: 0 }
        })
        andFilters.push({
            creator: { kycStatus: 'VERIFIED' }
        })
    }

    if (!andFilters.length) return undefined
    if (andFilters.length === 1) return andFilters[0]
    return { AND: andFilters }
}

async function getBaseStats(): Promise<BaseStats> {
    const [totalChannels, pendingApproval, activeChannels, revenueAggregate, avgSubscribersAggregate, reportGroups] = await Promise.all([
        prisma.creatorChannel.count(),
        prisma.creatorChannel.count({
            where: {
                OR: [
                    { totalSubscribers: { equals: 0 } },
                    { creator: { kycStatus: { not: 'VERIFIED' } } }
                ]
            }
        }),
        prisma.creatorChannel.count({
            where: {
                totalSubscribers: { gt: 0 },
                creator: { kycStatus: 'VERIFIED' }
            }
        }),
        prisma.channelSubscription.aggregate({
            _sum: { priceAtPurchase: true }
        }),
        prisma.creatorChannel.aggregate({
            _avg: { totalSubscribers: true }
        }),
        prisma.report.groupBy({
            by: ['targetId'],
            _count: { _all: true },
            where: {
                type: {
                    in: ['CHANNEL', 'CHANNEL_POST', 'CHANNEL_CONTENT']
                }
            }
        })
    ])

    const flaggedContent = reportGroups.reduce((sum, group) => sum + group._count._all, 0)
    const suspendedIds = reportGroups.filter(group => group._count._all >= 5).map(group => group.targetId)

    return {
        totals: {
            totalChannels,
            pendingApproval,
            activeChannels,
            suspended: suspendedIds.length
        },
        totalRevenue: revenueAggregate._sum.priceAtPurchase ?? 0,
        avgSubscribers: avgSubscribersAggregate._avg.totalSubscribers ?? 0,
        flaggedContent,
        reportCounts: reportGroups.map(group => ({ targetId: group.targetId, count: group._count._all }))
    }
}

function mapChannel(channel: ChannelWithRelations, reportMap: Record<string, number>) {
    const activeSubscribers = channel.channelSubscriptions.filter(sub => sub.status === SubscriptionStatus.ACTIVE).length
    const revenue = channel.channelSubscriptions.reduce((sum, sub) => sum + sub.priceAtPurchase, 0)
    const reportCount = reportMap[channel.id] ?? 0
    const status = deriveChannelStatus({
        kycStatus: channel.creator.kycStatus,
        activeSubscribers,
        reportCount
    })

    const activeTiers = channel.membershipTiers.filter(tier => tier.isActive)
    const primaryTier = activeTiers.length
        ? activeTiers[0]
        : channel.membershipTiers[0]
    const minTier = primaryTier ? primaryTier.price : null

    return {
        id: channel.id,
        name: channel.name,
        status,
        creator: {
            id: channel.creator.id,
            name: channel.creator.user?.name ?? 'Creator',
            email: channel.creator.user?.email ?? '',
            avatar: channel.creator.user?.profileImage || (channel.creator.user?.name ? channel.creator.user.name.slice(0, 2).toUpperCase() : 'PR'),
            verified: channel.creator.kycStatus === 'VERIFIED'
        },
        subscribers: activeSubscribers,
        revenue,
        pricing: {
            monthly: minTier,
            annual: minTier ? Number((minTier * 12 * 0.85).toFixed(2)) : null
        },
        tiers: primaryTier
            ? [{
                id: primaryTier.id,
                name: primaryTier.name,
                price: primaryTier.price,
                currency: primaryTier.currency,
                subscriberCount: primaryTier.subscriberCount
            }]
            : [],
        compliance: {
            policyViolations: reportCount,
            contentFlags: reportCount,
            dmcaNotices: 0
        },
        contentCount: {
            videos: 0,
            documents: 0,
            discussions: 0
        },
        createdAt: channel.createdAt.toISOString(),
        lastActivity: channel.channelSubscriptions.reduce<Date | null>((latest, sub) => {
            if (!sub.lastActivityAt) return latest
            if (!latest) return sub.lastActivityAt
            return sub.lastActivityAt > latest ? sub.lastActivityAt : latest
        }, null)?.toISOString() ?? channel.updatedAt.toISOString()
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        assertAdmin(session)

        const searchParams = request.nextUrl.searchParams
        const status = searchParams.get('status')
        const search = searchParams.get('search')
        const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1)
        const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '20', 10), 1), 100)

        const where = buildWhere(search, ['pending', 'active'].includes(status ?? '') ? status : undefined)

        const baseStatsPromise = getBaseStats()
        const [count, channels] = await Promise.all([
            prisma.creatorChannel.count({ where }),
            prisma.creatorChannel.findMany({
                where,
                include: channelInclude,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize
            })
        ])

        const baseStats = await baseStatsPromise
        const reportMap = baseStats.reportCounts.reduce<Record<string, number>>((acc, item) => {
            acc[item.targetId] = item.count
            return acc
        }, {})

        let mapped = channels.map(channel => mapChannel(channel, reportMap))

        if (status === 'issues') {
            mapped = mapped.filter(channel => channel.compliance.policyViolations > 0 && channel.status !== 'suspended')
        } else if (status === 'suspended') {
            mapped = mapped.filter(channel => channel.status === 'suspended')
        }

        return NextResponse.json({
            channels: mapped,
            meta: {
                total: status === 'issues' || status === 'suspended' ? mapped.length : count,
                page,
                pageSize
            },
            stats: {
                totalChannels: baseStats.totals.totalChannels,
                pendingApproval: baseStats.totals.pendingApproval,
                activeChannels: baseStats.totals.activeChannels,
                suspended: baseStats.totals.suspended,
                totalRevenue: Number(baseStats.totalRevenue.toFixed(2)),
                avgSubscribers: Number(baseStats.avgSubscribers.toFixed(1)),
                flaggedContent: baseStats.flaggedContent
            }
        })
    } catch (error) {
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        console.error('Admin channels API error:', error)
        return NextResponse.json({ error: 'Failed to load channels' }, { status: 500 })
    }
}
