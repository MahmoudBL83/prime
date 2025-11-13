import { prisma } from '../src/lib/prisma'

async function checkUsers() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            }
        })

        console.log('\n📊 Users in database:')
        console.log('==================')
        users.forEach((user, index) => {
            console.log(`\n${index + 1}. ${user.name || 'No name'}`)
            console.log(`   ID: ${user.id}`)
            console.log(`   Email: ${user.email}`)
            console.log(`   Role: ${user.role}`)
        })

        console.log(`\n\nTotal users: ${users.length}`)

        // Check if there are any sessions
        const sessions = await prisma.session.findMany({
            select: {
                userId: true,
                expires: true,
            }
        })

        console.log(`\n📋 Active sessions: ${sessions.length}`)
        sessions.forEach((session, index) => {
            console.log(`\n${index + 1}. User ID: ${session.userId}`)
            console.log(`   Expires: ${session.expires}`)
        })

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

checkUsers()
