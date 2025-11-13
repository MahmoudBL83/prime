import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixConversationParticipants() {
  try {
    console.log('🔧 Fixing conversation participants...')
    
    // Find conversations with missing or inactive participants
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
        }
      }
    })
    
    console.log(`\n📋 Found ${conversations.length} conversations`)
    
    for (const conv of conversations) {
      console.log(`\n🔍 Checking conversation ${conv.id}`)
      console.log(`   Type: ${conv.type}`)
      console.log(`   Participants count: ${conv.participants.length}`)
      
      if (conv.participants.length === 0) {
        console.log(`⚠️  Conversation ${conv.id} has no participants - attempting to clean up`)
        
        try {
          // First delete any related data
          await prisma.message.deleteMany({
            where: { conversationId: conv.id }
          })
          
          await prisma.group.deleteMany({
            where: { conversationId: conv.id }
          })
          
          // Then delete the conversation
          await prisma.conversation.delete({
            where: { id: conv.id }
          })
          console.log(`🗑️  Deleted empty conversation ${conv.id}`)
        } catch (deleteError) {
          console.error(`❌ Failed to delete conversation ${conv.id}:`, deleteError)
        }
      } else {
        conv.participants.forEach(p => {
          console.log(`   - ${p.user.name} (${p.user.id}) - Active: ${p.isActive}`)
        })
      }
    }
    
    // Get final count
    const finalCount = await prisma.conversation.count()
    console.log(`\n✅ Final conversation count: ${finalCount}`)
    
  } catch (error) {
    console.error('❌ Error fixing participants:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixConversationParticipants()