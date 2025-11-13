import { prisma } from '../src/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../src/lib/auth'

async function debugSessionAndUsers() {
    console.log('🔍 Debugging Session and User Issues')
    console.log('=====================================')

    try {
        // First, let's see all users in the database
        const allUsers = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                passwordHash: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        })

        console.log(`\n👥 Found ${allUsers.length} users in database:`)
        allUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name} (${user.email})`)
            console.log(`   ID: ${user.id}`)
            console.log(`   Role: ${user.role}`)
            console.log(`   Has Password: ${user.passwordHash ? 'Yes' : 'No'}`)
            console.log(`   Created: ${user.createdAt}`)
            console.log('   ---')
        })

        // Check if there's a specific user we should test login with
        const adminUser = allUsers.find(u => u.email === 'admin@prime.eg')
        if (adminUser) {
            console.log('\n🔐 Admin user found for testing:')
            console.log(`   Name: ${adminUser.name}`)
            console.log(`   Email: ${adminUser.email}`)
            console.log(`   ID: ${adminUser.id}`)
            console.log(`   Role: ${adminUser.role}`)
        }

        // Check for demo users
        const demoUsers = allUsers.filter(u => u.email.includes('demo.com'))
        if (demoUsers.length > 0) {
            console.log(`\n🎭 Found ${demoUsers.length} demo users:`)
            demoUsers.forEach(user => {
                console.log(`   - ${user.name} (${user.email}) - Role: ${user.role}`)
            })
        }

        // Simulate what happens in the API call
        console.log('\n🔍 Testing API scenarios:')
        
        // Example session data that might be causing issues
        const exampleSessions = [
            { id: 'invalid-id', email: 'admin@prime.eg', name: 'Omar Hassan' },
            { id: adminUser?.id || 'test-id', email: 'admin@prime.eg', name: 'Omar Hassan' },
            { id: 'cmg3vznea0000uq6oqr9rnuiv', email: 'admin@prime.eg', name: 'Omar Hassan' }
        ]

        for (const sessionUser of exampleSessions) {
            console.log(`\n🧪 Testing session: ID=${sessionUser.id}, Email=${sessionUser.email}`)
            
            // Test ID lookup
            const userById = await prisma.user.findUnique({
                where: { id: sessionUser.id },
                select: { id: true, name: true, email: true }
            })
            
            if (userById) {
                console.log(`   ✅ Found by ID: ${userById.name}`)
            } else {
                console.log(`   ❌ Not found by ID: ${sessionUser.id}`)
                
                // Test email fallback
                const userByEmail = await prisma.user.findUnique({
                    where: { email: sessionUser.email },
                    select: { id: true, name: true, email: true }
                })
                
                if (userByEmail) {
                    console.log(`   ✅ Found by email fallback: ${userByEmail.name} (ID: ${userByEmail.id})`)
                } else {
                    console.log(`   ❌ Not found by email either: ${sessionUser.email}`)
                }
            }
        }

        console.log('\n💡 Recommendations:')
        console.log('1. Clear browser cookies and login again')
        console.log('2. Check if the session user ID matches any database user ID')
        console.log('3. Try logging in with admin@prime.eg or another known user')
        console.log('4. Verify NextAuth configuration is working correctly')

    } catch (error) {
        console.error('❌ Debug script error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

debugSessionAndUsers()