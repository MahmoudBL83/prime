import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateMeetingSchema = z.object({
    status: z.enum(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
    meetingLink: z.string().url().optional(),
    notes: z.string().optional(),
    cancelReason: z.string().optional(),
    rescheduleData: z.object({
        scheduledAt: z.string(),
        duration: z.number().min(15).max(180)
    }).optional()
})

// PATCH /api/meetings/[id] - Update meeting
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: meetingId } = await params
        const body = await req.json()
        const validatedData = updateMeetingSchema.parse(body)

        // Get the meeting and verify permissions
        const meeting = await prisma.meeting.findUnique({
            where: { id: meetingId },
            include: {
                creator: true,
                student: true
            }
        })

        if (!meeting) {
            return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
        }

        // Check if user has permission to update this meeting
        const isCreator = meeting.creator.userId === session.user.id
        const isStudent = meeting.studentId === session.user.id

        if (!isCreator && !isStudent) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
        }

        // Handle reschedule request
        if (validatedData.rescheduleData) {
            const { scheduledAt, duration } = validatedData.rescheduleData
            const newScheduledDate = new Date(scheduledAt)
            const endTime = new Date(newScheduledDate.getTime() + duration * 60 * 1000)

            // Check for conflicts
            const conflictingMeeting = await prisma.meeting.findFirst({
                where: {
                    creatorId: meeting.creatorId,
                    id: { not: meetingId }, // Exclude current meeting
                    status: {
                        in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS']
                    },
                    OR: [
                        {
                            AND: [
                                { scheduledAt: { lte: newScheduledDate } },
                                { scheduledAt: { 
                                    gte: new Date(newScheduledDate.getTime() - (duration * 60 * 1000)) 
                                }}
                            ]
                        },
                        {
                            AND: [
                                { scheduledAt: { gte: newScheduledDate } },
                                { scheduledAt: { lt: endTime } }
                            ]
                        }
                    ]
                }
            })

            if (conflictingMeeting) {
                return NextResponse.json({ 
                    error: 'This time slot is already booked. Please choose a different time.' 
                }, { status: 400 })
            }

            // Update meeting with new schedule
            const updatedMeeting = await prisma.meeting.update({
                where: { id: meetingId },
                data: {
                    scheduledAt: newScheduledDate,
                    duration,
                    status: 'SCHEDULED', // Reset to scheduled after reschedule
                    updatedAt: new Date()
                },
                include: {
                    creator: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    arabicName: true,
                                    email: true
                                }
                            }
                        }
                    },
                    student: {
                        select: {
                            id: true,
                            name: true,
                            arabicName: true,
                            email: true,
                            phone: true
                        }
                    }
                }
            })

            return NextResponse.json({
                success: true,
                meeting: {
                    ...updatedMeeting,
                    scheduledAt: updatedMeeting.scheduledAt.toISOString(),
                    createdAt: updatedMeeting.createdAt.toISOString(),
                    updatedAt: updatedMeeting.updatedAt.toISOString()
                },
                message: 'Meeting rescheduled successfully'
            })
        }

        // Handle status updates and other fields
        const updateData: any = {}

        if (validatedData.status) {
            updateData.status = validatedData.status
            
            // Auto-generate meeting link when status changes to CONFIRMED
            if (validatedData.status === 'CONFIRMED' && !meeting.meetingLink) {
                // Generate a simple meeting room link
                // In production, this would integrate with Zoom, Google Meet, etc.
                const meetingRoomId = `meeting-${meetingId}-${Date.now()}`
                updateData.meetingLink = `https://meet.google.com/${meetingRoomId}`
            }
        }

        if (validatedData.meetingLink) {
            updateData.meetingLink = validatedData.meetingLink
        }

        if (validatedData.notes) {
            updateData.notes = validatedData.notes
        }

        if (validatedData.cancelReason) {
            updateData.cancelReason = validatedData.cancelReason
            updateData.status = 'CANCELLED' // Auto-set status to cancelled when reason is provided
        }

        updateData.updatedAt = new Date()

        const updatedMeeting = await prisma.meeting.update({
            where: { id: meetingId },
            data: updateData,
            include: {
                creator: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                arabicName: true,
                                email: true
                            }
                        }
                    }
                },
                student: {
                    select: {
                        id: true,
                        name: true,
                        arabicName: true,
                        email: true,
                        phone: true
                    }
                }
            }
        })

        // Send notifications for status changes
        try {
            if (validatedData.status) {
                let notificationTitle = ''
                let notificationMessage = ''
                let recipientId = ''

                switch (validatedData.status) {
                    case 'CONFIRMED':
                        // Notify student that meeting is confirmed
                        notificationTitle = 'تم تأكيد الجلسة'
                        notificationMessage = `تم تأكيد جلستك مع ${updatedMeeting.creator.user.arabicName || updatedMeeting.creator.user.name}`
                        recipientId = updatedMeeting.studentId
                        break
                    case 'CANCELLED':
                        // Notify the other party about cancellation
                        recipientId = isCreator ? updatedMeeting.studentId : updatedMeeting.creator.userId
                        notificationTitle = 'تم إلغاء الجلسة'
                        notificationMessage = isCreator 
                            ? `تم إلغاء جلستك من قبل المدرب ${updatedMeeting.creator.user.arabicName || updatedMeeting.creator.user.name}`
                            : `تم إلغاء الجلسة من قبل الطالب ${updatedMeeting.student.arabicName || updatedMeeting.student.name}`
                        break
                    case 'COMPLETED':
                        // Notify student that session is completed
                        notificationTitle = 'تم إنهاء الجلسة'
                        notificationMessage = `تم إنهاء جلستك مع ${updatedMeeting.creator.user.arabicName || updatedMeeting.creator.user.name} بنجاح`
                        recipientId = updatedMeeting.studentId
                        break
                }

                if (recipientId && notificationTitle) {
                    await prisma.notification.create({
                        data: {
                            userId: recipientId,
                            type: 'SYSTEM',
                            title: notificationTitle,
                            message: notificationMessage,
                            data: {
                                meetingId: updatedMeeting.id,
                                status: validatedData.status,
                                scheduledAt: updatedMeeting.scheduledAt.toISOString()
                            }
                        }
                    })
                }
            }
        } catch (notificationError) {
            console.error('Failed to create status change notification:', notificationError)
            // Don't fail the update if notifications fail
        }

        return NextResponse.json({
            success: true,
            meeting: {
                ...updatedMeeting,
                scheduledAt: updatedMeeting.scheduledAt.toISOString(),
                createdAt: updatedMeeting.createdAt.toISOString(),
                updatedAt: updatedMeeting.updatedAt.toISOString()
            },
            message: 'Meeting updated successfully'
        })

    } catch (error) {
        console.error('Update meeting error:', error)
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { error: 'Failed to update meeting' },
            { status: 500 }
        )
    }
}

// DELETE /api/meetings/[id] - Cancel/Delete meeting
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: meetingId } = await params

        // Get the meeting and verify permissions
        const meeting = await prisma.meeting.findUnique({
            where: { id: meetingId },
            include: {
                creator: true
            }
        })

        if (!meeting) {
            return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
        }

        // Check if user has permission to cancel this meeting
        const isCreator = meeting.creator.userId === session.user.id
        const isStudent = meeting.studentId === session.user.id

        if (!isCreator && !isStudent) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
        }

        // Update meeting status to cancelled instead of deleting
        const cancelledMeeting = await prisma.meeting.update({
            where: { id: meetingId },
            data: {
                status: 'CANCELLED',
                cancelReason: 'Cancelled by ' + (isCreator ? 'instructor' : 'student'),
                updatedAt: new Date()
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Meeting cancelled successfully'
        })

    } catch (error) {
        console.error('Cancel meeting error:', error)
        return NextResponse.json(
            { error: 'Failed to cancel meeting' },
            { status: 500 }
        )
    }
}