import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
    throw new Error('DATABASE_URL is required')
}

// Create Prisma Client with explicit configuration for serverless
const createPrismaClient = () => {
    return new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
        datasources: {
            db: {
                url: databaseUrl,
            },
        },
    })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
