import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/creator/cohorts/[id]/sessions/[sessionId] - Get a specific session
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', errorAr: 'غير مصرح' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'CREATOR') {
      return NextResponse.json(
        { error: 'Only creators can access sessions', errorAr: 'المنشئون فقط يمكنهم الوصول إلى الجلسات' },
        { status: 403 }
      );
    }

    const { id: cohortId, sessionId } = params;

    // Fetch session with cohort and attendance details
    const cohortSession = await prisma.cohortSession.findUnique({
      where: { id: sessionId },
      include: {
        cohort: {
          include: {
            course: {
              select: {
                id: true,
                creatorId: true,
              },
            },
          },
        },
        attendance: {
          include: {
            member: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            attendance: true,
          },
        },
      },
    });

    if (!cohortSession) {
      return NextResponse.json(
        { error: 'Session not found', errorAr: 'الجلسة غير موجودة' },
        { status: 404 }
      );
    }

    // Verify cohort ID matches
    if (cohortSession.cohortId !== cohortId) {
      return NextResponse.json(
        { error: 'Session does not belong to this cohort', errorAr: 'الجلسة لا تنتمي إلى هذه المجموعة' },
        { status: 400 }
      );
    }

    // Verify ownership
    if (cohortSession.cohort.course.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not own this cohort', errorAr: 'أنت لا تملك هذه المجموعة' },
        { status: 403 }
      );
    }

    // Calculate attendance stats
    const attendedCount = cohortSession.attendance.filter((a: any) => a.attended).length;
    const totalRegistered = cohortSession.attendance.length;
    const attendanceRate = totalRegistered > 0 
      ? Math.round((attendedCount / totalRegistered) * 100)
      : 0;

    return NextResponse.json({
      session: {
        ...cohortSession,
        attendedCount,
        totalRegistered,
        attendanceRate,
      },
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session', errorAr: 'فشل في جلب الجلسة' },
      { status: 500 }
    );
  }
}

