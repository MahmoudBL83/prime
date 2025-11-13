import { prisma } from '../src/lib/prisma'

async function createCreator() {
    const userId = 'cmg3vznf40001uq6ogyrk8dan'
    
    // Check if user exists
    const user = await prisma.user.findUnique({
        where: { id: userId }
    })
    
    if (!user) {
        console.log('❌ User not found!')
        process.exit(1)
    }
    
    console.log('✓ User found:', user.name)
    
    // Check if creator already exists
    const existingCreator = await prisma.creator.findFirst({
        where: { userId }
    })
    
    if (existingCreator) {
        console.log('✓ Creator already exists!')
        console.log('Creator ID:', existingCreator.id)
        process.exit(0)
    }
    
    // Create creator record
    const creator = await prisma.creator.create({
        data: {
            userId: userId,
            kycStatus: 'VERIFIED', // Set as verified for testing
            expertise: 'Educational Content Creator',
            teachingGoals: 'Creating engaging educational content',
            basicMonthlyPrice: 49,
            premiumMonthlyPrice: 99,
            vipMonthlyPrice: 199,
            basicYearlyPrice: 490,
            premiumYearlyPrice: 990,
            vipYearlyPrice: 1990,
            totalEarnings: 0,
            totalSubscribers: 0,
            availableForMeetings: true,
            contractSigned: true,
            contractSignedAt: new Date(),
            subscriptionBenefits: {
                basic: ['Access to basic content', 'Community access'],
                premium: ['All basic benefits', 'Weekly live sessions', 'Priority support'],
                vip: ['All premium benefits', '1-on-1 coaching', 'Exclusive content', 'Direct messaging']
            }
        }
    })
    
    console.log('✅ Creator record created successfully!')
    console.log('Creator ID:', creator.id)
    console.log('KYC Status:', creator.kycStatus)
    console.log('Expertise:', creator.expertise)
    
    // Create a creator channel
    const channel = await prisma.creatorChannel.create({
        data: {
            creatorId: creator.id,
            name: `${user.name}'s Channel`,
            description: 'My educational content channel',
            isActive: true
        }
    })
    
    console.log('✅ Creator channel created!')
    console.log('Channel ID:', channel.id)
    
    process.exit(0)
}

createCreator().catch(error => {
    console.error('Error:', error)
    process.exit(1)
})
