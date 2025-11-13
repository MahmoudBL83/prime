import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function debugSession() {
    try {
        console.log('🔍 Debugging session and user data...')
        
        // Get all users to see what IDs exist
        const allUsers = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                onboardingCompleted: true
            }
        })
        
        console.log('\n✅ All users in database:')
        allUsers.forEach(user => {
            console.log(`  - ${user.name} (${user.email})`)
            console.log(`    ID: ${user.id}`)
            console.log(`    Role: ${user.role}`)
            console.log(`    Onboarding: ${user.onboardingCompleted}`)
            console.log()
        })
        
        // Check if there are any sessions in the database
        const sessions = await prisma.session.findMany({
            select: {
                id: true,
                userId: true,
                expiresAt: true,
                token: true,
                user: {
                    select: {
                        email: true,
                        name: true
                    }
                }
            }
        })
        
        console.log('\n✅ Active sessions:')
        if (sessions.length === 0) {
            console.log('  No active sessions found')
        } else {
            sessions.forEach(session => {
                console.log(`  - Session: ${session.id}`)
                console.log(`    User ID: ${session.userId}`)
                console.log(`    User: ${session.user?.name} (${session.user?.email})`)
                console.log(`    Expires: ${session.expiresAt}`)
                console.log()
            })
        }
        
    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

debugSession()