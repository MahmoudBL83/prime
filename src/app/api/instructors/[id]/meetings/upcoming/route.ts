import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

// Global Prisma instance
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

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

        // Get upcoming meetings for this instructor
        const upcomingMeetings = await prisma.meeting.findMany({
            where: {
                creatorId: creatorId,
                status: {
                    in: ['SCHEDULED', 'CONFIRMED']
                },
                scheduledAt: {
                    gte: new Date()
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
                scheduledAt: 'asc'
            },
            take: 10 // Limit to next 10 meetings
        })

        return NextResponse.json({ meetings: upcomingMeetings })
    } catch (error) {
        console.error('Get upcoming meetings error:', error)
        return NextResponse.json(
            { error: 'Failed to get upcoming meetings' },
            { status: 500 }
        )
    }
}