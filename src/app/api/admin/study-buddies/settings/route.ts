import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { z } from 'zod'

const SETTINGS_KEY = 'studyBuddyAlgorithm'

const weightsSchema = z.object({
    subjectOverlap: z.number().min(0).max(100),
    timezoneMatch: z.number().min(0).max(100),
    goalAlignment: z.number().min(0).max(100),
    studyPace: z.number().min(0).max(100),
    availability: z.number().min(0).max(100)
})

const settingsSchema = z.object({
    weights: weightsSchema
})

const DEFAULT_SETTINGS: z.infer<typeof settingsSchema> = {
    weights: {
        subjectOverlap: 40,
        timezoneMatch: 20,
        goalAlignment: 15,
        studyPace: 15,
        availability: 10
    }
}

function ensureAdmin(session: any) {
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
        throw new Error('UNAUTHORIZED')
    }
}

function parseSettings(value: string | null | undefined) {
    if (!value) return DEFAULT_SETTINGS
    try {
        const parsed = JSON.parse(value)
        const validated = settingsSchema.safeParse(parsed)
        return validated.success ? validated.data : DEFAULT_SETTINGS
    } catch (error) {
        return DEFAULT_SETTINGS
    }
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        ensureAdmin(session)

        const row = await prisma.systemConfig.findUnique({ where: { key: SETTINGS_KEY } })
        const settings = parseSettings(row?.value)

        return NextResponse.json({ settings })
    } catch (error: any) {
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        console.error('Study buddy settings GET error', error)
        return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        ensureAdmin(session)

        const body = await request.json()
        const parsed = settingsSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
        }

        const settings = parsed.data
        await prisma.systemConfig.upsert({
            where: { key: SETTINGS_KEY },
            create: { key: SETTINGS_KEY, value: JSON.stringify(settings) },
            update: { value: JSON.stringify(settings) }
        })

        return NextResponse.json({ settings })
    } catch (error: any) {
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        console.error('Study buddy settings PUT error', error)
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
    }
}
