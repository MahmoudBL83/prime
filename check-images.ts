import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkCreatorImages() {
    try {
        const creator = await prisma.creator.findFirst({
            where: { userId: 'cmg3vznf40001uq6ogyrk8dan' },
            include: {
                user: true,
                channels: true
            }
        })

        console.log('✅ Creator found:', creator?.id)
        console.log('📸 User Profile Image:', creator?.user?.profileImage || '❌ NULL')
        console.log('🖼️ Channel Cover Image:', creator?.channels[0]?.coverImage || '❌ NULL')
        console.log('\nFull user data:')
        console.log(JSON.stringify(creator?.user, null, 2))
        console.log('\nFull channel data:')
        console.log(JSON.stringify(creator?.channels[0], null, 2))
    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

checkCreatorImages()
