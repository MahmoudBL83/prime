import { prisma } from '../src/lib/prisma'

async function checkCreator() {
    const userId = 'cmg3vznf40001uq6ogyrk8dan'
    
    const creator = await prisma.creator.findFirst({
        where: { userId }
    })
    
    console.log('=== Creator Check ===')
    console.log('User ID:', userId)
    console.log('Creator found:', creator ? 'YES' : 'NO')
    
    if (creator) {
        console.log('Creator ID:', creator.id)
        console.log('KYC Status:', creator.kycStatus)
        console.log('Expertise:', creator.expertise)
    } else {
        console.log('❌ No creator record exists for this user!')
        console.log('This user needs to complete creator onboarding first.')
    }
    
    process.exit(0)
}

checkCreator()
