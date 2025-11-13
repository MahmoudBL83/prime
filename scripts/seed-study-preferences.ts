import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedStudyPreferences() {
  try {
    console.log('🎯 Seeding study preferences...')

    // Get demo users
    const fatma = await prisma.user.findUnique({ where: { email: 'fatma@demo.com' } })
    const ahmed = await prisma.user.findUnique({ where: { email: 'ahmed@demo.com' } })
    const nour = await prisma.user.findUnique({ where: { email: 'nour@demo.com' } })

    if (!fatma || !ahmed || !nour) {
      console.log('❌ Demo users not found!')
      return
    }

    // Fatma's preferences (Beginner in tech, prefers structured learning)
    await prisma.studyPreferences.upsert({
      where: { userId: fatma.id },
      update: {},
      create: {
        userId: fatma.id,
        // Study Time Preferences
        preferredStudyTimes: JSON.stringify(['morning', 'evening']),
        timezone: 'Africa/Cairo',
        weeklyAvailability: {
          monday: ['09:00-11:00', '19:00-21:00'],
          tuesday: ['09:00-11:00', '19:00-21:00'],
          wednesday: ['09:00-11:00', '19:00-21:00'],
          thursday: ['09:00-11:00', '19:00-21:00'],
          friday: ['09:00-11:00'],
          saturday: ['10:00-12:00', '15:00-17:00'],
          sunday: ['10:00-12:00', '15:00-17:00']
        },
        studyDuration: 90,

        // Communication Preferences
        communicationStyle: 'mixed',
        responseTime: 'within_day',
        languagePreference: 'both',

        // Learning Style Preferences
        learningStyle: 'visual',
        studyEnvironment: 'quiet',
        sessionStructure: 'structured',

        // Subject and Skill Preferences
        subjectExpertise: ['Business', 'Arabic Language', 'Marketing'],
        subjectsToLearn: ['Programming', 'Web Development', 'JavaScript', 'React', 'Database Design'],
        skillLevelPreference: 'beginner',

        // Compatibility Preferences
        ageRangePreference: '26-35',
        genderPreference: 'any',
        locationPreference: 'same_country',

        // Study Goals and Methods
        studyGoalType: 'skill_building',
        studyMethodPreference: ['step_by_step_tutorials', 'practice_projects', 'code_reviews', 'pair_programming'],
        progressTracking: true,

        // Session Preferences
        groupSizePreference: 'one_on_one',
        sessionFrequency: 'weekly',

        // Notifications and Reminders
        reminderPreferences: {
          sessionReminders: true,
          matchNotifications: true,
          dailyDigest: true
        },
        quietHours: {
          enabled: true,
          startTime: '22:00',
          endTime: '08:00'
        }
      }
    })

    // Ahmed's preferences (Intermediate level, flexible approach)
    await prisma.studyPreferences.upsert({
      where: { userId: ahmed.id },
      update: {},
      create: {
        userId: ahmed.id,
        // Study Time Preferences
        preferredStudyTimes: JSON.stringify(['afternoon', 'evening']),
        timezone: 'Africa/Cairo',
        weeklyAvailability: {
          monday: ['14:00-16:00', '20:00-22:00'],
          tuesday: ['14:00-16:00', '20:00-22:00'],
          wednesday: ['14:00-16:00', '20:00-22:00'],
          thursday: ['14:00-16:00', '20:00-22:00'],
          friday: ['14:00-16:00'],
          saturday: ['09:00-12:00', '16:00-19:00'],
          sunday: ['09:00-12:00', '16:00-19:00']
        },
        studyDuration: 60,

        // Communication Preferences
        communicationStyle: 'video',
        responseTime: 'within_hour',
        languagePreference: 'both',

        // Learning Style Preferences
        learningStyle: 'mixed',
        studyEnvironment: 'background_music',
        sessionStructure: 'flexible',

        // Subject and Skill Preferences
        subjectExpertise: ['Business Strategy', 'Finance', 'Project Management', 'Excel'],
        subjectsToLearn: ['Data Analysis', 'Python', 'Machine Learning', 'SQL'],
        skillLevelPreference: 'intermediate',

        // Compatibility Preferences
        ageRangePreference: 'any',
        genderPreference: 'any',
        locationPreference: 'any',

        // Study Goals and Methods
        studyGoalType: 'project_work',
        studyMethodPreference: ['hands_on_projects', 'collaborative_coding', 'case_studies', 'problem_solving'],
        progressTracking: true,

        // Session Preferences
        groupSizePreference: 'flexible',
        sessionFrequency: 'bi_weekly',

        // Notifications and Reminders
        reminderPreferences: {
          sessionReminders: true,
          matchNotifications: true,
          dailyDigest: false
        },
        quietHours: {
          enabled: false,
          startTime: '23:00',
          endTime: '07:00'
        }
      }
    })

    // Nour's preferences (Tech-savvy, prefers discussion-based learning)
    await prisma.studyPreferences.upsert({
      where: { userId: nour.id },
      update: {},
      create: {
        userId: nour.id,
        // Study Time Preferences
        preferredStudyTimes: JSON.stringify(['morning', 'afternoon']),
        timezone: 'Africa/Cairo',
        weeklyAvailability: {
          monday: ['08:00-10:00', '13:00-15:00'],
          tuesday: ['08:00-10:00', '13:00-15:00'],
          wednesday: ['08:00-10:00', '13:00-15:00'],
          thursday: ['08:00-10:00', '13:00-15:00'],
          friday: ['08:00-10:00'],
          saturday: ['09:00-11:00', '14:00-16:00'],
          sunday: ['09:00-11:00', '14:00-16:00']
        },
        studyDuration: 120,

        // Communication Preferences
        communicationStyle: 'text',
        responseTime: 'flexible',
        languagePreference: 'english',

        // Learning Style Preferences
        learningStyle: 'auditory',
        studyEnvironment: 'collaborative',
        sessionStructure: 'discussion_based',

        // Subject and Skill Preferences
        subjectExpertise: ['JavaScript', 'React', 'Node.js', 'Database Design', 'API Development'],
        subjectsToLearn: ['Advanced React', 'TypeScript', 'DevOps', 'System Design', 'Cloud Computing'],
        skillLevelPreference: 'advanced',

        // Compatibility Preferences
        ageRangePreference: '18-25',
        genderPreference: 'any',
        locationPreference: 'same_city',

        // Study Goals and Methods
        studyGoalType: 'skill_building',
        studyMethodPreference: ['peer_discussion', 'code_review', 'whiteboard_sessions', 'technical_debates'],
        progressTracking: true,

        // Session Preferences
        groupSizePreference: 'small_group',
        sessionFrequency: 'weekly',

        // Notifications and Reminders
        reminderPreferences: {
          sessionReminders: true,
          matchNotifications: false,
          dailyDigest: false
        },
        quietHours: {
          enabled: true,
          startTime: '21:00',
          endTime: '09:00'
        }
      }
    })

    console.log('✅ Study preferences seeded successfully!')
    console.log('👤 Preferences created for:')
    console.log('   - Fatma: Beginner, structured learning, visual learner')
    console.log('   - Ahmed: Intermediate, flexible approach, video communication')
    console.log('   - Nour: Advanced, discussion-based, collaborative environment')

  } catch (error) {
    console.error('❌ Error seeding study preferences:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedStudyPreferences()