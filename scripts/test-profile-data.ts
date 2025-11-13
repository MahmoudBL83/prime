import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testProfileData() {
  try {
    console.log('🔍 Testing profile data availability...')
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        arabicName: true,
        role: true,
        interests: true,
        goals: true,
        skillLevel: true,
        learningMode: true,
        emailVerified: true,
        createdAt: true,
        enrollments: {
          select: {
            courseId: true,
            progress: true,
            completedAt: true
          }
        },
        subscriptions: {
          where: {
            status: 'ACTIVE'
          }
        }
      },
      take: 5
    })

    console.log(`\n📊 Found ${users.length} users for profile testing`)

    users.forEach((user, index) => {
      console.log(`\n👤 User ${index + 1}:`)
      console.log(`  Name: ${user.name}`)
      console.log(`  Email: ${user.email}`)
      console.log(`  Role: ${user.role}`)
      console.log(`  Arabic Name: ${user.arabicName || 'Not set'}`)
      console.log(`  Skill Level: ${user.skillLevel || 'Not set'}`)
      console.log(`  Learning Mode: ${user.learningMode || 'Not set'}`)
      console.log(`  Email Verified: ${user.emailVerified}`)
      console.log(`  Enrollments: ${user.enrollments.length}`)
      console.log(`  Active Subscriptions: ${user.subscriptions.length}`)
      console.log(`  Interests: ${user.interests || 'None'}`)
      console.log(`  Goals: ${user.goals || 'None'}`)
      
      if (user.enrollments.length > 0) {
        const avgProgress = user.enrollments.reduce((acc, e) => acc + e.progress, 0) / user.enrollments.length
        const completed = user.enrollments.filter(e => e.completedAt).length
        console.log(`  Average Progress: ${Math.round(avgProgress)}%`)
        console.log(`  Completed Courses: ${completed}`)
      }
    })

    console.log('\n✅ Profile data test completed!')

  } catch (error) {
    console.error('❌ Error testing profile data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testProfileData()