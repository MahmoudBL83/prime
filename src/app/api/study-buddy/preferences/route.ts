import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const studyPreferencesSchema = z.object({
  // Study Time Preferences
  preferredStudyTimes: z.array(z.string()).optional(),
  timezone: z.string().optional(),
  weeklyAvailability: z.object({
    monday: z.array(z.string()).optional(),
    tuesday: z.array(z.string()).optional(),
    wednesday: z.array(z.string()).optional(),
    thursday: z.array(z.string()).optional(),
    friday: z.array(z.string()).optional(),
    saturday: z.array(z.string()).optional(),
    sunday: z.array(z.string()).optional(),
  }).optional(),
  studyDuration: z.number().min(15).max(240).optional(),

  // Communication Preferences
  communicationStyle: z.enum(['text', 'voice', 'video', 'mixed']).optional(),
  responseTime: z.enum(['immediate', 'within_hour', 'within_day', 'flexible']).optional(),
  languagePreference: z.enum(['arabic', 'english', 'both']).optional(),

  // Learning Style Preferences
  learningStyle: z.enum(['visual', 'auditory', 'kinesthetic', 'reading', 'mixed']).optional(),
  studyEnvironment: z.enum(['quiet', 'background_music', 'collaborative', 'flexible']).optional(),
  sessionStructure: z.enum(['structured', 'flexible', 'discussion_based', 'problem_solving']).optional(),

  // Subject and Skill Preferences
  subjectExpertise: z.array(z.string()).optional(),
  subjectsToLearn: z.array(z.string()).optional(),
  skillLevelPreference: z.enum(['beginner', 'intermediate', 'advanced', 'mixed']).optional(),

  // Compatibility Preferences
  ageRangePreference: z.enum(['18-25', '26-35', '36-45', '46+', 'any']).optional(),
  genderPreference: z.enum(['any', 'same', 'different']).optional(),
  locationPreference: z.enum(['same_city', 'same_country', 'any']).optional(),

  // Study Goals and Methods
  studyGoalType: z.enum(['exam_prep', 'skill_building', 'project_work', 'general_learning']).optional(),
  studyMethodPreference: z.array(z.string()).optional(),
  progressTracking: z.boolean().optional(),

  // Session Preferences
  groupSizePreference: z.enum(['one_on_one', 'small_group', 'large_group', 'flexible']).optional(),
  sessionFrequency: z.enum(['daily', 'weekly', 'bi_weekly', 'monthly', 'flexible']).optional(),

  // Notifications and Reminders
  reminderPreferences: z.object({
    sessionReminders: z.boolean().optional(),
    matchNotifications: z.boolean().optional(),
    dailyDigest: z.boolean().optional(),
  }).optional(),
  quietHours: z.object({
    enabled: z.boolean().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const preferences = await prisma.studyPreferences.findUnique({
      where: { userId: session.user.id }
    })

    if (!preferences) {
      // Return default preferences if none exist
      return NextResponse.json({
        preferences: {
          studyDuration: 60,
          communicationStyle: 'mixed',
          responseTime: 'flexible',
          languagePreference: 'both',
          learningStyle: 'mixed',
          studyEnvironment: 'flexible',
          sessionStructure: 'flexible',
          skillLevelPreference: 'mixed',
          ageRangePreference: 'any',
          genderPreference: 'any',
          locationPreference: 'any',
          studyGoalType: 'general_learning',
          progressTracking: true,
          groupSizePreference: 'flexible',
          sessionFrequency: 'weekly',
          timezone: 'UTC',
        }
      })
    }

    // Parse JSON fields
    const formattedPreferences = {
      ...preferences,
      preferredStudyTimes: preferences.preferredStudyTimes ? JSON.parse(preferences.preferredStudyTimes) : [],
      weeklyAvailability: preferences.weeklyAvailability || {},
      subjectExpertise: preferences.subjectExpertise || [],
      subjectsToLearn: preferences.subjectsToLearn || [],
      studyMethodPreference: preferences.studyMethodPreference || [],
      reminderPreferences: preferences.reminderPreferences || {},
      quietHours: preferences.quietHours || {},
    }

    return NextResponse.json({ preferences: formattedPreferences })

  } catch (error) {
    console.error('Get study preferences error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch study preferences' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validation = studyPreferencesSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues },
        { status: 400 }
      )
    }

    const data = validation.data

    // Prepare data for database
    const preferencesData = {
      userId: session.user.id,
      preferredStudyTimes: data.preferredStudyTimes ? JSON.stringify(data.preferredStudyTimes) : null,
      timezone: data.timezone || 'UTC',
      weeklyAvailability: data.weeklyAvailability || {},
      studyDuration: data.studyDuration || 60,
      communicationStyle: data.communicationStyle || 'mixed',
      responseTime: data.responseTime || 'flexible',
      languagePreference: data.languagePreference || 'both',
      learningStyle: data.learningStyle || 'mixed',
      studyEnvironment: data.studyEnvironment || 'flexible',
      sessionStructure: data.sessionStructure || 'flexible',
      subjectExpertise: data.subjectExpertise || [],
      subjectsToLearn: data.subjectsToLearn || [],
      skillLevelPreference: data.skillLevelPreference || 'mixed',
      ageRangePreference: data.ageRangePreference || 'any',
      genderPreference: data.genderPreference || 'any',
      locationPreference: data.locationPreference || 'any',
      studyGoalType: data.studyGoalType || 'general_learning',
      studyMethodPreference: data.studyMethodPreference || [],
      progressTracking: data.progressTracking !== undefined ? data.progressTracking : true,
      groupSizePreference: data.groupSizePreference || 'flexible',
      sessionFrequency: data.sessionFrequency || 'weekly',
      reminderPreferences: data.reminderPreferences || {},
      quietHours: data.quietHours || {},
    }

    // Upsert preferences
    const preferences = await prisma.studyPreferences.upsert({
      where: { userId: session.user.id },
      update: preferencesData,
      create: preferencesData,
    })

    return NextResponse.json({
      message: 'Study preferences saved successfully',
      preferences
    })

  } catch (error) {
    console.error('Save study preferences error:', error)
    return NextResponse.json(
      { error: 'Failed to save study preferences' },
      { status: 500 }
    )
  }
}