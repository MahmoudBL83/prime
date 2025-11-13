import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function testFatmaLogin() {
    try {
        console.log('🔍 Testing Fatma login credentials...')
        
        // Find Fatma's user record
        const fatma = await prisma.user.findUnique({
            where: { email: 'fatma@demo.com' },
            select: {
                id: true,
                email: true,
                name: true,
                passwordHash: true,
                role: true,
                onboardingCompleted: true
            }
        })
        
        if (!fatma) {
            console.log('❌ Fatma not found')
            return
        }
        
        console.log('✅ Fatma found:')
        console.log('  ID:', fatma.id)
        console.log('  Email:', fatma.email)
        console.log('  Name:', fatma.name)
        console.log('  Role:', fatma.role)
        console.log('  Onboarding:', fatma.onboardingCompleted)
        console.log('  Has Password:', !!fatma.passwordHash)
        
        // Test password
        if (fatma.passwordHash) {
            const passwordValid = await bcrypt.compare('demo123', fatma.passwordHash)
            console.log('  Password Valid:', passwordValid)
            
            if (!passwordValid) {
                console.log('❌ Password invalid - trying other common passwords...')
                
                const otherPasswords = ['password', 'admin123', 'demo', 'fatma123']
                for (const pwd of otherPasswords) {
                    const valid = await bcrypt.compare(pwd, fatma.passwordHash)
                    if (valid) {
                        console.log(`✅ Password "${pwd}" works!`)
                        break
                    }
                }
            }
        }
        
        // Show what the JWT token payload should contain
        console.log('\n📋 Expected JWT token payload:')
        console.log({
            id: fatma.id,
            email: fatma.email,
            name: fatma.name,
            role: fatma.role
        })
        
    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

testFatmaLogin()