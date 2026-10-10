import { prisma } from '@/lib/prisma'

/**
 * Post visibility.
 *
 * Posts carry a free-form `tier` string written by different composers
 * ("BRONZE", "SUBSCRIBER", "BASIC", "ALL", "VIP", ...). Map them onto one scale:
 *   0  = free for everyone (BRONZE has always been the free/default tier)
 *   1+ = subscribers only (higher numbers need a higher subscription tier)
 * Unknown values are treated as subscriber-only so paid content never leaks.
 */
const POST_TIER_RANK: Record<string, number> = {
    PUBLIC: 0,
    FREE: 0,
    BRONZE: 0,
    ALL: 1,
    SUBSCRIBER: 1,
    BASIC: 1,
    SILVER: 2,
    PREMIUM: 2,
    GOLD: 3,
    VIP: 4,
}

/** Subscription tiers stored in subscription metadata. Single-plan subscriptions unlock everything. */
const SUBSCRIPTION_TIER_RANK: Record<string, number> = {
    BRONZE: 1,
    BASIC: 1,
    SILVER: 2,
    PREMIUM: 2,
    GOLD: 3,
    VIP: 4,
}
const FULL_ACCESS_RANK = 4

export const NO_SUBSCRIPTION = -1

export function requiredRankForPost(tier: string | null | undefined): number {
    if (!tier) return 0
    return POST_TIER_RANK[tier.toUpperCase()] ?? 1
}

function rankForSubscriptionTier(tier: unknown): number {
    if (typeof tier !== 'string' || !tier) return FULL_ACCESS_RANK
    return SUBSCRIPTION_TIER_RANK[tier.toUpperCase()] ?? FULL_ACCESS_RANK
}

export interface ViewerAccess {
    /** Highest subscription rank the viewer holds for this creator, or NO_SUBSCRIPTION */
    rankFor(creatorId: string, channelId?: string | null): number
    /** Tier name of the viewer's subscription to this creator, if any */
    tierFor(creatorId: string, channelId?: string | null): string | undefined
}

const EMPTY_ACCESS: ViewerAccess = {
    rankFor: () => NO_SUBSCRIPTION,
    tierFor: () => undefined,
}

/**
 * Load the viewer's active subscriptions once and answer access questions for
 * any creator. Mentor subscriptions store the creator (or channel) id in
 * `metadata.creatorId` and may have a null `channelId`, so both are checked.
 */
export async function getViewerAccess(userId: string | undefined | null): Promise<ViewerAccess> {
    if (!userId) return EMPTY_ACCESS

    const now = new Date()
    const subscriptions = await prisma.subscription.findMany({
        where: {
            userId,
            status: { in: ['ACTIVE', 'active'] },
            OR: [{ endDate: null }, { endDate: { gte: now } }],
        },
        select: { channelId: true, metadata: true },
    })
    if (subscriptions.length === 0) return EMPTY_ACCESS

    const byKey = new Map<string, { rank: number; tier?: string }>()
    const remember = (key: string | null | undefined, rank: number, tier?: string) => {
        if (!key) return
        const existing = byKey.get(key)
        if (!existing || existing.rank < rank) byKey.set(key, { rank, tier })
    }

    for (const subscription of subscriptions) {
        let metadata: { creatorId?: string; tier?: string } = {}
        if (subscription.metadata) {
            try {
                metadata = JSON.parse(subscription.metadata)
            } catch {
                metadata = {}
            }
        }
        const rank = rankForSubscriptionTier(metadata.tier)
        remember(metadata.creatorId, rank, metadata.tier)
        remember(subscription.channelId, rank, metadata.tier)
    }

    const lookup = (creatorId: string, channelId?: string | null) => {
        const a = byKey.get(creatorId)
        const b = channelId ? byKey.get(channelId) : undefined
        if (a && b) return a.rank >= b.rank ? a : b
        return a ?? b
    }

    return {
        rankFor: (creatorId, channelId) => lookup(creatorId, channelId)?.rank ?? NO_SUBSCRIPTION,
        tierFor: (creatorId, channelId) => lookup(creatorId, channelId)?.tier,
    }
}

export function canViewPost(postTier: string | null | undefined, viewerRank: number, isOwner = false): boolean {
    if (isOwner) return true
    const required = requiredRankForPost(postTier)
    return required === 0 || viewerRank >= required
}
