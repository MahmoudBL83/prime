/**
 * Script to list all users in the database
 * Run with: npm run db:list-users
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('📋 Listing all users in the database...\n')

    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            creator: {
                select: {
                    id: true,
                    kycStatus: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    if (users.length === 0) {
        console.log('❌ No users found in the database')
        console.log('\n💡 Run: npm run db:create-test-creator')
        return
    }

    console.log(`Found ${users.length} user(s):\n`)

    users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email})`)
        console.log(`   ID: ${user.id}`)
        console.log(`   Role: ${user.role}`)
        console.log(`   Creator Profile: ${user.creator ? '✅ Yes' : '❌ No'}`)
        if (user.creator) {
            console.log(`   Creator ID: ${user.creator.id}`)
            console.log(`   KYC Status: ${user.creator.kycStatus}`)
        }
        console.log(`   Created: ${user.createdAt.toISOString()}`)
        console.log('')
    })

    console.log('💡 To sign in, use the email and password from account creation')
    console.log('💡 For test@creator.com, the password is: password123')
}

main()
    .catch((error) => {
        console.error('❌ Error:', error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
