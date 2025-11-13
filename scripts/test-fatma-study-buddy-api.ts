import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testStudyBuddyAPI() {
  try {
    console.log('🧪 Testing Study Buddy API for Fatma demo...')

    // Find Fatma
    const fatma = await prisma.user.findUnique({
      where: { email: 'fatma@demo.com' },
      select: {
        id: true,
        name: true,
        arabicName: true
      }
    })

    if (!fatma) {
      console.log('❌ Fatma not found!')
      return
    }

    console.log(`✅ Testing for user: ${fatma.name} (${fatma.arabicName})`)

    // Test 1: Get study buddy matches (simulate API call)
    const matches = await prisma.studyBuddyMatch.findMany({
      where: {
        OR: [
          { user1Id: fatma.id },
          { user2Id: fatma.id }
        ],
        status: 'ACTIVE'
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            arabicName: true,
            email: true,
            interests: true,
            skillLevel: true,
            profileImage: true
          }
        },
        user2: {
          select: {
            id: true,
            name: true,
            arabicName: true,
            email: true,
            interests: true,
            skillLevel: true,
            profileImage: true
          }
        }
      }
    })

    console.log(`\n📊 API Test Results:`)
    console.log(`🎯 Found ${matches.length} active study buddy matches`)

    matches.forEach((match, index) => {
      const otherUser = match.user1Id === fatma.id ? match.user2 : match.user1
      const sharedSubjects = match.sharedSubjects ? JSON.parse(match.sharedSubjects) : []
      const sharedGoals = match.sharedGoals ? JSON.parse(match.sharedGoals) : []
      
      console.log(`\n   ${index + 1}. ${otherUser.name} (${otherUser.arabicName})`)
      console.log(`      📧 ${otherUser.email}`)
      console.log(`      🎓 Level: ${otherUser.skillLevel}`)
      console.log(`      📚 Shared: ${sharedSubjects.join(', ') || 'None'}`)
      console.log(`      🎯 Goals: ${sharedGoals.join(', ') || 'None'}`)
      console.log(`      ✅ Status: ${match.status}`)
    })

    // Test 2: Check conversations with study buddies
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
          take: 1,
          select: {
            content: true,
            createdAt: true,
            sender: {
              select: {
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      }
    })

    console.log(`\n💬 Conversation Status:`)
    console.log(`📱 Found ${conversations.length} active conversations`)

    conversations.forEach((conv, index) => {
      const otherParticipant = conv.participants.find(p => p.userId !== fatma.id)
      const lastMessage = conv.messages[0]
      
      if (otherParticipant) {
        console.log(`\n   ${index + 1}. Chat with ${otherParticipant.user.name}`)
        console.log(`      💬 Messages: ${conv._count.messages}`)
        if (lastMessage) {
          console.log(`      💭 Last: "${lastMessage.content.substring(0, 50)}..." by ${lastMessage.sender.name}`)
          console.log(`      📅 When: ${lastMessage.createdAt.toLocaleString()}`)
        }
      }
    })

    // Test 3: Study buddy preferences
    const userWithPrefs = await prisma.user.findUnique({
      where: { id: fatma.id },
      select: {
        studyBuddyPreferences: true,
        interests: true,
        goals: true
      }
    })

    if (userWithPrefs?.studyBuddyPreferences) {
      const prefs = JSON.parse(userWithPrefs.studyBuddyPreferences)
      console.log(`\n⚙️ Study Buddy Preferences:`)
      console.log(`   ⏰ Times: ${prefs.preferredStudyTimes?.join(', ') || 'Not set'}`)
      console.log(`   📚 Subjects: ${prefs.preferredSubjects?.join(', ') || 'Not set'}`)
      console.log(`   🎨 Style: ${prefs.studyStyle || 'Not set'}`)
      console.log(`   💬 Communication: ${prefs.communicationPreference || 'Not set'}`)
    }

    console.log(`\n🎉 Study Buddy Demo Data Ready!`)
    console.log(`\n📋 Demo Script Talking Points:`)
    console.log(`   1. Login as fatma@demo.com`)
    console.log(`   2. Navigate to Study Buddy section`)
    console.log(`   3. Show ${matches.length} matched study partners`)
    console.log(`   4. Demonstrate messaging with study buddies`)
    console.log(`   5. Show shared interests and goals`)
    console.log(`   6. Highlight active conversations`)

    console.log(`\n✨ Perfect for showcasing collaborative learning features!`)

  } catch (error) {
    console.error('❌ Error testing study buddy API:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testStudyBuddyAPI()