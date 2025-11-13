import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { NotificationService } from '@/services/NotificationService'

const createSessionSchema = z.object({
  matchId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  scheduledAt: z.string(),
  duration: z.number().min(15).max(240), // 15 minutes to 4 hours
  studyTopics: z.array(z.string()).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validation = createSessionSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues },
        { status: 400 }
      )
    }

    const { matchId, title, description, scheduledAt, duration, studyTopics } = validation.data

    // Verify the match exists and involves the current user
    const match = await prisma.studyBuddyMatch.findFirst({
      where: {
        id: matchId,
        OR: [
          { user1Id: session.user.id },
          { user2Id: session.user.id },
        ],
      },
      include: {
        user1: true,
        user2: true,
      }
    })

    if (!match) {
      return NextResponse.json({ error: 'Study buddy match not found' }, { status: 404 })
    }

    // Create the study session
    const studySession = await prisma.studySession.create({
      data: {
        matchId,
        title,
        description,
        scheduledAt: new Date(scheduledAt),
        duration,
        status: 'SCHEDULED',
        studyTopics: studyTopics ? JSON.stringify(studyTopics) : null,
        createdBy: session.user.id,
      },
    })

    // Create reminders for both users
    const otherUserId = match.user1Id === session.user.id ? match.user2Id : match.user1Id
    const sessionTime = new Date(scheduledAt)

    // Create different types of reminders
    const reminders = [
      {
        sessionId: studySession.id,
        userId: session.user.id,
        reminderTime: new Date(sessionTime.getTime() - 60 * 60 * 1000), // 1 hour before
        reminderType: 'ONE_HOUR_BEFORE',
      },
      {
        sessionId: studySession.id,
        userId: otherUserId,
        reminderTime: new Date(sessionTime.getTime() - 60 * 60 * 1000), // 1 hour before
        reminderType: 'ONE_HOUR_BEFORE',
      },
      {
        sessionId: studySession.id,
        userId: session.user.id,
        reminderTime: new Date(sessionTime.getTime() - 15 * 60 * 1000), // 15 minutes before
        reminderType: 'FIFTEEN_MINUTES_BEFORE',
      },
      {
        sessionId: studySession.id,
        userId: otherUserId,
        reminderTime: new Date(sessionTime.getTime() - 15 * 60 * 1000), // 15 minutes before
        reminderType: 'FIFTEEN_MINUTES_BEFORE',
      },
    ]

    await prisma.studySessionReminder.createMany({
      data: reminders,
    })

    // Get current user data for notification
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true }
    })

    // Send notification to the other user
    await NotificationService.notifyStudySessionScheduled(
      otherUserId,
      title,
      currentUser?.name || 'Someone',
      new Date(scheduledAt),
      studySession.id
    )

    return NextResponse.json({
      id: studySession.id,
      title: studySession.title,
      description: studySession.description,
      scheduledAt: studySession.scheduledAt,
      duration: studySession.duration,
      status: studySession.status,
      message: 'Study session scheduled successfully'
    })

  } catch (error) {
    console.error('Create study session error:', error)
    return NextResponse.json(
      { error: 'Failed to schedule study session' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    // Get all study sessions for the user
    const studySessions = await prisma.studySession.findMany({
      where: {
        match: {
          OR: [
            { user1Id: session.user.id },
            { user2Id: session.user.id },
          ],
        },
        ...(status && { status: status as any }),
      },
      include: {
        match: {
          include: {
            user1: {
              select: {
                id: true,
                name: true,
                arabicName: true,
                profileImage: true,
              }
            },
            user2: {
              select: {
                id: true,
                name: true,
                arabicName: true,
                profileImage: true,
              }
            },
          }
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    })

    const formattedSessions = studySessions.map(session => {
      const otherUser = session.match.user1Id === session.createdBy 
        ? session.match.user2 
        : session.match.user1

      return {
        id: session.id,
        title: session.title,
        description: session.description,
        scheduledAt: session.scheduledAt,
        duration: session.duration,
        status: session.status,
        studyTopics: session.studyTopics ? JSON.parse(session.studyTopics) : [],
        createdBy: session.createdBy,
        otherUser: {
          id: otherUser.id,
          name: otherUser.name,
          arabicName: otherUser.arabicName,
          profileImage: otherUser.profileImage,
        },
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        meetingLink: session.meetingLink,
      }
    })

    return NextResponse.json(formattedSessions)

  } catch (error) {
    console.error('Get study sessions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch study sessions' },
      { status: 500 }
    )
  }
}