import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🗑️ Removing old mock creators...\n')

    // Old mock creator emails to delete
    const mockEmails = [
        'sarah.creator@edtech.com',
        'mohamed.creator@edtech.com',
        'laila.creator@edtech.com',
        'omar.creator@edtech.com',
        'noor.creator@edtech.com',
        'ahmed.creator@edtech.com',
        'fatima.creator@edtech.com',
        'karim.creator@edtech.com',
        // Also check for any other mock patterns
        'instructor1@edtech.com',
        'instructor2@edtech.com',
        'mentor1@edtech.com',
        'mentor2@edtech.com',
    ]

    let deletedCount = 0

    for (const email of mockEmails) {
        try {
            const user = await prisma.user.findUnique({
                where: { email },
                include: { creator: true }
            })

            if (user) {
                console.log(`Found mock user: ${user.name} (${email})`)
                
                if (user.creator) {
                    // Delete related records first
                    await prisma.creatorAnalytics.deleteMany({ where: { creatorId: user.creator.id } })
                    await prisma.creatorEarnings.deleteMany({ where: { creatorId: user.creator.id } })
                    await prisma.course.deleteMany({ where: { creatorId: user.creator.id } })
                    await prisma.creatorChannel.deleteMany({ where: { creatorId: user.creator.id } })
                    await prisma.creator.delete({ where: { id: user.creator.id } })
                }
                
                await prisma.user.delete({ where: { id: user.id } })
                console.log(`  ✓ Deleted: ${user.name}`)
                deletedCount++
            }
        } catch (error: any) {
            // Silently continue if user not found
            if (!error.message?.includes('Record to delete does not exist')) {
                console.log(`  ⚠️ Could not delete ${email}: ${error.message}`)
            }
        }
    }

    // Also find and list any other creators NOT using @prime.edu
    const otherCreators = await prisma.creator.findMany({
        where: {
            user: {
                email: {
                    not: { endsWith: '@prime.edu' }
                }
            }
        },
        include: {
            user: { select: { name: true, email: true } }
        }
    })

    if (otherCreators.length > 0) {
        console.log('\n⚠️ Other creators found (not @prime.edu):')
        for (const c of otherCreators) {
            console.log(`   - ${c.user.name} (${c.user.email})`)
        }
    }

    console.log(`\n✅ Cleanup complete! Deleted ${deletedCount} mock creators.`)

    // Show final count
    const realCreators = await prisma.creator.count({
        where: {
            user: { email: { endsWith: '@prime.edu' } }
        }
    })
    const totalCreators = await prisma.creator.count()

    console.log(`\n📊 Database Summary:`)
    console.log(`   Total creators: ${totalCreators}`)
    console.log(`   Real creators (@prime.edu): ${realCreators}`)
    console.log(`   Other creators: ${totalCreators - realCreators}`)
}

main()
    .catch((e) => {
        console.error('❌ Cleanup failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
