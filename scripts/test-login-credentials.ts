import { prisma } from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

async function testUserCredentials() {
    console.log('🔐 Testing User Login Credentials')
    console.log('==================================')

    try {
        // Test some known demo users
        const testUsers = [
            { email: 'admin@prime.eg', password: 'admin123' },
            { email: 'mariam@demo.com', password: 'demo123' },
            { email: 'fatma@demo.com', password: 'demo123' },
            { email: 'omar@demo.com', password: 'demo123' }
        ]

        for (const testUser of testUsers) {
            console.log(`\n🧪 Testing login for: ${testUser.email}`)
            
            const user = await prisma.user.findUnique({
                where: { email: testUser.email },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    passwordHash: true
                }
            })

            if (!user) {
                console.log(`   ❌ User not found`)
                continue
            }

            if (!user.passwordHash) {
                console.log(`   ❌ No password hash set`)
                continue
            }

            try {
                const passwordValid = await bcrypt.compare(testUser.password, user.passwordHash)
                if (passwordValid) {
                    console.log(`   ✅ Password correct! User details:`)
                    console.log(`      Name: ${user.name}`)
                    console.log(`      ID: ${user.id}`)
                    console.log(`      Role: ${user.role}`)
                    console.log(`      🎯 Use this for testing!`)
                } else {
                    console.log(`   ❌ Password incorrect`)
                }
            } catch (error) {
                console.log(`   ❌ Password comparison error:`, error)
            }
        }

        console.log('\n📋 Login Instructions:')
        console.log('1. Go to /auth/login')
        console.log('2. Use one of the working credentials above')
        console.log('3. Clear browser cookies first if having issues')
        console.log('4. Check browser network tab for API responses')

    } catch (error) {
        console.error('❌ Error testing credentials:', error)
    } finally {
        await prisma.$disconnect()
    }
}

testUserCredentials()