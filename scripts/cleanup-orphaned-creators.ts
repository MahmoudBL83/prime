import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupOrphanedCreators() {
  console.log('Starting cleanup of orphaned Creator records...')
  
  try {
    // Find all creators
    const allCreators = await prisma.creator.findMany({
      include: {
        user: true
      }
    })
    
    console.log(`Found ${allCreators.length} total creators`)
    
    // Find creators without valid user relations
    const orphanedCreators = allCreators.filter(c => c.user === null)
    
    console.log(`Found ${orphanedCreators.length} orphaned creators`)
    
    if (orphanedCreators.length > 0) {
      console.log('Orphaned creator IDs:', orphanedCreators.map(c => c.id))
      
      // Delete orphaned creators
      const deleteResult = await prisma.creator.deleteMany({
        where: {
          id: {
            in: orphanedCreators.map(c => c.id)
          }
        }
      })
      
      console.log(`✅ Deleted ${deleteResult.count} orphaned creators`)
    } else {
      console.log('✅ No orphaned creators found')
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

cleanupOrphanedCreators()
  .then(() => {
    console.log('Cleanup completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Cleanup failed:', error)
    process.exit(1)
  })
