import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

async function updateAdminUser() {
    try {
        // Update admin user to ensure onboarding is completed
        const updatedUser = await prisma.user.update({
            where: { email: 'admin@prime.eg' },
            data: {
                onboardingCompleted: true,
                role: UserRole.ADMIN
            }
        })

        console.log('✅ Admin user updated:')
        console.log(`Email: ${updatedUser.email}`)
        console.log(`Role: ${updatedUser.role}`)
        console.log(`Onboarding Completed: ${updatedUser.onboardingCompleted}`)

    } catch (error) {
        console.error('❌ Error updating admin user:', error)
    } finally {
        await prisma.$disconnect()
    }
}

updateAdminUser()
