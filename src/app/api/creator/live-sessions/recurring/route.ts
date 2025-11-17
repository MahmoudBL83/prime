import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const recurringSessionSchema = z.object({
    title: z.string().min(3).max(200),
    description: z.string().optional(),
    startDate: z.string().datetime(),
    duration: z.number().min(15).max(480),
    tier: z.enum(['BRONZE', 'SILVER', 'GOLD', 'ALL']).default('BRONZE'),
    maxAttendees: z.number().min(1).max(10000).optional(),
    recurrence: z.object({
        frequency: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY']),
        daysOfWeek: z.array(z.number().min(0).max(6)).optional(), // 0=Sunday, 6=Saturday
        endDate: z.string().datetime().optional(),
        occurrences: z.number().min(1).max(52).optional() // Max 52 occurrences
    })
})

/**
 * POST /api/creator/live-sessions/recurring
 * 
 * Create recurring live sessions based on a schedule
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (session.user.role !== 'CREATOR') {
            return NextResponse.json({ error: 'Only creators can schedule sessions' }, { status: 403 })
        }

        const body = await request.json()
        const validation = recurringSessionSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validation.error.issues
            }, { status: 400 })
        }

        const data = validation.data
        const creatorId = session.user.id

        // Get creator's channel
        let channel = await prisma.creatorChannel.findFirst({
            where: { creatorId: creatorId }
        })

        if (!channel) {
            return NextResponse.json({ error: 'No channel found. Create a channel first.' }, { status: 404 })
        }

        // Calculate session dates based on recurrence
        const sessionDates: Date[] = []
        const startDate = new Date(data.startDate)
        const endDate = data.recurrence.endDate ? new Date(data.recurrence.endDate) : null
        const maxOccurrences = data.recurrence.occurrences || 52
        const now = new Date()

        let currentDate = new Date(startDate)
        let count = 0

        while (count < maxOccurrences) {
            // Check if we've reached the end date
            if (endDate && currentDate > endDate) break

            // Check if session is in the future
            if (currentDate > now) {
                // For weekly/biweekly, check if day matches
                if (data.recurrence.frequency === 'WEEKLY' || data.recurrence.frequency === 'BIWEEKLY') {
                    const dayOfWeek = currentDate.getDay()
                    if (data.recurrence.daysOfWeek && data.recurrence.daysOfWeek.includes(dayOfWeek)) {
                        sessionDates.push(new Date(currentDate))
                        count++
                    }
                } else {
                    sessionDates.push(new Date(currentDate))
                    count++
                }
            }

            // Calculate next occurrence
            switch (data.recurrence.frequency) {
                case 'DAILY':
                    currentDate.setDate(currentDate.getDate() + 1)
                    break
                case 'WEEKLY':
                    currentDate.setDate(currentDate.getDate() + 1)
                    break
                case 'BIWEEKLY':
                    currentDate.setDate(currentDate.getDate() + 1)
                    break
                case 'MONTHLY':
                    currentDate.setMonth(currentDate.getMonth() + 1)
                    break
            }

            // Prevent infinite loops
            if (count > 1000) break
        }

        if (sessionDates.length === 0) {
            return NextResponse.json({
                error: 'No valid session dates generated. Check your recurrence settings.'
            }, { status: 400 })
        }

        // Create all sessions
        const createdSessions = []
        for (const sessionDate of sessionDates) {
            const liveSession = await prisma.liveSession.create({
                data: {
                    channelId: channel.id,
                    title: data.title,
                    titleAr: data.title, // TODO: Add Arabic support
                    description: data.description,
                    scheduledAt: sessionDate,
                    duration: data.duration,
                    tier: data.tier === 'ALL' ? 'BRONZE' : data.tier,
                    maxAttendees: data.maxAttendees,
                    status: 'SCHEDULED'
                }
            })

            createdSessions.push({
                id: liveSession.id,
                title: liveSession.title,
                scheduledAt: liveSession.scheduledAt.toISOString()
            })
        }

        return NextResponse.json({
            success: true,
            message: `Created ${createdSessions.length} recurring sessions`,
            sessions: createdSessions
        }, { status: 201 })

    } catch (error) {
        console.error('Recurring session creation error:', error)
        
        if (error instanceof z.ZodError) {
            return NextResponse.json({
                error: 'Invalid request data',
                details: error.issues
            }, { status: 400 })
        }

        return NextResponse.json({
            error: 'Failed to create recurring sessions'
        }, { status: 500 })
    }
}

/**
 * GET /api/creator/live-sessions/recurring
 * 
 * Get suggested recurring templates
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Return popular recurring templates
        const templates = [
            {
                id: 'weekly-office-hours',
                name: 'Weekly Office Hours',
                description: 'Every Monday at 6 PM for Q&A',
                recurrence: {
                    frequency: 'WEEKLY',
                    daysOfWeek: [1], // Monday
                    occurrences: 12
                },
                duration: 60,
                tier: 'BRONZE'
            },
            {
                id: 'biweekly-workshop',
                name: 'Bi-weekly Workshop',
                description: 'Every other Friday for hands-on practice',
                recurrence: {
                    frequency: 'BIWEEKLY',
                    daysOfWeek: [5], // Friday
                    occurrences: 6
                },
                duration: 90,
                tier: 'SILVER'
            },
            {
                id: 'monthly-masterclass',
                name: 'Monthly Masterclass',
                description: 'First Saturday of each month',
                recurrence: {
                    frequency: 'MONTHLY',
                    occurrences: 6
                },
                duration: 120,
                tier: 'GOLD'
            },
            {
                id: 'daily-standup',
                name: 'Daily Check-in',
                description: 'Quick daily session every weekday',
                recurrence: {
                    frequency: 'DAILY',
                    daysOfWeek: [1, 2, 3, 4, 5], // Monday-Friday
                    occurrences: 20
                },
                duration: 15,
                tier: 'BRONZE'
            }
        ]

        return NextResponse.json({
            success: true,
            templates
        })

    } catch (error) {
        console.error('Get templates error:', error)
        return NextResponse.json({
            error: 'Failed to get templates'
        }, { status: 500 })
    }
}
