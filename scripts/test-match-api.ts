import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testMatchAPI() {
    try {
        // First, let's test the enhanced matching service directly
        console.log('Testing Enhanced Matching Service...')
        
        // Import the service
        const { EnhancedMatchingService } = await import('../src/services/EnhancedMatchingService')
        
        // Get Fatma's user ID
        const fatmaUser = await prisma.user.findUnique({
            where: { email: 'fatma@demo.com' },
            select: { id: true, name: true, onboardingCompleted: true }
        })
        
        if (!fatmaUser) {
            console.log('❌ Fatma user not found')
            return
        }
        
        console.log('✅ Found Fatma:', fatmaUser)
        
        if (!fatmaUser.onboardingCompleted) {
            console.log('❌ Fatma onboarding not completed')
            return
        }
        
        // Test the matching service
        console.log('\n🔍 Finding matches for Fatma...')
        const matches = await EnhancedMatchingService.findMatches(fatmaUser.id, 5)
        
        console.log(`✅ Found ${matches.length} matches:`)
        for (const match of matches) {
            const user = await prisma.user.findUnique({
                where: { id: match.userId },
                select: { name: true, email: true }
            })
            console.log(`  - ${user?.name} (${user?.email}) - Score: ${match.totalScore}`)
            console.log(`    Shared interests: ${match.sharedInterests.join(', ')}`)
            console.log(`    Shared goals: ${match.sharedGoals.join(', ')}`)
            console.log(`    Reasons: ${match.reasonsForMatch.join(', ')}`)
            console.log()
        }
        
        // Check for potential issues
        console.log('\n🔍 Checking for potential issues...')
        
        // Check total available users
        const totalUsers = await prisma.user.count({
            where: {
                role: 'LEARNER',
                onboardingCompleted: true,
                id: { not: fatmaUser.id }
            }
        })
        console.log(`✅ Total available users: ${totalUsers}`)
        
        // Check existing matches
        const existingMatches = await prisma.studyBuddyMatch.count({
            where: {
                OR: [
                    { user1Id: fatmaUser.id },
                    { user2Id: fatmaUser.id }
                ]
            }
        })
        console.log(`✅ Existing matches for Fatma: ${existingMatches}`)
        
        // Test a simple HTTP request to the API
        console.log('\n🌐 Testing API endpoint...')
        
        const fetch = (await import('node-fetch')).default
        
        try {
            const response = await fetch('http://localhost:3000/api/study-buddy/match?limit=5', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            
            console.log('API Response Status:', response.status)
            const responseText = await response.text()
            console.log('API Response:', responseText)
            
            if (response.status === 401) {
                console.log('❌ API returned 401 - Authentication required')
                console.log('This is expected when testing without a session')
            }
        } catch (error) {
            console.log('❌ Error calling API:', error)
        }
        
    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

testMatchAPI()