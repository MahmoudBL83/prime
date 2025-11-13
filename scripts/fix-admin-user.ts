import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function fixAdminUser() {
    try {
        console.log('🔍 Checking admin@prime.eg...')

        // Find the user
        const user = await prisma.user.findUnique({
            where: { email: 'admin@prime.eg' }
        })

        if (!user) {
            console.log('❌ User not found, creating admin user...')

            const hashedPassword = await bcrypt.hash('demo123', 10)

            const adminUser = await prisma.user.create({
                data: {
                    email: 'admin@prime.eg',
                    name: 'System Administrator',
                    arabicName: 'مدير النظام',
                    passwordHash: hashedPassword,
                    role: UserRole.ADMIN,
                    emailVerified: new Date(),
                    interests: 'System Administration',
                    goals: 'Platform Management'
                }
            })

            console.log('✅ Admin user created!')
            console.log(`Email: ${adminUser.email}`)
            console.log(`Role: ${adminUser.role}`)
            console.log('Password: demo123')

        } else {
            console.log('👤 User found:')
            console.log(`Email: ${user.email}`)
            console.log(`Current Role: ${user.role}`)

            // Check if password works
            const passwordWorks = await bcrypt.compare('demo123', user.passwordHash)
            console.log(`Password 'demo123' works: ${passwordWorks}`)

            // If not admin role, update it
            if (user.role !== UserRole.ADMIN) {
                console.log('🔧 Updating user role to ADMIN...')

                const updatedUser = await prisma.user.update({
                    where: { email: 'admin@prime.eg' },
                    data: {
                        role: UserRole.ADMIN
                    }
                })

                console.log(`✅ Role updated to: ${updatedUser.role}`)
            }

            // If password doesn't work, update it
            if (!passwordWorks) {
                console.log('🔧 Updating password to demo123...')

                const hashedPassword = await bcrypt.hash('demo123', 10)

                await prisma.user.update({
                    where: { email: 'admin@prime.eg' },
                    data: {
                        passwordHash: hashedPassword
                    }
                })

                console.log('✅ Password updated!')
            }
        }

        console.log('\n🎉 Admin user is ready!')
        console.log('Email: admin@prime.eg')
        console.log('Password: demo123')
        console.log('Role: ADMIN')

    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

fixAdminUser()
