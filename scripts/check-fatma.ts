import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkFatma() {
    try {
        const fatma = await prisma.user.findUnique({
            where: { email: 'fatma@demo' },
            include: {
                creator: {
                    include: {
                        channels: true
                    }
                }
            }
        })

        if (fatma) {
            console.log('✅ Fatma user found!')
            console.log('ID:', fatma.id)
            console.log('Email:', fatma.email)
            console.log('Name:', fatma.name)
            console.log('Role:', fatma.role)
            console.log('Has creator profile:', !!fatma.creator)
            if (fatma.creator) {
                console.log('Creator ID:', fatma.creator.id)
                console.log('Has channels:', fatma.creator.channels?.length || 0)
            }
        } else {
            console.log('❌ Fatma user not found!')
            
            // Check all users
            const allUsers = await prisma.user.findMany({
                select: { id: true, email: true, name: true, role: true }
            })
            console.log('\nAll users in database:')
            console.table(allUsers)
        }
    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

checkFatma()
