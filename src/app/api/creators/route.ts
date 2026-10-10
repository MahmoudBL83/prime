import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

const creatorInclude = {
    user: {
        select: {
            id: true,
            name: true,
            arabicName: true,
            profileImage: true,
            bio: true,
        },
    },
    channels: {
        select: {
            id: true,
            name: true,
            nameAr: true,
            description: true,
            coverImage: true,
        },
    },
    _count: {
        select: {
            courses: true,
        },
    },
    analytics: {
        orderBy: { createdAt: 'desc' as const },
        take: 1,
        select: { totalViews: true },
    },
}

type CreatorRow = NonNullable<Awaited<ReturnType<typeof findCreatorRows>>>[number]

function findCreatorRows(args: { where: any; orderBy: any; skip: number; take: number }) {
    return prisma.creator.findMany({ ...args, include: creatorInclude })
}

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Turn creator rows into the card payload used by the mentors UI.
 * Ratings and post stats are aggregated in two batched queries instead of
 * three queries per creator.
 */
async function buildCreatorCards(rows: CreatorRow[]) {
    const creators = rows.filter((creator) => creator.user !== null)
    if (creators.length === 0) return []

    const now = new Date()
    const creatorIds = creators.map((c) => c.id)
    const channelToCreator = new Map<string, string>()
    for (const creator of creators) {
        for (const channel of creator.channels) channelToCreator.set(channel.id, creator.id)
    }

    const [ratingRows, postRows] = await Promise.all([
        prisma.course.groupBy({
            by: ['creatorId'],
            where: { creatorId: { in: creatorIds } },
            _avg: { rating: true },
        }),
        channelToCreator.size > 0
            ? prisma.channelPost.groupBy({
                by: ['channelId'],
                where: { channelId: { in: [...channelToCreator.keys()] }, publishedAt: { lte: now } },
                _count: { _all: true },
                _max: { publishedAt: true },
            })
            : Promise.resolve([] as Array<{ channelId: string; _count: { _all: number }; _max: { publishedAt: Date | null } }>),
    ])

    const ratingByCreator = new Map(ratingRows.map((row) => [row.creatorId, row._avg.rating ?? 0]))
    const postsByCreator = new Map<string, { count: number; latest: Date | null }>()
    for (const row of postRows) {
        const creatorId = channelToCreator.get(row.channelId)
        if (!creatorId) continue
        const entry = postsByCreator.get(creatorId) ?? { count: 0, latest: null }
        entry.count += row._count._all
        const latest = row._max.publishedAt
        if (latest && (!entry.latest || latest > entry.latest)) entry.latest = latest
        postsByCreator.set(creatorId, entry)
    }

    return creators.map((creator) => {
        const posts = postsByCreator.get(creator.id)
        const hasNewContent = posts?.latest ? now.getTime() - posts.latest.getTime() <= 14 * DAY_MS : false
        const yearsOfExperience = Math.max(1, Math.floor((now.getTime() - new Date(creator.createdAt).getTime()) / (365 * DAY_MS)))

        return {
            id: creator.id,
            userId: creator.userId,
            // Prefer a real channel id if present for navigation
            channelId: creator.channels?.[0]?.id || creator.id,
            user: {
                id: creator.user.id,
                name: creator.user.name,
                arabicName: creator.user.arabicName,
                profileImage: creator.user.profileImage,
                bio: creator.user.bio || '',
            },
            channels: creator.channels,
            expertise: creator.expertise || '',
            monthlyPrice: creator.monthlyPrice || creator.basicMonthlyPrice || 0, // real price from DB, no fake fallbacks
            currency: 'EUR',
            totalSubscribers: creator.totalSubscribers || 0,
            stats: {
                averageRating: ratingByCreator.get(creator.id) ?? 0,
                totalPosts: posts?.count ?? 0,
                yearsOfExperience,
                totalViews: creator.analytics[0]?.totalViews || 0,
            },
            isOnline: false,
            hasNewContent,
            subscriptionBenefits: creator.subscriptionBenefits || null,
            socialLinks: creator.socialLinks || null,
            verified: creator.kycStatus === 'VERIFIED',
            createdAt: creator.createdAt,
        }
    })
}

type CreatorCard = Awaited<ReturnType<typeof buildCreatorCards>>[number]

function buildOrderBy(filter: string) {
    if (filter === 'trending') return [{ totalSubscribers: 'desc' as const }, { totalEarnings: 'desc' as const }]
    if (filter === 'new') return [{ createdAt: 'desc' as const }]
    if (filter === 'top') return [{ totalEarnings: 'desc' as const }, { totalSubscribers: 'desc' as const }]
    return [{ totalSubscribers: 'desc' as const }, { createdAt: 'desc' as const }]
}

/** Public (verified) creators list - identical for every visitor, so it is cached. */
const getPublicCreators = unstable_cache(
    async (page: number, limit: number, search: string, filter: string) => {
        const where: any = { kycStatus: 'VERIFIED' }
        if (search) {
            where.OR = [
                { user: { name: { contains: search, mode: 'insensitive' } } },
                { user: { arabicName: { contains: search, mode: 'insensitive' } } },
                { expertise: { contains: search, mode: 'insensitive' } },
            ]
        }

        const [rows, total] = await Promise.all([
            findCreatorRows({ where, orderBy: buildOrderBy(filter), skip: (page - 1) * limit, take: limit }),
            prisma.creator.count({ where }),
        ])

        return { creators: await buildCreatorCards(rows), total }
    },
    ['public-creators-v2'],
    { revalidate: 60, tags: ['creators'] }
)

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50') || 50))
        const search = (searchParams.get('search') || '').trim()
        const filter = searchParams.get('filter') || 'all' // all, trending, new, top

        const session = await getServerSession(authOptions)

        // The signed-in user's own creator profile is shown even before verification
        const [publicList, ownRows] = await Promise.all([
            getPublicCreators(page, limit, search, filter),
            session?.user?.id
                ? findCreatorRows({ where: { userId: session.user.id }, orderBy: undefined, skip: 0, take: 1 })
                : Promise.resolve([] as CreatorRow[]),
        ])

        let creators: CreatorCard[] = publicList.creators
        const ownRow = ownRows[0]
        if (ownRow && ownRow.user && !creators.some((c) => c.id === ownRow.id)) {
            const [ownCard] = await buildCreatorCards([ownRow])
            if (ownCard) creators = [ownCard, ...creators]
        }

        return NextResponse.json({
            creators,
            pagination: {
                page,
                limit,
                total: publicList.total,
                pages: Math.ceil(publicList.total / limit),
            },
        })
    } catch (error) {
        console.error('Creators fetch error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch creators' },
            { status: 500 }
        )
    }
}
