import { Prisma, PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
    prisma: ExtendedPrismaClient | undefined
}

const rawDatabaseUrl = process.env.DATABASE_URL

if (!rawDatabaseUrl) {
    throw new Error('DATABASE_URL is required')
}

/**
 * Neon (serverless Postgres) suspends idle computes and drops idle pooled
 * connections. Without explicit timeouts Prisma waits a very long time on a
 * dead socket before failing. Add sane defaults unless the URL already sets them.
 */
function withConnectionDefaults(url: string): string {
    if (!url.startsWith('postgres')) return url
    try {
        const parsed = new URL(url)
        const defaults: Record<string, string> = {
            connect_timeout: '15', // Neon cold starts can take a few seconds
            pool_timeout: '20',
            socket_timeout: '30', // fail fast on half-closed connections instead of hanging
        }
        for (const [key, value] of Object.entries(defaults)) {
            if (!parsed.searchParams.has(key)) parsed.searchParams.set(key, value)
        }
        return parsed.toString()
    } catch {
        return url
    }
}

// Connection-level failures that are safe to retry (the query never ran or the socket died)
const RETRYABLE_CODES = new Set(['P1001', 'P1002', 'P1008', 'P1017', 'P2024'])

function isRetryableError(error: unknown): boolean {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return RETRYABLE_CODES.has(error.code)
    }
    if (error instanceof Prisma.PrismaClientInitializationError) {
        return true
    }
    if (error instanceof Error) {
        return /Server has closed the connection|Can't reach database server|Connection terminated|ECONNRESET|socket/i.test(error.message)
    }
    return false
}

/**
 * Sensitive columns are never returned unless a query asks for them explicitly
 * (`select: { field: true }` or `omit: { field: false }`). Many routes use
 * `include: { user: true }` / `include: { creator: ... }`; without this, password
 * hashes and KYC/bank data would be serialized straight into API responses.
 */
export const SENSITIVE_CREATOR_FIELDS = {
    nationalId: true,
    nationalIdImage: true,
    selfieImage: true,
    addressProof: true,
    bankAccountIBAN: true,
    bankName: true,
    stripeConnectAccountId: true,
} as const

/** Pass as `omit` on admin/payout queries that legitimately need KYC/bank data. */
export const INCLUDE_SENSITIVE_CREATOR_FIELDS = {
    nationalId: false,
    nationalIdImage: false,
    selfieImage: false,
    addressProof: false,
    bankAccountIBAN: false,
    bankName: false,
    stripeConnectAccountId: false,
} as const
const createPrismaClient = () => {
    const client = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
        datasources: {
            db: {
                url: withConnectionDefaults(rawDatabaseUrl),
            },
        },
        omit: {
            user: { passwordHash: true },
            creator: SENSITIVE_CREATOR_FIELDS,
        },
    })

    return client.$extends({
        query: {
            async $allOperations({ model, operation, args, query }) {
                const isWrite = WRITE_OPERATIONS.has(operation)
                let result
                try {
                    result = await query(args)
                } catch (error) {
                    // Transparently retry once when a pooled connection was dropped by the server.
                    // Writes are only retried when the failure happened before the query was sent.
                    const retryable = isWrite ? isConnectPhaseError(error) : isRetryableError(error)
                    if (!retryable) throw error
                    await new Promise((resolve) => setTimeout(resolve, 150))
                    result = await query(args)
                }
                if (isWrite && model) invalidateCachedLists(model, args)
                return result
            },
        },
    })
}

const WRITE_OPERATIONS = new Set([
    'create', 'createMany', 'createManyAndReturn',
    'update', 'updateMany', 'updateManyAndReturn',
    'upsert', 'delete', 'deleteMany',
])

function isConnectPhaseError(error: unknown): boolean {
    if (error instanceof Prisma.PrismaClientInitializationError) return true
    if (error instanceof Prisma.PrismaClientKnownRequestError) return error.code === 'P1001' || error.code === 'P2024'
    return false
}

// Models whose writes make the cached public lists (see unstable_cache tags) stale
const FEED_MODELS = new Set(['ChannelPost', 'PostLike', 'PostComment', 'CreatorChannel'])
const CREATOR_MODELS = new Set(['Creator', 'CreatorChannel', 'CreatorAnalytics', 'Course', 'ChannelPost'])
const PUBLIC_PROFILE_FIELDS = ['name', 'arabicName', 'profileImage', 'bio']

// Updates that only bump counters (e.g. a post being viewed) don't change what lists show
const COUNTER_ONLY_FIELDS = new Set(['viewCount', 'totalViews', 'updatedAt'])

function invalidateCachedLists(model: string, args: unknown) {
    const data = (args as { data?: unknown } | undefined)?.data
    if (data && typeof data === 'object' && !Array.isArray(data)) {
        const keys = Object.keys(data)
        if (keys.length > 0 && keys.every((key) => COUNTER_ONLY_FIELDS.has(key))) return
    }

    const tags: string[] = []
    if (FEED_MODELS.has(model)) tags.push('feed')
    if (CREATOR_MODELS.has(model)) tags.push('creators')
    if (model === 'User') {
        // Only profile fields shown on cards matter (not e.g. last-seen timestamps)
        if (data && typeof data === 'object' && PUBLIC_PROFILE_FIELDS.some((field) => field in data)) {
            tags.push('feed', 'creators')
        }
    }
    if (tags.length === 0) return
    try {
        // Lazy require keeps this module usable outside of Next.js (scripts, seeds)
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { revalidateTag } = require('next/cache') as typeof import('next/cache')
        for (const tag of new Set(tags)) revalidateTag(tag)
    } catch {
        // Outside a request scope (or during render) - cached entries simply expire by TTL
    }
}

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
