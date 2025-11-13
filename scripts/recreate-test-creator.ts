/**
 * Script to recreate the test creator user
 * Run with: npx tsx scripts/recreate-test-creator.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🔍 Checking for test creator...')

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
        where: { email: 'test@creator.com' }
    })

    if (existingUser) {
        console.log('✅ User already exists:', existingUser.id)
        console.log('   Name:', existingUser.name)
        console.log('   Email:', existingUser.email)
        console.log('   Role:', existingUser.role)
        
        // Check for creator profile
        const creator = await prisma.creator.findUnique({
            where: { userId: existingUser.id }
        })
        
        if (creator) {
            console.log('✅ Creator profile exists:', creator.id)
        } else {
            console.log('⚠️  Creator profile NOT found. Creating...')
            const newCreator = await prisma.creator.create({
                data: {
                    userId: existingUser.id,
                    kycStatus: 'NOT_STARTED',
                    contractSigned: false,
                    totalEarnings: 0,
                    totalSubscribers: 0,
                    availableForMeetings: true
                }
            })
            console.log('✅ Creator profile created:', newCreator.id)
        }
        
        return
    }

    console.log('❌ User not found. Creating new test creator...')

    // Hash password
    const passwordHash = await bcrypt.hash('password123', 10)

    // Create user
    const user = await prisma.user.create({
        data: {
            email: 'test@creator.com',
            name: 'Test Creator',
            passwordHash,
            role: 'CREATOR',
            onboardingCompleted: true,
            emailVerified: new Date()
        }
    })

    console.log('✅ User created:', user.id)
    console.log('   Email: test@creator.com')
    console.log('   Password: password123')

    // Create creator profile
    const creator = await prisma.creator.create({
        data: {
            userId: user.id,
            kycStatus: 'NOT_STARTED',
            contractSigned: false,
            totalEarnings: 0,
            totalSubscribers: 0,
            availableForMeetings: true
        }
    })

    console.log('✅ Creator profile created:', creator.id)
    console.log('')
    console.log('🎉 Test creator is ready!')
    console.log('   Email: test@creator.com')
    console.log('   Password: password123')
    console.log('   Role: CREATOR')
    console.log('')
    console.log('👉 Now sign out and sign in again with these credentials')
}

main()
    .catch((error) => {
        console.error('❌ Error:', error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
