import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSessionSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  scheduledAt: z.string().optional(),
  duration: z.number().min(15).max(240).optional(),
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  notes: z.string().optional(),
  cancelReason: z.string().optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const studySession = await prisma.studySession.findFirst({
      where: {
        id: params.id,
        match: {
          OR: [
            { user1Id: session.user.id },
            { user2Id: session.user.id },
          ],
        },
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
        reminders: true,
      },
    })

    if (!studySession) {
      return NextResponse.json({ error: 'Study session not found' }, { status: 404 })
    }

    const otherUser = studySession.match.user1Id === session.user.id 
      ? studySession.match.user2 
      : studySession.match.user1

    return NextResponse.json({
      id: studySession.id,
      title: studySession.title,
      description: studySession.description,
      scheduledAt: studySession.scheduledAt,
      duration: studySession.duration,
      status: studySession.status,
      studyTopics: studySession.studyTopics ? JSON.parse(studySession.studyTopics) : [],
      notes: studySession.notes,
      createdBy: studySession.createdBy,
      otherUser: {
        id: otherUser.id,
        name: otherUser.name,
        arabicName: otherUser.arabicName,
        profileImage: otherUser.profileImage,
      },
      startedAt: studySession.startedAt,
      completedAt: studySession.completedAt,
      meetingLink: studySession.meetingLink,
      cancelReason: studySession.cancelReason,
      reminders: studySession.reminders.length,
    })

  } catch (error) {
    console.error('Get study session error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch study session' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validation = updateSessionSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues },
        { status: 400 }
      )
    }

    // Verify the session exists and user has permission
    const existingSession = await prisma.studySession.findFirst({
      where: {
        id: params.id,
        match: {
          OR: [
            { user1Id: session.user.id },
            { user2Id: session.user.id },
          ],
        },
      },
      include: {
        match: {
          include: {
            user1: true,
            user2: true,
          }
        },
      },
    })

    if (!existingSession) {
      return NextResponse.json({ error: 'Study session not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (validation.data.title) updateData.title = validation.data.title
    if (validation.data.description !== undefined) updateData.description = validation.data.description
    if (validation.data.scheduledAt) updateData.scheduledAt = new Date(validation.data.scheduledAt)
    if (validation.data.duration) updateData.duration = validation.data.duration
    if (validation.data.notes !== undefined) updateData.notes = validation.data.notes
    if (validation.data.cancelReason !== undefined) updateData.cancelReason = validation.data.cancelReason

    // Handle status changes
    if (validation.data.status) {
      updateData.status = validation.data.status

      // Update timestamps based on status
      if (validation.data.status === 'IN_PROGRESS' && !existingSession.startedAt) {
        updateData.startedAt = new Date()
      } else if (validation.data.status === 'COMPLETED' && !existingSession.completedAt) {
        updateData.completedAt = new Date()
        if (!existingSession.startedAt) {
          updateData.startedAt = existingSession.scheduledAt
        }
      }
    }

    // Update the session
    const updatedSession = await prisma.studySession.update({
      where: { id: params.id },
      data: updateData,
    })

    // If rescheduling, update reminders
    if (validation.data.scheduledAt) {
      const newSessionTime = new Date(validation.data.scheduledAt)
      const otherUserId = existingSession.match.user1Id === session.user.id 
        ? existingSession.match.user2Id 
        : existingSession.match.user1Id

      // Delete old reminders
      await prisma.studySessionReminder.deleteMany({
        where: { sessionId: params.id }
      })

      // Create new reminders
      const reminders = [
        {
          sessionId: params.id,
          userId: session.user.id,
          reminderTime: new Date(newSessionTime.getTime() - 60 * 60 * 1000),
          reminderType: 'ONE_HOUR_BEFORE',
        },
        {
          sessionId: params.id,
          userId: otherUserId,
          reminderTime: new Date(newSessionTime.getTime() - 60 * 60 * 1000),
          reminderType: 'ONE_HOUR_BEFORE',
        },
        {
          sessionId: params.id,
          userId: session.user.id,
          reminderTime: new Date(newSessionTime.getTime() - 15 * 60 * 1000),
          reminderType: 'FIFTEEN_MINUTES_BEFORE',
        },
        {
          sessionId: params.id,
          userId: otherUserId,
          reminderTime: new Date(newSessionTime.getTime() - 15 * 60 * 1000),
          reminderType: 'FIFTEEN_MINUTES_BEFORE',
        },
      ]

      await prisma.studySessionReminder.createMany({
        data: reminders,
      })
    }

    return NextResponse.json({
      id: updatedSession.id,
      title: updatedSession.title,
      description: updatedSession.description,
      scheduledAt: updatedSession.scheduledAt,
      duration: updatedSession.duration,
      status: updatedSession.status,
      notes: updatedSession.notes,
      message: 'Study session updated successfully'
    })

  } catch (error) {
    console.error('Update study session error:', error)
    return NextResponse.json(
      { error: 'Failed to update study session' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the session exists and user has permission
    const existingSession = await prisma.studySession.findFirst({
      where: {
        id: params.id,
        match: {
          OR: [
            { user1Id: session.user.id },
            { user2Id: session.user.id },
          ],
        },
      },
    })

    if (!existingSession) {
      return NextResponse.json({ error: 'Study session not found' }, { status: 404 })
    }

    // Delete reminders first
    await prisma.studySessionReminder.deleteMany({
      where: { sessionId: params.id }
    })

    // Delete the session
    await prisma.studySession.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Study session deleted successfully' })

  } catch (error) {
    console.error('Delete study session error:', error)
    return NextResponse.json(
      { error: 'Failed to delete study session' },
      { status: 500 }
    )
  }
}