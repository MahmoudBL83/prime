import { prisma } from '../src/lib/prisma'

async function debugProfileUpdate() {
    console.log('🔍 Debug Profile Update Script')
    console.log('============================')

    try {
        // Check if we have any users
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                bio: true,
                interests: true,
                goals: true,
                skillLevel: true,
                learningMode: true,
                studyBuddyPreferences: true
            },
            take: 5
        })

        console.log('\n📊 Users in database:')
        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name} (${user.email})`)
            console.log(`   Bio: ${user.bio || 'Not set'}`)
            console.log(`   Interests: ${user.interests || 'Not set'}`)
            console.log(`   Goals: ${user.goals || 'Not set'}`)
            console.log(`   Skill Level: ${user.skillLevel || 'Not set'}`)
            console.log(`   Learning Mode: ${user.learningMode || 'Not set'}`)
            console.log('   ---')
        })

        if (users.length > 0) {
            const testUser = users[0]
            console.log(`\n🧪 Testing profile update for user: ${testUser.name}`)
            
            // Test update
            const updateData = {
                bio: 'Updated bio from debug script',
                interests: JSON.stringify(['Programming', 'Web Development', 'AI']),
                goals: JSON.stringify(['Learn React', 'Build portfolio', 'Get job']),
                skillLevel: 'INTERMEDIATE',
                learningMode: 'online'
            }

            console.log('📝 Update data:', updateData)

            const updatedUser = await prisma.user.update({
                where: { id: testUser.id },
                data: updateData,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    bio: true,
                    interests: true,
                    goals: true,
                    skillLevel: true,
                    learningMode: true,
                    studyBuddyPreferences: true,
                    updatedAt: true
                }
            })

            console.log('\n✅ Update successful!')
            console.log('Updated user:', {
                ...updatedUser,
                interests: updatedUser.interests ? JSON.parse(updatedUser.interests) : [],
                goals: updatedUser.goals ? JSON.parse(updatedUser.goals) : []
            })

        } else {
            console.log('❌ No users found in database')
        }

    } catch (error) {
        console.error('❌ Debug script error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

debugProfileUpdate()