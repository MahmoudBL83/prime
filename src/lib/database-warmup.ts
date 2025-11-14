// Database warm-up utility to reduce cold start times
import { prisma } from '@/lib/prisma'

export async function warmUpDatabase() {
  try {
    console.log('Warming up database connections...')
    
    // Execute simple queries to establish connections and warm up indexes
    const warmUpPromises = [
      // Warm up Course queries
      prisma.course.findFirst({
        where: { status: 'PUBLISHED' },
        select: { id: true }
      }),
      
      // Warm up Creator queries  
      prisma.creator.findFirst({
        where: { kycStatus: 'VERIFIED' },
        select: { id: true }
      }),
      
      // Warm up Notification queries
      prisma.notification.findFirst({
        select: { id: true }
      }),
      
      // Test database connection
      prisma.$queryRaw`SELECT 1`
    ]
    
    await Promise.all(warmUpPromises)
    console.log('Database warm-up completed successfully')
    
    return true
  } catch (error) {
    console.error('Database warm-up failed:', error)
    return false
  }
}

// Optional: Auto warm-up on server start
if (process.env.NODE_ENV === 'production') {
  // Warm up database after a short delay on server start
  setTimeout(() => {
    warmUpDatabase()
  }, 5000) // 5 second delay
}
