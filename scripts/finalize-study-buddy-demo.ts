import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function finalizeStudyBuddyDemo() {
  try {
    console.log('🎨 Finalizing study buddy demo data...')

    // Find Fatma and her study buddies
    const fatma = await prisma.user.findUnique({
      where: { email: 'fatma@demo.com' }
    })

    if (!fatma) {
      console.log('❌ Fatma not found!')
      return
    }

    // Get her study buddy matches
    const matches = await prisma.studyBuddyMatch.findMany({
      where: {
        OR: [
          { user1Id: fatma.id },
          { user2Id: fatma.id }
        ]
      },
      include: {
        user1: true,
        user2: true
      }
    })

    // Enhance the study buddy profiles with better data
    for (const match of matches) {
      const otherUser = match.user1Id === fatma.id ? match.user2 : match.user1
      
      // Update other user profiles to make them more realistic
      const profileUpdates: any = {
        onboardingCompleted: true,
        skillLevel: ['Beginner', 'Intermediate', 'Advanced'][Math.floor(Math.random() * 3)],
        learningMode: ['Self-paced', 'Structured', 'Interactive'][Math.floor(Math.random() * 3)]
      }

      // Add interests if not present
      if (!otherUser.interests) {
        const possibleInterests = [
          'programming', 'javascript', 'web-development', 'react', 'nodejs', 
          'python', 'data-science', 'mobile-development', 'ui-ux-design'
        ]
        const userInterests = possibleInterests
          .sort(() => 0.5 - Math.random())
          .slice(0, 3 + Math.floor(Math.random() * 3))
        
        profileUpdates.interests = JSON.stringify(userInterests)
      }

      // Add goals if not present
      if (!otherUser.goals) {
        const possibleGoals = [
          'master-javascript', 'build-projects', 'get-job-ready', 
          'learn-react', 'create-portfolio', 'freelance-ready',
          'startup-founder', 'senior-developer'
        ]
        const userGoals = possibleGoals
          .sort(() => 0.5 - Math.random())
          .slice(0, 2 + Math.floor(Math.random() * 3))
        
        profileUpdates.goals = JSON.stringify(userGoals)
      }

      // Add study buddy preferences
      if (!otherUser.studyBuddyPreferences) {
        const preferences = {
          preferredStudyTimes: ['morning', 'afternoon', 'evening'].filter(() => Math.random() > 0.5),
          preferredSubjects: JSON.parse(profileUpdates.interests || otherUser.interests || '[]'),
          studyStyle: ['collaborative', 'independent', 'guided'][Math.floor(Math.random() * 3)],
          communicationPreference: ['chat', 'video', 'voice'][Math.floor(Math.random() * 3)],
          availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
            .filter(() => Math.random() > 0.3)
        }
        
        profileUpdates.studyBuddyPreferences = JSON.stringify(preferences)
      }

      // Update the user
      await prisma.user.update({
        where: { id: otherUser.id },
        data: profileUpdates
      })

      console.log(`✅ Enhanced profile for ${otherUser.name}`)
    }

    // Update match compatibility scores
    for (const match of matches) {
      const user1 = match.user1
      const user2 = match.user2
      
      // Calculate real shared interests and goals
      const user1Interests = user1.interests ? JSON.parse(user1.interests) : []
      const user2Interests = user2.interests ? JSON.parse(user2.interests) : []
      const sharedSubjects = user1Interests.filter((interest: string) => 
        user2Interests.includes(interest)
      )

      const user1Goals = user1.goals ? JSON.parse(user1.goals) : []
      const user2Goals = user2.goals ? JSON.parse(user2.goals) : []
      const sharedGoals = user1Goals.filter((goal: string) => 
        user2Goals.includes(goal)
      )

      await prisma.studyBuddyMatch.update({
        where: { id: match.id },
        data: {
          status: 'ACTIVE',
          sharedSubjects: JSON.stringify(sharedSubjects),
          sharedGoals: JSON.stringify(sharedGoals)
        }
      })

      console.log(`🔄 Updated match compatibility for ${user1.name} ↔ ${user2.name}`)
    }

    // Add a recent activity message to one conversation
    const recentConv = await prisma.conversation.findFirst({
      where: {
        participants: {
          some: {
            userId: fatma.id
          }
        }
      },
      include: {
        participants: {
          include: {
            user: true
          }
        }
      }
    })

    if (recentConv) {
      const otherParticipant = recentConv.participants.find(p => p.userId !== fatma.id)
      if (otherParticipant) {
        await prisma.message.create({
          data: {
            conversationId: recentConv.id,
            senderId: otherParticipant.userId,
            content: `Hey Fatma! I just finished a JavaScript project. Want to review it together in our next study session?`,
            createdAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
          }
        })

        await prisma.message.create({
          data: {
            conversationId: recentConv.id,
            senderId: fatma.id,
            content: `Absolutely! I'd love to see what you've built. Let's schedule for tomorrow evening?`,
            createdAt: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
          }
        })

        console.log(`💬 Added recent messages to conversation with ${otherParticipant.user.name}`)
      }
    }

    // Final summary
    console.log('\n🎉 Study Buddy Demo Setup Complete!')
    console.log('\n📋 Ready for Demo:')
    console.log(`   👤 User: fatma@demo.com`)
    console.log(`   🤝 Study Buddies: 3 active matches`)
    console.log(`   💬 Conversations: Active messaging`)
    console.log(`   🎯 Shared Goals: Programming & Web Development`)
    console.log(`   📚 Common Interests: JavaScript, React, Projects`)
    console.log(`   ⏰ Recent Activity: Fresh messages`)
    console.log('\n🚀 Perfect for demonstrating collaborative learning!')

  } catch (error) {
    console.error('❌ Error finalizing demo:', error)
  } finally {
    await prisma.$disconnect()
  }
}

finalizeStudyBuddyDemo()