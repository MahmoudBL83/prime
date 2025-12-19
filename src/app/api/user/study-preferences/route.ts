import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const studyPreferencesSchema = z.object({
    enabled: z.boolean(),
    subjects: z.array(z.string()),
    availability: z.record(z.string(), z.any()),
    sessionLength: z.string(),
    collaborationPrefs: z.array(z.string()),
    headsetAvailable: z.boolean(),
    timezone: z.string(),
})

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.user.id

        // Fetch user for enabled status and prefs for details
        const [user, prefs] = await Promise.all([
            prisma.user.findUnique({
                where: { id: userId },
                select: { studyBuddyPreferences: true }
            }),
            prisma.studyPreferences.findUnique({
                where: { userId }
            })
        ])

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Default state if no prefs exist
        const defaultPrefs = {
            enabled: user.studyBuddyPreferences === 'ENABLED',
            subjects: [],
            availability: {
                monday: { enabled: false, start: '09:00', end: '17:00' },
                tuesday: { enabled: false, start: '09:00', end: '17:00' },
                wednesday: { enabled: false, start: '09:00', end: '17:00' },
                thursday: { enabled: false, start: '09:00', end: '17:00' },
                friday: { enabled: false, start: '09:00', end: '17:00' },
                saturday: { enabled: false, start: '09:00', end: '17:00' },
                sunday: { enabled: false, start: '09:00', end: '17:00' },
            },
            sessionLength: '1hr',
            collaborationPrefs: ['chat', 'audio'],
            headsetAvailable: false,
            timezone: 'UTC+2'
        }

        if (!prefs) {
            return NextResponse.json({ preferences: defaultPrefs })
        }

        // Map DB model to frontend state
        const mappedPrefs = {
            enabled: user.studyBuddyPreferences === 'ENABLED',
            subjects: prefs.subjectsToLearn ? JSON.parse(JSON.stringify(prefs.subjectsToLearn)) : [],
            availability: prefs.weeklyAvailability ? JSON.parse(JSON.stringify(prefs.weeklyAvailability)) : defaultPrefs.availability,
            sessionLength: prefs.studyDuration === 30 ? '30min' : prefs.studyDuration === 120 ? '2hr' : prefs.studyDuration === 180 ? '3hr' : '1hr',
            collaborationPrefs: prefs.studyMethodPreference ? JSON.parse(JSON.stringify(prefs.studyMethodPreference)) : [],
            // We'll store headset info in studyEnvironment or just infer/mock for now as there's no dedicated field that matches exactly
            headsetAvailable: prefs.studyEnvironment === 'headset',
            timezone: prefs.timezone || 'UTC+2'
        }

        return NextResponse.json({ preferences: mappedPrefs })

    } catch (error) {
        console.error('Error fetching study preferences:', error)
        return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const validation = studyPreferencesSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid input', details: validation.error }, { status: 400 })
        }

        const {
            enabled,
            subjects,
            availability,
            sessionLength,
            collaborationPrefs,
            headsetAvailable,
            timezone
        } = validation.data

        const userId = session.user.id

        // Convert session length string to minutes
        const durationMap: Record<string, number> = {
            '30min': 30,
            '1hr': 60,
            '2hr': 120,
            '3hr': 180
        }
        const studyDuration = durationMap[sessionLength] || 60

        // Update User and Upsert StudyPreferences
        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: {
                    studyBuddyPreferences: enabled ? 'ENABLED' : 'DISABLED'
                }
            }),
            prisma.studyPreferences.upsert({
                where: { userId },
                create: {
                    userId,
                    subjectsToLearn: subjects,
                    weeklyAvailability: availability,
                    studyDuration,
                    studyMethodPreference: collaborationPrefs, // Storing array directly as Json
                    timezone,
                    studyEnvironment: headsetAvailable ? 'headset' : 'standard', // Hacky mapping
                },
                update: {
                    subjectsToLearn: subjects,
                    weeklyAvailability: availability,
                    studyDuration,
                    studyMethodPreference: collaborationPrefs,
                    timezone,
                    studyEnvironment: headsetAvailable ? 'headset' : 'standard',
                }
            })
        ])

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Error updating study preferences:', error)
        return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
    }
}
