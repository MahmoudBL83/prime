import { prisma } from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

async function setupUserAndCreator() {
    const userId = 'cmg3vznf40001uq6ogyrk8dan'
    const email = 'test@creator.com'
    const password = 'password123'
    
    // Check if user exists
    let user = await prisma.user.findUnique({
        where: { id: userId }
    })
    
    if (!user) {
        console.log('User not found, creating new user...')
        
        // Create the user
        const hashedPassword = await bcrypt.hash(password, 10)
        user = await prisma.user.create({
            data: {
                id: userId,
                email: email,
                name: 'Test Creator',
                arabicName: 'منشئ اختبار',
                passwordHash: hashedPassword,
                role: 'LEARNER', // Start as learner, will upgrade to creator
                emailVerified: new Date(),
                onboardingCompleted: true,
                profileImage: null,
                bio: 'I am a content creator passionate about education'
            }
        })
        
        console.log('✅ User created!')
        console.log('Email:', email)
        console.log('Password:', password)
    } else {
        console.log('✓ User already exists:', user.name)
    }
    
    // Check if creator already exists
    let creator = await prisma.creator.findFirst({
        where: { userId: user.id }
    })
    
    if (creator) {
        console.log('✓ Creator already exists!')
        console.log('Creator ID:', creator.id)
    } else {
        console.log('Creating creator record...')
        
        // Create creator record
        creator = await prisma.creator.create({
            data: {
                userId: user.id,
                kycStatus: 'NOT_STARTED', // User needs to complete onboarding
                expertise: null,
                teachingGoals: null,
                basicMonthlyPrice: 49,
                premiumMonthlyPrice: 99,
                vipMonthlyPrice: 199,
                basicYearlyPrice: 490,
                premiumYearlyPrice: 990,
                vipYearlyPrice: 1990,
                totalEarnings: 0,
                totalSubscribers: 0,
                availableForMeetings: false,
                contractSigned: false,
            }
        })
        
        console.log('✅ Creator record created!')
        console.log('Creator ID:', creator.id)
        console.log('KYC Status:', creator.kycStatus)
    }
    
    console.log('')
    console.log('=== Summary ===')
    console.log('User ID:', user.id)
    console.log('Email:', email)
    console.log('Password:', password)
    console.log('Creator ID:', creator.id)
    console.log('KYC Status:', creator.kycStatus)
    console.log('')
    console.log('Next steps:')
    console.log('1. Login with:', email, '/', password)
    console.log('2. Go to /en/mentors')
    console.log('3. Click Profile')
    console.log('4. Click "Become a Creator" to complete onboarding')
    console.log('   OR')
    console.log('   Run the script to verify creator: npx tsx prisma/verify-creator.ts')
    
    process.exit(0)
}

setupUserAndCreator().catch(error => {
    console.error('Error:', error)
    process.exit(1)
})
