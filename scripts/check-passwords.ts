import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkPasswords() {
    try {
        const users = await prisma.user.findMany({
            select: {
                email: true,
                passwordHash: true,
                role: true
            }
        })
        
        console.log('Users with passwords:')
        users.forEach(u => {
            console.log(`${u.email} (${u.role}): ${u.passwordHash ? 'HAS_PASSWORD' : 'NO_PASSWORD'}`)
        })
        
    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

checkPasswords()