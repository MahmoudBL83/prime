import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // Check remaining mock creators
    const mockCreators = await prisma.creator.findMany({
        where: {
            user: { email: { not: { endsWith: '@prime.edu' } } }
        },
        include: { user: { select: { name: true, email: true } } }
    })

    console.log(`\n📊 Mock creators remaining: ${mockCreators.length}`)
    if (mockCreators.length > 0) {
        for (const c of mockCreators) {
            console.log(`   - ${c.user.name} (${c.user.email})`)
        }
    }

    // Check real creators
    const realCreators = await prisma.creator.findMany({
        where: {
            user: { email: { endsWith: '@prime.edu' } }
        },
        include: { 
            user: { select: { name: true, email: true } },
            courses: { select: { id: true } },
            analytics: { select: { id: true } },
            earnings: { select: { id: true } },
        },
        orderBy: { totalSubscribers: 'desc' }
    })

    console.log(`\n✅ Real creators (@prime.edu): ${realCreators.length}`)
    for (const c of realCreators) {
        console.log(`   - ${c.user.name}: ${c.totalSubscribers} subs, ${c.courses.length} courses, ${c.analytics.length} analytics, ${c.earnings.length} earnings`)
    }
}

main().finally(() => prisma.$disconnect())
