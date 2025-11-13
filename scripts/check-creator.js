const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkCreator() {
    try {
        const creatorId = 'cmg3vznl5000guq6osotd80lx'
        
        console.log('Checking for creator ID:', creatorId)
        
        const creator = await prisma.creator.findUnique({
            where: { id: creatorId },
            include: {
                user: true,
                channels: true
            }
        })
        
        if (creator) {
            console.log('✅ Creator found!')
            console.log('Name:', creator.user.name)
            console.log('Has channels:', creator.channels.length)
        } else {
            console.log('❌ Creator not found')
            
            // List all creators
            console.log('\nAll verified creators:')
            const allCreators = await prisma.creator.findMany({
                where: { kycStatus: 'VERIFIED' },
                include: { user: true },
                take: 10
            })
            
            allCreators.forEach(c => {
                console.log(`- ${c.id} - ${c.user.name}`)
            })
        }
        
    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

checkCreator()
