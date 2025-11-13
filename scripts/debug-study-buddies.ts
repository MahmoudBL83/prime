import { prisma } from '../src/lib/prisma.js'

async function debugStudyBuddies() {
  console.log('🔍 Debugging Study Buddy Matches\n')

  // Check Fatma's data
  console.log('=== Checking Fatma User ===')
  const fatma = await prisma.user.findUnique({
    where: { email: 'fatma@demo.com' },
    include: {
      studyPreferences: true,
      studyBuddyMatches: true,
      studyBuddyMatches2: true
    }
  })

  if (!fatma) {
    console.log('❌ Fatma user not found!')
    return
  }

  console.log('✅ Fatma found:')
  console.log('- ID:', fatma.id)
  console.log('- Name:', fatma.name)
  console.log('- Role:', fatma.role)
  console.log('- Onboarding completed:', fatma.onboardingCompleted)
  console.log('- Interests:', fatma.interests?.substring(0, 100) + '...')
  console.log('- Goals:', fatma.goals?.substring(0, 100) + '...')
  console.log('- Skill Level:', fatma.skillLevel)
  console.log('- Has preferences:', !!fatma.studyPreferences)
  console.log('- Existing matches:', fatma.studyBuddyMatches.length + fatma.studyBuddyMatches2.length)

  // Check other learners
  console.log('\n=== Checking Other Learners ===')
  const otherLearners = await prisma.user.findMany({
    where: {
      role: 'LEARNER',
      onboardingCompleted: true,
      id: { not: fatma.id }
    },
    select: {
      id: true,
      name: true,
      email: true,
      interests: true,
      goals: true,
      skillLevel: true
    }
  })

  console.log('Other learners found:', otherLearners.length)
  otherLearners.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.skillLevel}`)
    if (user.interests) {
      console.log('   Interests:', user.interests.substring(0, 80) + '...')
    }
    if (user.goals) {
      console.log('   Goals:', user.goals.substring(0, 80) + '...')
    }
  })

  // Check existing matches to see what's being excluded
  console.log('\n=== Checking Existing Matches ===')
  const existingMatches = await prisma.studyBuddyMatch.findMany({
    where: {
      OR: [
        { user1Id: fatma.id },
        { user2Id: fatma.id }
      ]
    },
    include: {
      user1: { select: { name: true, email: true } },
      user2: { select: { name: true, email: true } }
    }
  })

  console.log('Existing matches for Fatma:', existingMatches.length)
  existingMatches.forEach((match, index) => {
    const otherUser = match.user1Id === fatma.id ? match.user2 : match.user1
    console.log(`${index + 1}. Match with ${otherUser.name} (${otherUser.email}) - Status: ${match.status}`)
  })

  // Test the matching algorithm manually
  console.log('\n=== Testing Enhanced Matching Algorithm ===')
  try {
    const { EnhancedMatchingService } = await import('../src/services/EnhancedMatchingService.js')
    const matches = await EnhancedMatchingService.findMatches(fatma.id, 10)
    console.log('Enhanced matching algorithm returned:', matches.length, 'matches')
    
    matches.forEach((match, index) => {
      const user = otherLearners.find(u => u.id === match.userId)
      if (user) {
        console.log(`${index + 1}. ${user.name} - Compatibility: ${match.totalScore}%`)
        console.log('   Shared interests:', match.sharedInterests.join(', '))
        console.log('   Shared goals:', match.sharedGoals.join(', '))
        console.log('   Reasons:', match.reasonsForMatch.slice(0, 2).join(', '))
      }
    })
  } catch (error) {
    console.error('❌ Error testing enhanced matching algorithm:', error.message)
  }

  await prisma.$disconnect()
}

debugStudyBuddies().catch(console.error)