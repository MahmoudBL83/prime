import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function setupFatmaStudyBuddy() {
  try {
    console.log('🔍 Setting up study buddy for Fatma...')

    // First, find Fatma's user account
    const fatma = await prisma.user.findUnique({
      where: { email: 'fatma@demo.com' },
      select: {
        id: true,
        name: true,
        arabicName: true,
        interests: true,
        goals: true,
        skillLevel: true,
        studyBuddyMatches: true,
        studyBuddyMatches2: true
      }
    })

    if (!fatma) {
      console.log('❌ Fatma user not found!')
      return
    }

    console.log('✅ Found Fatma:', {
      name: fatma.name,
      arabicName: fatma.arabicName,
      interests: fatma.interests,
      goals: fatma.goals,
      skillLevel: fatma.skillLevel,
      currentMatches: fatma.studyBuddyMatches.length + fatma.studyBuddyMatches2.length
    })

    // Get other demo users who can be study buddies
    const potentialBuddies = await prisma.user.findMany({
      where: {
        email: { not: 'fatma@demo.com' },
        role: 'LEARNER'
      },
      select: {
        id: true,
        name: true,
        arabicName: true,
        email: true,
        interests: true,
        goals: true,
        skillLevel: true
      },
      take: 5
    })

    console.log(`\n📚 Found ${potentialBuddies.length} potential study buddies:`)
    potentialBuddies.forEach(buddy => {
      console.log(`- ${buddy.name} (${buddy.arabicName}) - ${buddy.email}`)
    })

    // Create study buddy matches for Fatma
    const matchesToCreate = []

    for (const buddy of potentialBuddies.slice(0, 3)) {
      // Check if match already exists
      const existingMatch = await prisma.studyBuddyMatch.findFirst({
        where: {
          OR: [
            { user1Id: fatma.id, user2Id: buddy.id },
            { user1Id: buddy.id, user2Id: fatma.id }
          ]
        }
      })

      if (!existingMatch) {
        // Parse interests and goals to find shared ones
        const fatmaInterests = fatma.interests ? fatma.interests.split(',').map(i => i.trim()) : []
        const buddyInterests = buddy.interests ? buddy.interests.split(',').map(i => i.trim()) : []
        const sharedSubjects = fatmaInterests.filter((interest: string) => 
          buddyInterests.includes(interest)
        )

        const fatmaGoals = fatma.goals ? fatma.goals.split(',').map(g => g.trim()) : []
        const buddyGoals = buddy.goals ? buddy.goals.split(',').map(g => g.trim()) : []
        const sharedGoals = fatmaGoals.filter((goal: string) => 
          buddyGoals.includes(goal)
        )

        matchesToCreate.push({
          user1Id: fatma.id,
          user2Id: buddy.id,
          status: 'MATCHED',
          sharedSubjects: JSON.stringify(sharedSubjects),
          sharedGoals: JSON.stringify(sharedGoals)
        })

        console.log(`\n✨ Creating match with ${buddy.name}:`)
        console.log(`   Shared subjects: ${sharedSubjects.join(', ') || 'None'}`)
        console.log(`   Shared goals: ${sharedGoals.join(', ') || 'None'}`)
      } else {
        console.log(`\n⚠️ Match with ${buddy.name} already exists`)
      }
    }

    // Create the matches
    if (matchesToCreate.length > 0) {
      const createdMatches = await prisma.studyBuddyMatch.createMany({
        data: matchesToCreate
      })

      console.log(`\n🎉 Created ${createdMatches.count} new study buddy matches for Fatma!`)
    } else {
      console.log('\n📝 No new matches to create.')
    }

    // Verify the matches
    const finalMatches = await prisma.studyBuddyMatch.findMany({
      where: {
        OR: [
          { user1Id: fatma.id },
          { user2Id: fatma.id }
        ]
      },
      include: {
        user1: {
          select: {
            name: true,
            arabicName: true,
            email: true
          }
        },
        user2: {
          select: {
            name: true,
            arabicName: true,
            email: true
          }
        }
      }
    })

    console.log(`\n✅ Fatma now has ${finalMatches.length} study buddy matches:`)
    finalMatches.forEach(match => {
      const otherUser = match.user1Id === fatma.id ? match.user2 : match.user1
      console.log(`- ${otherUser.name} (${otherUser.arabicName}) - ${match.status}`)
    })

  } catch (error) {
    console.error('❌ Error setting up study buddy:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupFatmaStudyBuddy()