import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function debugFatmaProfile() {
    try {
        console.log('🔍 Debugging Fatma profile issue...')
        
        // Find Fatma by email
        const fatmaByEmail = await prisma.user.findUnique({
            where: { email: 'fatma@demo.com' },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                onboardingCompleted: true,
                interests: true,
                goals: true,
                skillLevel: true,
                learningMode: true,
                studyPreferences: true
            }
        })
        
        if (!fatmaByEmail) {
            console.log('❌ Fatma not found by email')
            return
        }
        
        console.log('✅ Fatma found by email:')
        console.log('  ID:', fatmaByEmail.id)
        console.log('  Email:', fatmaByEmail.email)
        console.log('  Name:', fatmaByEmail.name)
        console.log('  Role:', fatmaByEmail.role)
        console.log('  Onboarding:', fatmaByEmail.onboardingCompleted)
        console.log('  Interests:', fatmaByEmail.interests)
        console.log('  Goals:', fatmaByEmail.goals)
        console.log('  Skill Level:', fatmaByEmail.skillLevel)
        console.log('  Learning Mode:', fatmaByEmail.learningMode)
        console.log('  Has Study Preferences:', !!fatmaByEmail.studyPreferences)
        
        // Now test the exact same query that the matching service uses
        console.log('\n🔍 Testing matching service query...')
        
        const userForMatching = await prisma.user.findUnique({
            where: { id: fatmaByEmail.id },
            include: {
                studyPreferences: true,
            },
        })
        
        if (!userForMatching) {
            console.log('❌ Fatma not found by ID in matching service query')
            return
        }
        
        console.log('✅ Fatma found by ID for matching:')
        console.log('  ID:', userForMatching.id)
        console.log('  Email:', userForMatching.email)
        console.log('  Name:', userForMatching.name)
        console.log('  Study Preferences:', userForMatching.studyPreferences ? 'EXISTS' : 'NULL')
        
        // Test if we can find potential matches
        console.log('\n🔍 Testing potential matches query...')
        
        const potentialMatches = await prisma.user.findMany({
            where: {
                id: { not: fatmaByEmail.id },
                role: 'LEARNER',
                onboardingCompleted: true,
            },
            include: {
                studyPreferences: true,
            },
        })
        
        console.log(`✅ Found ${potentialMatches.length} potential matches`)
        potentialMatches.forEach(match => {
            console.log(`  - ${match.name} (${match.email})`)
        })
        
        // Check existing matches
        console.log('\n🔍 Checking existing matches...')
        
        const existingMatches = await prisma.studyBuddyMatch.findMany({
            where: {
                OR: [
                    { user1Id: fatmaByEmail.id },
                    { user2Id: fatmaByEmail.id },
                ],
            },
            select: {
                user1Id: true,
                user2Id: true,
                status: true,
                user1: { select: { name: true, email: true } },
                user2: { select: { name: true, email: true } }
            },
        })
        
        console.log(`✅ Found ${existingMatches.length} existing matches:`)
        existingMatches.forEach(match => {
            const otherUser = match.user1Id === fatmaByEmail.id ? match.user2 : match.user1
            console.log(`  - ${otherUser.name} (${otherUser.email}) - Status: ${match.status}`)
        })
        
    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

debugFatmaProfile()