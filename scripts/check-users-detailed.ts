import { prisma } from '../src/lib/prisma'

async function checkUsers() {
    console.log('👥 Checking Users in Database')
    console.log('=============================')

    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                bio: true,
                interests: true,
                goals: true,
                skillLevel: true,
                learningMode: true
            },
            orderBy: { createdAt: 'desc' }
        })

        console.log(`\n📊 Found ${users.length} users:`)
        users.forEach((user, index) => {
            console.log(`\n${index + 1}. ${user.name} (${user.email})`)
            console.log(`   ID: ${user.id}`)
            console.log(`   Role: ${user.role}`)
            console.log(`   Created: ${user.createdAt}`)
            console.log(`   Bio: ${user.bio || 'Not set'}`)
            console.log(`   Interests: ${user.interests || 'Not set'}`)
            console.log(`   Goals: ${user.goals || 'Not set'}`)
            console.log(`   Skill Level: ${user.skillLevel || 'Not set'}`)
            console.log(`   Learning Mode: ${user.learningMode || 'Not set'}`)
        })

        // Check for any session or authentication related tables
        console.log('\n🔐 Checking session data...')
        
        // If there are any sessions or accounts, show them
        try {
            const sessions = await prisma.session?.findMany({
                select: {
                    id: true,
                    sessionToken: true,
                    userId: true,
                    expires: true
                },
                take: 5
            })
            if (sessions && sessions.length > 0) {
                console.log('Active sessions found:', sessions.length)
                sessions.forEach(session => {
                    console.log(`  Session: ${session.id} -> User: ${session.userId}`)
                })
            } else {
                console.log('No sessions found (JWT mode)')
            }
        } catch (e) {
            console.log('No session table (using JWT auth)')
        }

        console.log('\n✅ User check completed')

    } catch (error) {
        console.error('❌ Error checking users:', error)
    } finally {
        await prisma.$disconnect()
    }
}

checkUsers()