import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

// Use a dummy DATABASE_URL during build time if not provided
// This prevents build-time errors on Vercel
const databaseUrl = process.env.DATABASE_URL || 'file:./dummy.db'

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
        // Optimize connection pool for serverless
        datasources: {
            db: {
                url: databaseUrl,
            },
        },
    })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Handle serverless connection cleanup
if (process.env.VERCEL) {
    // Vercel serverless environment - add connection lifecycle management
    process.on('beforeExit', async () => {
        await prisma.$disconnect()
    })
}

export default prisma
