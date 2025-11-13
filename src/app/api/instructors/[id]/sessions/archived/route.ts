import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: creatorId } = await params;

        // Get archived/completed sessions for this instructor
        const archivedSessions = await prisma.meeting.findMany({
            where: {
                creatorId: creatorId,
                status: {
                    in: ['COMPLETED', 'CANCELLED']
                },
                scheduledAt: {
                    lt: new Date()
                }
            },
            select: {
                id: true,
                title: true,
                description: true,
                scheduledAt: true,
                duration: true,
                meetingType: true,
                status: true,
                student: {
                    select: {
                        name: true,
                        arabicName: true,
                        email: true
                    }
                }
            },
            orderBy: {
                scheduledAt: 'desc'
            },
            take: 20 // Limit to last 20 sessions
        })

        return NextResponse.json({ sessions: archivedSessions })
    } catch (error) {
        console.error('Get archived sessions error:', error)
        return NextResponse.json(
            { error: 'Failed to get archived sessions' },
            { status: 500 }
        )
    }
}