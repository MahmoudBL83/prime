import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  stepKey: z.string().min(2),
  data: z.record(z.string(), z.any()).optional(),
  completed: z.boolean().optional(),
  locale: z.string().min(2).max(5).optional()
})

const STEP_ORDER = ['profile', 'interests', 'goals', 'learning', 'study-buddy', 'safety']

const buildDefaultSteps = () => {
  const timestamp = new Date().toISOString()
  return STEP_ORDER.map((key) => ({
    key,
    title: stepTitle(key),
    completed: false,
    data: {},
    lastUpdated: timestamp
  }))
}

const stepTitle = (key: string) => {
  switch (key) {
    case 'profile':
      return 'Profile Basics'
    case 'interests':
      return 'Interests'
    case 'goals':
      return 'Goals'
    case 'learning':
      return 'Learning Preferences'
    case 'study-buddy':
      return 'Study Buddy Matching'
    case 'safety':
      return 'Safety & Guardian'
    default:
      return key
  }
}

const normalizeSteps = (rawSteps: any): any[] => {
  const existing = Array.isArray(rawSteps) ? rawSteps : []
  const normalized = [...existing]

  STEP_ORDER.forEach((key) => {
    if (!normalized.find((step) => step?.key === key)) {
      normalized.push({
        key,
        title: stepTitle(key),
        completed: false,
        data: {},
        lastUpdated: new Date().toISOString()
      })
    }
  })

  return normalized
}

const ensureProgress = async (userId: string) => {
  const existing = await prisma.onboardingProgress.findUnique({ where: { userId } })
  if (existing) {
    return existing
  }

  return prisma.onboardingProgress.create({
    data: {
      userId,
      steps: buildDefaultSteps(),
      lastStep: 'profile'
    }
  })
}

const needsGuardian = (ageValue?: string | null) => {
  if (!ageValue) return false
  const parsed = Number(ageValue)
  if (Number.isNaN(parsed)) return false
  return parsed < 18
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const [userRecord, progressRecord] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { age: true, onboardingCompleted: true }
      }),
      ensureProgress(userId)
    ])

    let normalizedSteps = normalizeSteps(progressRecord.steps as any[])

    if (JSON.stringify(progressRecord.steps) !== JSON.stringify(normalizedSteps)) {
      normalizedSteps = normalizeSteps(progressRecord.steps as any[])
      await prisma.onboardingProgress.update({
        where: { userId },
        data: { steps: normalizedSteps }
      })
    }

    const [guardianLink, guardianVerification] = await Promise.all([
      prisma.guardianLink.findFirst({
        where: {
          userId,
          status: { in: ['PENDING', 'VERIFIED'] }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.userVerification.findFirst({
        where: { userId, type: 'GUARDIAN' },
        orderBy: { createdAt: 'desc' }
      })
    ])

    const guardianRequired = needsGuardian(userRecord?.age)

    return NextResponse.json({
      progress: {
        ...progressRecord,
        steps: normalizedSteps
      },
      guardianRequired,
      guardianLink,
      guardianVerification,
      onboardingCompleted: userRecord?.onboardingCompleted || false
    })
  } catch (error) {
    console.error('Onboarding status error:', error)
    return NextResponse.json(
      { error: 'Failed to load onboarding status' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { stepKey, data, completed, locale } = parsed.data
    const userId = session.user.id

    const progressRecord = await ensureProgress(userId)
    const steps = normalizeSteps(progressRecord.steps as any[])
    const timestamp = new Date().toISOString()

    const existingIndex = steps.findIndex((step) => step.key === stepKey)

    if (existingIndex >= 0) {
      steps[existingIndex] = {
        ...steps[existingIndex],
        completed: typeof completed === 'boolean' ? completed : steps[existingIndex].completed,
        data: data ? { ...steps[existingIndex].data, ...data } : steps[existingIndex].data,
        lastUpdated: timestamp
      }
    } else {
      steps.push({
        key: stepKey,
        title: stepTitle(stepKey),
        completed: completed ?? false,
        data: data || {},
        lastUpdated: timestamp
      })
    }

    const allCompleted = steps.every((step) => step.completed)

    const updatedProgress = await prisma.onboardingProgress.update({
      where: { userId },
      data: {
        steps,
        lastStep: stepKey,
        lastCheckpoint: new Date(),
        locale: locale || progressRecord.locale || 'en',
        completed: allCompleted,
        completedAt: allCompleted ? new Date() : null
      }
    })

    if (allCompleted && !progressRecord.completed) {
      await prisma.user.update({
        where: { id: userId },
        data: { onboardingCompleted: true }
      })
    }

    return NextResponse.json({
      progress: updatedProgress,
      completed: allCompleted
    })
  } catch (error) {
    console.error('Onboarding update error:', error)
    return NextResponse.json(
      { error: 'Failed to update onboarding status' },
      { status: 500 }
    )
  }
}
