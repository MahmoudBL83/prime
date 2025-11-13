import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function enhanceFatmaStudyBuddyExperience() {
  try {
    console.log('🚀 Enhancing Fatma\'s study buddy experience...')

    // Find Fatma
    const fatma = await prisma.user.findUnique({
      where: { email: 'fatma@demo.com' }
    })

    if (!fatma) {
      console.log('❌ Fatma not found!')
      return
    }

    // Get her study buddy matches
    const studyBuddyMatches = await prisma.studyBuddyMatch.findMany({
      where: {
        OR: [
          { user1Id: fatma.id },
          { user2Id: fatma.id }
        ]
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            arabicName: true,
            email: true
          }
        },
        user2: {
          select: {
            id: true,
            name: true,
            arabicName: true,
            email: true
          }
        }
      }
    })

    console.log(`\n📱 Found ${studyBuddyMatches.length} study buddy matches`)

    // Update study buddy preferences for Fatma if needed
    if (!fatma.studyBuddyPreferences) {
      await prisma.user.update({
        where: { id: fatma.id },
        data: {
          studyBuddyPreferences: JSON.stringify({
            preferredStudyTimes: ['morning', 'evening'],
            preferredSubjects: ['programming', 'web-development', 'javascript'],
            studyStyle: 'collaborative',
            communicationPreference: 'chat',
            availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
          })
        }
      })
      console.log('✅ Updated Fatma\'s study buddy preferences')
    }

    // Check if she has conversations with her study buddies
    const conversations = await prisma.conversation.findMany({
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
            user: {
              select: {
                id: true,
                name: true,
                arabicName: true
              }
            }
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    })

    console.log(`\n💬 Found ${conversations.length} existing conversations`)

    // Create demo conversations with study buddies if they don't exist
    for (const match of studyBuddyMatches.slice(0, 2)) {
      const otherUser = match.user1Id === fatma.id ? match.user2 : match.user1
      
      // Check if conversation already exists between them
      const existingConversation = conversations.find(conv => 
        conv.participants.some(p => p.userId === otherUser.id)
      )

      if (!existingConversation) {
        console.log(`\n✨ Creating conversation with ${otherUser.name}...`)
        
        // Create conversation
        const conversation = await prisma.conversation.create({
          data: {
            type: 'DIRECT',
            title: `Study Session - ${otherUser.name}`,
            participants: {
              create: [
                { userId: fatma.id },
                { userId: otherUser.id }
              ]
            }
          }
        })

        // Add some demo messages
        const demoMessages = [
          {
            senderId: otherUser.id,
            content: `Hi Fatma! I saw we're matched as study buddies. Would you like to start a programming study session?`
          },
          {
            senderId: fatma.id,
            content: `That sounds great! I'm working on JavaScript fundamentals. What about you?`
          },
          {
            senderId: otherUser.id,
            content: `Perfect! I'm also learning JavaScript. We could work on some projects together.`
          }
        ]

        for (let i = 0; i < demoMessages.length; i++) {
          const msg = demoMessages[i]
          await prisma.message.create({
            data: {
              conversationId: conversation.id,
              senderId: msg.senderId,
              content: msg.content,
              createdAt: new Date(Date.now() - (demoMessages.length - i) * 3600000) // 1 hour apart
            }
          })
        }

        console.log(`✅ Created conversation with ${demoMessages.length} messages`)
      } else {
        console.log(`\n📝 Conversation with ${otherUser.name} already exists`)
      }
    }

    // Update study buddy match statuses and add more details
    for (const match of studyBuddyMatches) {
      const otherUser = match.user1Id === fatma.id ? match.user2 : match.user1
      
      await prisma.studyBuddyMatch.update({
        where: { id: match.id },
        data: {
          status: 'ACTIVE',
          sharedSubjects: JSON.stringify(['programming', 'javascript', 'web-development']),
          sharedGoals: JSON.stringify(['master-javascript', 'build-projects', 'get-job-ready'])
        }
      })
    }

    console.log('\n🎯 Updated all study buddy matches to ACTIVE status')

    // Final summary
    const finalMatches = await prisma.studyBuddyMatch.findMany({
      where: {
        OR: [
          { user1Id: fatma.id },
          { user2Id: fatma.id }
        ]
      },
      include: {
        user1: { select: { name: true, arabicName: true } },
        user2: { select: { name: true, arabicName: true } }
      }
    })

    const finalConversations = await prisma.conversation.findMany({
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
            user: { select: { name: true, arabicName: true } }
          }
        },
        _count: {
          select: { messages: true }
        }
      }
    })

    console.log('\n🎉 Final Summary for Fatma:')
    console.log(`📚 Study Buddy Matches: ${finalMatches.length}`)
    finalMatches.forEach(match => {
      const otherUser = match.user1Id === fatma.id ? match.user2 : match.user1
      console.log(`   - ${otherUser.name} (${otherUser.arabicName}) - ${match.status}`)
    })

    console.log(`\n💬 Active Conversations: ${finalConversations.length}`)
    finalConversations.forEach(conv => {
      const otherParticipant = conv.participants.find(p => p.userId !== fatma.id)
      if (otherParticipant) {
        console.log(`   - ${otherParticipant.user.name} (${conv._count.messages} messages)`)
      }
    })

    console.log('\n✅ Fatma is now ready for an awesome study buddy demo! 🚀')

  } catch (error) {
    console.error('❌ Error enhancing study buddy experience:', error)
  } finally {
    await prisma.$disconnect()
  }
}

enhanceFatmaStudyBuddyExperience()