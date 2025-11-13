import { prisma } from '../src/lib/prisma'

async function checkProfileCompleteness() {
    console.log('🔍 Checking Profile Completeness for Study Buddy')
    console.log('================================================')

    try {
        // Get all users and check their study buddy profile completeness
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                bio: true,
                interests: true,
                goals: true,
                skillLevel: true,
                learningMode: true,
                onboardingCompleted: true,
                studyBuddyPreferences: true
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        })

        console.log(`\n📊 Found ${users.length} users:`)
        
        users.forEach((user, index) => {
            console.log(`\n${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`)
            console.log(`   ID: ${user.id}`)
            console.log(`   Onboarding Completed: ${user.onboardingCompleted}`)
            
            // Check study buddy profile completeness
            const missingFields = []
            const details = []
            
            if (!user.bio || user.bio.trim() === '') {
                details.push('❌ Bio: Not set')
            } else {
                details.push(`✅ Bio: "${user.bio.substring(0, 50)}${user.bio.length > 50 ? '...' : ''}"`)
            }
            
            if (!user.interests || user.interests.trim() === '' || user.interests === '[]') {
                missingFields.push('interests')
                details.push('❌ Interests: Not set or empty')
            } else {
                try {
                    const parsed = JSON.parse(user.interests)
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        details.push(`✅ Interests: ${parsed.join(', ')}`)
                    } else {
                        missingFields.push('interests')
                        details.push('❌ Interests: Empty array')
                    }
                } catch {
                    details.push(`✅ Interests: ${user.interests}`)
                }
            }
            
            if (!user.goals || user.goals.trim() === '' || user.goals === '[]') {
                missingFields.push('goals')
                details.push('❌ Goals: Not set or empty')
            } else {
                try {
                    const parsed = JSON.parse(user.goals)
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        details.push(`✅ Goals: ${parsed.join(', ')}`)
                    } else {
                        missingFields.push('goals')
                        details.push('❌ Goals: Empty array')
                    }
                } catch {
                    details.push(`✅ Goals: ${user.goals}`)
                }
            }
            
            if (!user.skillLevel) {
                missingFields.push('skill level')
                details.push('❌ Skill Level: Not set')
            } else {
                details.push(`✅ Skill Level: ${user.skillLevel}`)
            }
            
            if (!user.learningMode) {
                missingFields.push('learning mode')
                details.push('❌ Learning Mode: Not set')
            } else {
                details.push(`✅ Learning Mode: ${user.learningMode}`)
            }
            
            details.forEach(detail => console.log(`   ${detail}`))
            
            if (missingFields.length > 0) {
                console.log(`   🚨 MISSING for Study Buddy: ${missingFields.join(', ')}`)
                console.log(`   📝 This user would get PROFILE_INCOMPLETE error`)
            } else {
                console.log(`   ✅ Profile complete for Study Buddy`)
            }
        })

        console.log('\n🔍 Study Buddy specific validation:')
        console.log('- Interests: Must be non-empty JSON array or comma-separated string')
        console.log('- Goals: Must be non-empty JSON array or comma-separated string') 
        console.log('- Skill Level: Must be set (BEGINNER/INTERMEDIATE/ADVANCED)')
        console.log('- Learning Mode: Must be set (online/offline/hybrid)')
        console.log('- Bio: Optional but recommended')

    } catch (error) {
        console.error('❌ Error checking profile completeness:', error)
    } finally {
        await prisma.$disconnect()
    }
}

checkProfileCompleteness()