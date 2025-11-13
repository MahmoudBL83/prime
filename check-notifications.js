// Quick script to check notifications table performance
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkNotifications() {
  try {
    console.log('🔍 Checking notifications table...')
    
    // Check total count
    const totalCount = await prisma.notification.count()
    console.log(`📊 Total notifications: ${totalCount.toLocaleString()}`)
    
    // Check unread count
    const unreadCount = await prisma.notification.count({
      where: { isRead: false }
    })
    console.log(`📨 Unread notifications: ${unreadCount.toLocaleString()}`)
    
    // Check recent notifications
    const recent = await prisma.notification.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        title: true,
        userId: true,
        isRead: true,
        createdAt: true
      }
    })
    console.log('📄 Recent notifications:')
    recent.forEach(n => {
      console.log(`  - ${n.type}: ${n.title} (${n.isRead ? 'read' : 'unread'})`)
    })
    
    // Check users with most notifications
    const userCounts = await prisma.notification.groupBy({
      by: ['userId'],
      _count: { userId: true },
      orderBy: { _count: { userId: 'desc' } },
      take: 5
    })
    console.log('👥 Users with most notifications:')
    userCounts.forEach(u => {
      console.log(`  - User ${u.userId}: ${u._count.userId} notifications`)
    })
    
    // Test query performance
    console.log('⚡ Testing query performance...')
    const start = Date.now()
    
    const testUserId = userCounts[0]?.userId || 'test'
    const testQuery = await prisma.notification.findMany({
      where: {
        userId: testUserId,
        isRead: false
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
    
    const duration = Date.now() - start
    console.log(`⏱️ Query took: ${duration}ms`)
    console.log(`📝 Found ${testQuery.length} unread notifications for user`)
    
    if (duration > 1000) {
      console.log('🚨 SLOW QUERY DETECTED!')
      console.log('💡 Recommendations:')
      console.log('   - Check if indexes are properly applied')
      console.log('   - Consider cleaning old notifications')
      console.log('   - Implement notification cleanup job')
    } else if (totalCount > 100000) {
      console.log('📈 Large table detected!')
      console.log('💡 Consider implementing notification cleanup')
    } else {
      console.log('✅ Query performance looks good!')
    }
    
  } catch (error) {
    console.error('❌ Error checking notifications:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkNotifications()