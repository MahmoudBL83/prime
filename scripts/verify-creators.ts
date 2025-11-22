import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyCreators() {
  try {
    const creators = await prisma.creator.findMany({
      include: { user: true },
      take: 5
    })
    
    console.log(`\nCreators found: ${creators.length}`)
    creators.forEach(c => {
      console.log(`  - ${c.user?.name || 'NO USER'} (userId: ${c.userId})`)
    })
    
    const orphaned = creators.filter(c => !c.user)
    if (orphaned.length > 0) {
      console.log(`\n❌ Found ${orphaned.length} orphaned creators!`)
    } else {
      console.log('\n✅ All creators have valid user relations!')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyCreators()