// PATCH /api/creator/cohorts/[id]/sessions/[sessionId] - Update a session
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', errorAr: 'غير مصرح' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'CREATOR') {
      return NextResponse.json(
        { error: 'Only creators can update sessions', errorAr: 'المنشئون فقط يمكنهم تحديث الجلسات' },
        { status: 403 }
      );
    }

    const { id: cohortId, sessionId } = params;

    // Fetch session with cohort
    const cohortSession = await prisma.cohortSession.findUnique({
      where: { id: sessionId },
      include: {
        cohort: {
          include: {
            course: {
              select: {
                id: true,
                creatorId: true,
              },
            },
          },
        },
      },
    });

    if (!cohortSession) {
      return NextResponse.json(
        { error: 'Session not found', errorAr: 'الجلسة غير موجودة' },
        { status: 404 }
      );
    }

    // Verify cohort ID matches
    if (cohortSession.cohortId !== cohortId) {
      return NextResponse.json(
        { error: 'Session does not belong to this cohort', errorAr: 'الجلسة لا تنتمي إلى هذه المجموعة' },
        { status: 400 }
      );
    }

    // Verify ownership
    if (cohortSession.cohort.course.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not own this cohort', errorAr: 'أنت لا تملك هذه المجموعة' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      titleAr,
      description,
      descriptionAr,
      type,
      scheduledAt,
      duration,
      meetingUrl,
      maxAttendees,
      isRecorded,
      status,
      recordingUrl,
      actualDuration,
    } = body;

    // Build update data
    const updateData: any = {};

    if (title !== undefined) {
      if (title.length < 5) {
        return NextResponse.json(
          { error: 'Title must be at least 5 characters', errorAr: 'يجب أن يكون العنوان 5 أحرف على الأقل' },
          { status: 400 }
        );
      }
      updateData.title = title;
    }

    if (titleAr !== undefined) {
      updateData.titleAr = titleAr;
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    if (descriptionAr !== undefined) {
      updateData.descriptionAr = descriptionAr;
    }

    if (type !== undefined) {
      if (!['LIVE_QA', 'OFFICE_HOURS', 'GROUP_WORK', 'GUEST_SPEAKER', 'REVIEW_SESSION', 'ORIENTATION'].includes(type)) {
        return NextResponse.json(
          { error: 'Invalid session type', errorAr: 'نوع جلسة غير صالح' },
          { status: 400 }
        );
      }
      updateData.type = type;
    }

    if (scheduledAt !== undefined) {
      const scheduledDate = new Date(scheduledAt);
      if (scheduledDate <= new Date()) {
        return NextResponse.json(
          { error: 'Scheduled time must be in the future', errorAr: 'يجب أن يكون الوقت المجدول في المستقبل' },
          { status: 400 }
        );
      }
      updateData.scheduledAt = scheduledDate;
    }

    if (duration !== undefined) {
      if (duration < 15) {
        return NextResponse.json(
          { error: 'Duration must be at least 15 minutes', errorAr: 'يجب أن تكون المدة 15 دقيقة على الأقل' },
          { status: 400 }
        );
      }
      updateData.duration = duration;
    }

    if (meetingUrl !== undefined) {
      updateData.meetingUrl = meetingUrl;
    }

    if (maxAttendees !== undefined) {
      updateData.maxAttendees = maxAttendees;
    }

    if (isRecorded !== undefined) {
      updateData.isRecorded = isRecorded;
    }

    if (status !== undefined) {
      if (!['SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED'].includes(status)) {
        return NextResponse.json(
          { error: 'Invalid session status', errorAr: 'حالة جلسة غير صالحة' },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    if (recordingUrl !== undefined) {
      updateData.recordingUrl = recordingUrl;
    }

    if (actualDuration !== undefined) {
      updateData.actualDuration = actualDuration;
    }

    // Update session
    const updatedSession = await prisma.cohortSession.update({
      where: { id: sessionId },
      data: updateData,
      include: {
        _count: {
          select: {
            attendance: true,
          },
        },
      },
    });

    return NextResponse.json({
      session: updatedSession,
      message: 'Session updated successfully',
      messageAr: 'تم تحديث الجلسة بنجاح',
    });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Failed to update session', errorAr: 'فشل في تحديث الجلسة' },
      { status: 500 }
    );
  }
}

// DELETE /api/creator/cohorts/[id]/sessions/[sessionId] - Delete a session
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', errorAr: 'غير مصرح' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'CREATOR') {
      return NextResponse.json(
        { error: 'Only creators can delete sessions', errorAr: 'المنشئون فقط يمكنهم حذف الجلسات' },
        { status: 403 }
      );
    }

    const { id: cohortId, sessionId } = params;

    // Fetch session with cohort
    const cohortSession = await prisma.cohortSession.findUnique({
      where: { id: sessionId },
      include: {
        cohort: {
          include: {
            course: {
              select: {
                id: true,
                creatorId: true,
              },
            },
          },
        },
      },
    });

    if (!cohortSession) {
      return NextResponse.json(
        { error: 'Session not found', errorAr: 'الجلسة غير موجودة' },
        { status: 404 }
      );
    }

    // Verify cohort ID matches
    if (cohortSession.cohortId !== cohortId) {
      return NextResponse.json(
        { error: 'Session does not belong to this cohort', errorAr: 'الجلسة لا تنتمي إلى هذه المجموعة' },
        { status: 400 }
      );
    }

    // Verify ownership
    if (cohortSession.cohort.course.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not own this cohort', errorAr: 'أنت لا تملك هذه المجموعة' },
        { status: 403 }
      );
    }

    // Delete session (cascade will delete attendance records)
    await prisma.cohortSession.delete({
      where: { id: sessionId },
    });

    return NextResponse.json({
      message: 'Session deleted successfully',
      messageAr: 'تم حذف الجلسة بنجاح',
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session', errorAr: 'فشل في حذف الجلسة' },
      { status: 500 }
    );
  }
}
