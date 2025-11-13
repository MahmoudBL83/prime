import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdminUser() {
    try {
        // Check if admin user already exists
        const existingAdmin = await prisma.user.findFirst({
            where: { role: UserRole.ADMIN }
        })

        if (existingAdmin) {
            console.log('Admin user already exists:', existingAdmin.email)
            return
        }

        // Create admin user
        const adminPassword = await bcrypt.hash('admin123!@#', 10)

        const admin = await prisma.user.create({
            data: {
                email: 'admin@prime.eg',
                name: 'System Administrator',
                arabicName: 'مدير النظام',
                passwordHash: adminPassword,
                role: UserRole.ADMIN,
                emailVerified: new Date(),
                onboardingCompleted: true,
                interests: 'System Administration',
                goals: 'Platform Management'
            }
        })

        console.log('✅ Admin user created successfully!')
        console.log('Email: admin@prime.eg')
        console.log('Password: admin123!@#')
        console.log('Role: ADMIN')

    } catch (error) {
        console.error('❌ Error creating admin user:', error)
    } finally {
        await prisma.$disconnect()
    }
}

createAdminUser()
