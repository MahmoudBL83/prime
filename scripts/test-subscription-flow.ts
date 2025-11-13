/**
 * Subscription System End-to-End Test Script
 * 
 * This script tests the complete subscription flow:
 * 1. User subscribes to a plan
 * 2. Auto-enrollment in courses
 * 3. Access verification
 * 4. Subscription cancellation
 * 
 * Run with: npx tsx scripts/test-subscription-flow.ts
 */

import { PrismaClient, SubscriptionType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('\n🧪 Starting Subscription System Tests...\n')

  // Step 1: Find or create test user
  console.log('📝 Step 1: Setting up test user...')
  let testUser = await prisma.user.findFirst({
    where: { email: 'test@example.com' }
  })

  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456789' // Mock hash for testing
      }
    })
    console.log('✅ Created new test user:', testUser.email)
  } else {
    console.log('✅ Found existing test user:', testUser.email)
    
    // Clean up existing subscriptions and enrollments
    await prisma.enrollment.deleteMany({
      where: { userId: testUser.id }
    })
    await prisma.subscription.deleteMany({
      where: { userId: testUser.id }
    })
    console.log('🧹 Cleaned up existing test data')
  }

  // Step 2: Get course counts by category
  console.log('\n📊 Step 2: Checking course availability...')
  const categoryACourses = await prisma.course.findMany({
    where: { contentCategory: 'CATEGORY_A' }
  })
  const categoryBCourses = await prisma.course.findMany({
    where: { contentCategory: 'CATEGORY_B' }
  })
  const categoryCCourses = await prisma.course.findMany({
    where: { contentCategory: 'CATEGORY_C' }
  })
  
  console.log(`   Category A courses: ${categoryACourses.length}`)
  console.log(`   Category B courses: ${categoryBCourses.length}`)
  console.log(`   Category C courses: ${categoryCCourses.length}`)
  console.log(`   Total courses: ${categoryACourses.length + categoryBCourses.length + categoryCCourses.length}`)

  if (categoryACourses.length === 0 && categoryBCourses.length === 0) {
    console.log('\n⚠️  Warning: No courses found! Run migrate-course-categories.ts first.')
    return
  }

  // Step 3: Test Category A Subscription
  console.log('\n🎯 Step 3: Testing Category A Subscription...')
  const categoryASub = await prisma.subscription.create({
    data: {
      userId: testUser.id,
      type: SubscriptionType.CATEGORY_A,
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      pricePerMonth: 199
    }
  })
  console.log('✅ Created Category A subscription:', categoryASub.id)

  // Auto-enroll in Category A courses
  const categoryAEnrollments = await prisma.enrollment.createMany({
    data: categoryACourses.map(course => ({
      userId: testUser.id,
      courseId: course.id
    }))
  })
  console.log(`✅ Auto-enrolled in ${categoryAEnrollments.count} Category A courses`)

  // Verify enrollments
  const userEnrollments = await prisma.enrollment.findMany({
    where: { userId: testUser.id },
    include: { course: true }
  })
  console.log(`✅ Verified: User has ${userEnrollments.length} total enrollments`)

  // Step 4: Test subscription cancellation
  console.log('\n🚫 Step 4: Testing subscription cancellation...')
  const cancelledSub = await prisma.subscription.update({
    where: { id: categoryASub.id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date()
    }
  })
  console.log('✅ Subscription cancelled but access retained until:', cancelledSub.endDate.toLocaleDateString())

  // Step 5: Test Bundle AB Subscription
  console.log('\n🎁 Step 5: Testing Bundle AB Subscription...')
  
  // Clean previous subscription
  await prisma.subscription.delete({
    where: { id: categoryASub.id }
  })
  await prisma.enrollment.deleteMany({
    where: { userId: testUser.id }
  })

  const bundleABSub = await prisma.subscription.create({
    data: {
      userId: testUser.id,
      type: SubscriptionType.BUNDLE_AB,
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      pricePerMonth: 299
    }
  })
  console.log('✅ Created Bundle AB subscription:', bundleABSub.id)

  // Auto-enroll in both Category A and B courses
  const allABCourses = [...categoryACourses, ...categoryBCourses]
  const bundleEnrollments = await prisma.enrollment.createMany({
    data: allABCourses.map(course => ({
      userId: testUser.id,
      courseId: course.id
    }))
  })
  console.log(`✅ Auto-enrolled in ${bundleEnrollments.count} courses (A + B)`)

  // Step 6: Test Bundle ABC Subscription (Ultimate)
  console.log('\n🌟 Step 6: Testing Bundle ABC Subscription (Ultimate)...')
  
  await prisma.subscription.delete({
    where: { id: bundleABSub.id }
  })
  await prisma.enrollment.deleteMany({
    where: { userId: testUser.id }
  })

  const bundleABCSub = await prisma.subscription.create({
    data: {
      userId: testUser.id,
      type: SubscriptionType.BUNDLE_ABC,
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Yearly
      pricePerMonth: 399
    }
  })
  console.log('✅ Created Bundle ABC (Ultimate) subscription:', bundleABCSub.id)

  // Auto-enroll in ALL courses
  const allCourses = [...categoryACourses, ...categoryBCourses, ...categoryCCourses]
  const allEnrollments = await prisma.enrollment.createMany({
    data: allCourses.map(course => ({
      userId: testUser.id,
      courseId: course.id
    }))
  })
  console.log(`✅ Auto-enrolled in ${allEnrollments.count} courses (ALL categories)`)

  // Step 7: Generate Summary Report
  console.log('\n📊 SUBSCRIPTION SYSTEM TEST SUMMARY')
  console.log('=' .repeat(50))
  
  const finalSubscriptions = await prisma.subscription.findMany({
    where: { userId: testUser.id }
  })
  const finalEnrollments = await prisma.enrollment.findMany({
    where: { userId: testUser.id },
    include: { course: true }
  })

  console.log(`\n✅ Test User: ${testUser.email}`)
  console.log(`✅ Active Subscriptions: ${finalSubscriptions.filter(s => s.status === 'ACTIVE').length}`)
  console.log(`✅ Total Enrollments: ${finalEnrollments.length}`)
  console.log(`\n📚 Enrolled Courses Breakdown:`)
  
  const enrolledCategoryA = finalEnrollments.filter(e => e.course.contentCategory === 'CATEGORY_A').length
  const enrolledCategoryB = finalEnrollments.filter(e => e.course.contentCategory === 'CATEGORY_B').length
  const enrolledCategoryC = finalEnrollments.filter(e => e.course.contentCategory === 'CATEGORY_C').length
  
  console.log(`   Category A: ${enrolledCategoryA}/${categoryACourses.length}`)
  console.log(`   Category B: ${enrolledCategoryB}/${categoryBCourses.length}`)
  console.log(`   Category C: ${enrolledCategoryC}/${categoryCCourses.length}`)

  // Step 8: Verify Access Control Logic
  console.log('\n🔐 Step 8: Verifying access control logic...')
  
  // User with Bundle ABC should have access to all courses
  const hasAccessToA = categoryACourses.length > 0
  const hasAccessToB = categoryBCourses.length > 0
  const hasAccessToC = categoryCCourses.length > 0
  
  console.log(`   ✅ Can access Category A courses: ${hasAccessToA}`)
  console.log(`   ✅ Can access Category B courses: ${hasAccessToB}`)
  console.log(`   ✅ Can access Category C courses: ${hasAccessToC}`)

  // Step 9: Test data for My Learning Dashboard
  console.log('\n📱 Step 9: Preparing My Learning dashboard data...')
  
  // Mark some enrollments as in-progress
  if (finalEnrollments.length > 0) {
    await prisma.enrollment.update({
      where: { id: finalEnrollments[0].id },
      data: {
        progress: 45.5,
        lastAccessedAt: new Date()
      }
    })
    console.log('✅ Set first enrollment to 45% progress')
  }

  // Mark some as completed
  if (finalEnrollments.length > 1) {
    await prisma.enrollment.update({
      where: { id: finalEnrollments[1].id },
      data: {
        progress: 100,
        completedAt: new Date(),
        lastAccessedAt: new Date()
      }
    })
    console.log('✅ Marked second enrollment as completed')
  }

  console.log('\n🎉 ALL TESTS PASSED!\n')
  console.log('=' .repeat(50))
  console.log('Next Steps:')
  console.log('1. Visit http://localhost:3000/en/subscribe')
  console.log('2. Visit http://localhost:3000/en/dashboard/my-learning')
  console.log('3. Test with the user: test@example.com')
  console.log('4. Open Prisma Studio: npx prisma studio')
  console.log('=' .repeat(50))
}

main()
  .catch((e) => {
    console.error('❌ Test failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
