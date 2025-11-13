import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testMessagingSystem() {
  try {
    console.log('🔍 Testing messaging system...')
    
    // Check users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
      take: 5
    })
    
    console.log('\n👥 Available Users:')
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.id}) - ${user.email}`)
    })
    
    // Check conversations
    const conversations = await prisma.conversation.findMany({
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      }
    })
    
    console.log('\n💬 Existing Conversations:')
    if (conversations.length === 0) {
      console.log('  No conversations found')
    } else {
      conversations.forEach(conv => {
        console.log(`\n  📋 Conversation ${conv.id} (${conv.type})`)
        console.log(`     Participants:`)
        conv.participants.forEach(p => {
          console.log(`       - ${p.user.name} (${p.user.id}) - Role: ${p.role}`)
        })
        if (conv.messages.length > 0) {
          const lastMsg = conv.messages[0]
          console.log(`     Last message: "${lastMsg.content}" by ${lastMsg.sender.name}`)
        } else {
          console.log('     No messages yet')
        }
      })
    }
    
    // Create a test conversation if we have at least 2 users and no conversations
    if (users.length >= 2 && conversations.length === 0) {
      console.log('\n🛠️  Creating test conversation...')
      
      const testConversation = await prisma.conversation.create({
        data: {
          type: 'DIRECT',
          participants: {
            create: [
              {
                userId: users[0].id,
                role: 'ADMIN',
              },
              {
                userId: users[1].id,
                role: 'MEMBER',
              }
            ]
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                }
              }
            }
          }
        }
      })
      
      console.log(`✅ Created test conversation: ${testConversation.id}`)
      console.log(`   Between: ${users[0].name} and ${users[1].name}`)
      
      // Add a test message
      const testMessage = await prisma.message.create({
        data: {
          conversationId: testConversation.id,
          senderId: users[0].id,
          content: 'Hello! This is a test message from the system.',
          messageType: 'TEXT'
        }
      })
      
      console.log(`📝 Added test message: "${testMessage.content}"`)
    }
    
    console.log('\n🎉 Messaging system test completed!')
    
  } catch (error) {
    console.error('❌ Error testing messaging system:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testMessagingSystem()