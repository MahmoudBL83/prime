import { prisma } from '../src/lib/prisma'

async function createCreatorForAdmin() {
    const adminUserId = 'cmhfvj7f10000uqz44awd02a3' // Omar Hassan (admin@prime.eg)
    
    // Check if creator already exists
    const existing = await prisma.creator.findFirst({
        where: { userId: adminUserId }
    })
    
    if (existing) {
        console.log('✓ Creator already exists for admin!')
        console.log('Creator ID:', existing.id)
        process.exit(0)
    }
    
    // Create creator record for admin
    const creator = await prisma.creator.create({
        data: {
            userId: adminUserId,
            kycStatus: 'VERIFIED',
            expertise: 'Platform Administration & Education',
            teachingGoals: 'Managing and creating educational content',
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
    
    console.log('✅ Creator record created for admin!')
    console.log('Creator ID:', creator.id)
    console.log('User: Omar Hassan (admin@prime.eg)')
    console.log('')
    console.log('You can now login with: admin@prime.eg')
    console.log('And access the creator profile and calendar!')
    
    // Create a creator channel
    const channel = await prisma.creatorChannel.create({
        data: {
            creatorId: creator.id,
            name: "Omar Hassan's Channel",
            description: 'Educational content and platform tutorials',
            isActive: true
        }
    })
    
    console.log('✅ Creator channel created!')
    console.log('Channel ID:', channel.id)
    
    process.exit(0)
}

createCreatorForAdmin().catch(error => {
    console.error('Error:', error)
    process.exit(1)
})
