import { prisma } from '../src/lib/prisma'

async function verifyCreator() {
    const userId = 'cmg3vznf40001uq6ogyrk8dan'
    
    const creator = await prisma.creator.findFirst({
        where: { userId }
    })
    
    if (!creator) {
        console.log('❌ No creator found for this user')
        process.exit(1)
    }
    
    console.log('Updating creator to VERIFIED status...')
    
    const updated = await prisma.creator.update({
        where: { id: creator.id },
        data: {
            kycStatus: 'VERIFIED',
            expertise: 'Educational Content Creator',
            teachingGoals: 'Creating engaging educational content',
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
    
    // Also update user role to CREATOR
    await prisma.user.update({
        where: { id: userId },
        data: { role: 'CREATOR' }
    })
    
    console.log('✅ Creator verified and updated!')
    console.log('Creator ID:', updated.id)
    console.log('KYC Status:', updated.kycStatus)
    console.log('User role updated to: CREATOR')
    console.log('')
    console.log('You can now access the calendar and all creator features!')
    
    process.exit(0)
}

verifyCreator().catch(error => {
    console.error('Error:', error)
    process.exit(1)
})
