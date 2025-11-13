import { prisma } from '../src/lib/prisma.js'
import bcrypt from 'bcryptjs'

async function fixStudyBuddyDemo() {
  console.log('🔧 Fixing Study Buddy Demo Data\n')

  // Fix Fatma's onboarding status
  console.log('=== Updating Fatma\'s Onboarding Status ===')
  const fatma = await prisma.user.update({
    where: { email: 'fatma@demo.com' },
    data: { onboardingCompleted: true }
  })
  console.log('✅ Fatma onboarding completed set to true')

  // Create additional demo learners if they don't exist
  console.log('\n=== Creating Additional Demo Learners ===')
  
  const demoUsers = [
    {
      email: 'mariam@demo.com',
      name: 'Mariam Othman',
      arabicName: 'مريم عثمان',
      interests: JSON.stringify(['Mathematics', 'Physics', 'Engineering', 'Problem Solving']),
      goals: JSON.stringify(['University Preparation', 'STEM Excellence', 'Career in Engineering']),
      skillLevel: 'Intermediate',
      learningMode: 'SELF_PACED',
      bio: 'Passionate about STEM subjects and helping others excel in mathematics and physics.',
      onboardingCompleted: true
    },
    {
      email: 'kareem@demo.com',
      name: 'Kareem Hassan',
      arabicName: 'كريم حسن',
      interests: JSON.stringify(['Programming', 'Web Development', 'Technology', 'Innovation']),
      goals: JSON.stringify(['Full Stack Development', 'Career Change into Tech', 'Startup Creation']),
      skillLevel: 'Beginner',
      learningMode: 'STRUCTURED',
      bio: 'Beginner programmer eager to learn web development and build innovative solutions.',
      onboardingCompleted: true
    },
    {
      email: 'layla@demo.com',
      name: 'Layla Farouk',
      arabicName: 'ليلى فاروق',
      interests: JSON.stringify(['Business', 'Marketing', 'Entrepreneurship', 'Communication']),
      goals: JSON.stringify(['Business Development', 'Marketing Expertise', 'Leadership Skills']),
      skillLevel: 'Advanced',
      learningMode: 'COLLABORATIVE',
      bio: 'Business enthusiast with experience in marketing and a passion for entrepreneurship.',
      onboardingCompleted: true
    },
    {
      email: 'omar@demo.com',
      name: 'Omar Sayed',
      arabicName: 'عمر سيد',
      interests: JSON.stringify(['Programming', 'Data Science', 'AI', 'Machine Learning']),
      goals: JSON.stringify(['AI Specialization', 'Data Analysis Skills', 'Tech Leadership']),
      skillLevel: 'Intermediate',
      learningMode: 'SELF_PACED',
      bio: 'Data science enthusiast exploring AI and machine learning applications.',
      onboardingCompleted: true
    },
    {
      email: 'yasmin@demo.com',
      name: 'Yasmin Ali',
      arabicName: 'ياسمين علي',
      interests: JSON.stringify(['Design', 'Technology', 'User Experience', 'Creative Problem Solving']),
      goals: JSON.stringify(['UX Design Mastery', 'Creative Skills', 'Digital Innovation']),
      skillLevel: 'Beginner',
      learningMode: 'STRUCTURED',
      bio: 'Creative mind interested in UX design and digital innovation.',
      onboardingCompleted: true
    }
  ]

  const password = await bcrypt.hash('demo123', 12)

  for (const userData of demoUsers) {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      })

      if (!existingUser) {
        const user = await prisma.user.create({
          data: {
            ...userData,
            passwordHash: password,
            role: 'LEARNER',
            emailVerified: new Date()
          }
        })

        // Create study preferences for each user
        await prisma.studyPreferences.create({
          data: {
            userId: user.id,
            preferredStudyTimes: JSON.stringify(['morning', 'evening']),
            timezone: 'Africa/Cairo',
            weeklyAvailability: JSON.stringify({
              monday: ['09:00-12:00', '19:00-21:00'],
              tuesday: ['09:00-12:00', '19:00-21:00'],
              wednesday: ['09:00-12:00', '19:00-21:00'],
              thursday: ['09:00-12:00', '19:00-21:00'],
              friday: ['14:00-17:00'],
              saturday: ['09:00-17:00'],
              sunday: ['09:00-17:00']
            }),
            studyDuration: 120,
            communicationStyle: ['chat', 'voice'],
            responseTime: 'within_hour',
            languagePreference: ['Arabic', 'English'],
            learningStyle: userData.learningMode === 'COLLABORATIVE' ? 'group_discussions' : 'visual_learning',
            studyEnvironment: 'quiet_space',
            sessionStructure: 'structured',
            subjectExpertise: userData.interests,
            subjectsToLearn: userData.goals,
            skillLevelPreference: 'any',
            ageRangePreference: '18-35',
            genderPreference: 'any',
            locationPreference: 'Egypt',
            studyGoalType: 'skill_building',
            studyMethodPreference: 'collaborative',
            progressTracking: true,
            groupSizePreference: 'small_group',
            sessionFrequency: 'weekly',
            reminderPreferences: JSON.stringify(['email', 'in_app']),
            quietHours: JSON.stringify(['22:00-07:00'])
          }
        })

        console.log(`✅ Created user: ${userData.name} (${userData.email})`)
      } else {
        // Update existing user to ensure onboarding is completed
        await prisma.user.update({
          where: { email: userData.email },
          data: { onboardingCompleted: true }
        })
        console.log(`✅ Updated existing user: ${userData.name} (${userData.email})`)
      }
    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error.message)
    }
  }

  // Verify the fix
  console.log('\n=== Verification ===')
  const learners = await prisma.user.findMany({
    where: {
      role: 'LEARNER',
      onboardingCompleted: true
    },
    select: {
      name: true,
      email: true,
      skillLevel: true
    }
  })

  console.log(`✅ Total learners with completed onboarding: ${learners.length}`)
  learners.forEach(learner => {
    console.log(`- ${learner.name} (${learner.email}) - ${learner.skillLevel}`)
  })

  await prisma.$disconnect()
  console.log('\n🎉 Study buddy demo data fixed!')
}

fixStudyBuddyDemo().catch(console.error)