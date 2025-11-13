import { prisma } from '../src/lib/prisma'

async function listUsers() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true
        },
        take: 10
    })
    
    console.log('=== Users in Database ===')
    console.log('Total users:', users.length)
    console.log('')
    
    users.forEach((user, i) => {
        console.log(`${i + 1}. ${user.name} (${user.email})`)
        console.log(`   ID: ${user.id}`)
        console.log(`   Role: ${user.role}`)
        console.log('')
    })
    
    process.exit(0)
}

listUsers()
