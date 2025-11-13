import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createDemoUsers() {
    try {
        console.log('🔧 Creating demo users for testing...')

        // Create learner user (fatma@demo.com)
        let learnerUser = await prisma.user.findUnique({
            where: { email: 'fatma@demo.com' }
        })

        if (!learnerUser) {
            const hashedPassword = await bcrypt.hash('demo123', 10)

            learnerUser = await prisma.user.create({
                data: {
                    email: 'fatma@demo.com',
                    name: 'Fatma Ahmed',
                    arabicName: 'فاطمة أحمد',
                    passwordHash: hashedPassword,
                    role: UserRole.LEARNER,
                    emailVerified: new Date(),
                    onboardingCompleted: true,
                    interests: 'Web Development, Mobile Apps',
                    goals: 'Learn modern programming skills'
                }
            })

            console.log('✅ Created learner user: fatma@demo.com')
        } else {
            console.log('👤 Learner user already exists: fatma@demo.com')
        }

        // Create creator user (dr.sarah@demo.com)
        let creatorUser = await prisma.user.findUnique({
            where: { email: 'dr.sarah@demo.com' }
        })

        if (!creatorUser) {
            const hashedPassword = await bcrypt.hash('demo123', 10)

            creatorUser = await prisma.user.create({
                data: {
                    email: 'dr.sarah@demo.com',
                    name: 'Dr. Sarah Johnson',
                    arabicName: 'د. سارة جونسون',
                    passwordHash: hashedPassword,
                    role: UserRole.CREATOR,
                    emailVerified: new Date(),
                    onboardingCompleted: true,
                    interests: 'Teaching, Course Creation',
                    goals: 'Share knowledge and create educational content'
                }
            })

            // Create creator profile
            await prisma.creator.create({
                data: {
                    userId: creatorUser.id,
                    kycStatus: 'VERIFIED',
                    expertise: 'Computer Science, Programming, Web Development',
                    teachingGoals: 'Help students master programming concepts',
                    contractSigned: true,
                    contractSignedAt: new Date()
                }
            })

            console.log('✅ Created creator user: dr.sarah@demo.com')
        } else {
            console.log('👤 Creator user already exists: dr.sarah@demo.com')
        }

        console.log('\n🎉 Demo users created successfully!')
        console.log('=====================================')
        console.log('📋 Demo Credentials:')
        console.log('----------------------------------------')
        console.log('Admin:')
        console.log('  Email: admin@prime.eg')
        console.log('  Password: demo123')
        console.log('  Role: ADMIN')
        console.log('----------------------------------------')
        console.log('Learner:')
        console.log('  Email: fatma@demo.com')
        console.log('  Password: demo123')
        console.log('  Role: LEARNER')
        console.log('----------------------------------------')
        console.log('Creator:')
        console.log('  Email: dr.sarah@demo.com')
        console.log('  Password: demo123')
        console.log('  Role: CREATOR')
        console.log('----------------------------------------')

    } catch (error) {
        console.error('❌ Error creating demo users:', error)
    } finally {
        await prisma.$disconnect()
    }
}

createDemoUsers()