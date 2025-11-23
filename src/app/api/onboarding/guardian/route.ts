import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { randomBytes } from 'crypto'

const guardianSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(6).max(32).optional(),
  relationship: z.string().min(3).max(32).optional(),
  locale: z.string().min(2).max(5).optional()
})

const verifySchema = z.object({
  code: z.string().min(4).max(8)
})

const safetyStep = (steps: any[]): any[] => {
  const normalized = Array.isArray(steps) ? [...steps] : []
  const timestamp = new Date().toISOString()
  const targetIndex = normalized.findIndex((step) => step?.key === 'safety')

  if (targetIndex >= 0) {
    normalized[targetIndex] = {
      ...normalized[targetIndex],
      completed: true,
      lastUpdated: timestamp
    }
  } else {
    normalized.push({
      key: 'safety',
      title: 'Safety & Guardian',
      completed: true,
      data: {},
      lastUpdated: timestamp
    })
  }

  return normalized
}

const updateSafetyStep = async (userId: string) => {
  const progress = await prisma.onboardingProgress.findUnique({ where: { userId } })
  if (!progress) return null

  const updatedSteps = safetyStep(progress.steps as any[])
  const allCompleted = updatedSteps.every((step) => step.completed)

  const updated = await prisma.onboardingProgress.update({
    where: { userId },
    data: {
      steps: updatedSteps,
      lastStep: 'safety',
      lastCheckpoint: new Date(),
      completed: allCompleted,
      completedAt: allCompleted ? new Date() : null
    }
  })

  if (allCompleted && !progress.completed) {
    await prisma.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true }
    })
  }

  return updated
}

const generateCode = () => randomBytes(3).toString('hex').toUpperCase()

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = guardianSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const userId = session.user.id

    const activeGuardian = await prisma.guardianLink.findFirst({
      where: {
        userId,
        status: 'VERIFIED'
      }
    })

    if (activeGuardian) {
      return NextResponse.json(
        { error: 'Guardian already verified for this account' },
        { status: 400 }
      )
    }

    const verificationCode = generateCode()
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 7 days

    const guardianRecord = await prisma.$transaction(async (tx) => {
      const record = await tx.guardianLink.create({
        data: {
          userId,
          guardianName: parsed.data.name,
          guardianEmail: parsed.data.email,
          guardianPhone: parsed.data.phone,
          relationship: parsed.data.relationship,
          verificationCode,
          expiresAt,
          status: 'PENDING'
        }
      })

      await tx.userVerification.create({
        data: {
          userId,
          type: 'GUARDIAN',
          status: 'PENDING',
          method: 'EMAIL',
          referenceId: record.id,
          expiresAt,
          metadata: {
            guardianEmail: parsed.data.email,
            guardianName: parsed.data.name
          }
        }
      })

      return record
    })

    return NextResponse.json({
      guardian: guardianRecord,
      message: 'Guardian verification initiated'
    })
  } catch (error) {
    console.error('Guardian create error:', error)
    return NextResponse.json(
      { error: 'Failed to start guardian verification' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = verifySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const code = parsed.data.code.toUpperCase()
    const userId = session.user.id

    const guardianRecord = await prisma.guardianLink.findFirst({
      where: { userId, verificationCode: code },
      orderBy: { createdAt: 'desc' }
    })

    if (!guardianRecord) {
      return NextResponse.json({ error: 'Verification code not found' }, { status: 404 })
    }

    if (guardianRecord.expiresAt && guardianRecord.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Verification code expired' }, { status: 400 })
    }

    if (guardianRecord.status === 'VERIFIED') {
      return NextResponse.json({ message: 'Guardian already verified' })
    }

    await prisma.$transaction(async (tx) => {
      await tx.guardianLink.update({
        where: { id: guardianRecord.id },
        data: {
          status: 'VERIFIED',
          verifiedAt: new Date()
        }
      })

      await tx.userVerification.updateMany({
        where: { userId, type: 'GUARDIAN', status: 'PENDING' },
        data: {
          status: 'APPROVED',
          verifiedAt: new Date()
        }
      })
    })

    const updatedProgress = await updateSafetyStep(userId)

    return NextResponse.json({
      message: 'Guardian verified successfully',
      progress: updatedProgress
    })
  } catch (error) {
    console.error('Guardian verify error:', error)
    return NextResponse.json(
      { error: 'Failed to verify guardian' },
      { status: 500 }
    )
  }
}
