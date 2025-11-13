import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function checkUsers() {
    try {
        // Get all users
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                onboardingCompleted: true
            }
        })

        console.log('📋 Current users in database:')
        console.log('==========================================')
        users.forEach(user => {
            console.log(`Email: ${user.email}`)
            console.log(`Name: ${user.name}`)
            console.log(`Role: ${user.role}`)
            console.log(`Onboarding: ${user.onboardingCompleted}`)
            console.log('------------------------------------------')
        })

        // Check if admin@prime.eg exists and what role it has
        const adminUser = await prisma.user.findUnique({
            where: { email: 'admin@prime.eg' }
        })

        if (adminUser) {
            console.log('🔍 Admin user found:')
            console.log(`Role: ${adminUser.role}`)
            console.log(`Onboarding completed: ${adminUser.onboardingCompleted}`)

            // Test password
            const isValidPassword = await bcrypt.compare('demo123', adminUser.passwordHash)
            console.log(`Password 'demo123' works: ${isValidPassword}`)

            const isValidPassword2 = await bcrypt.compare('admin123!@#', adminUser.passwordHash)
            console.log(`Password 'admin123!@#' works: ${isValidPassword2}`)
        } else {
            console.log('❌ No admin@prime.eg user found')
        }

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

checkUsers()
