import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/creator/cohorts/[id]/sessions/[sessionId]/attendance - Get attendance for a session
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const { id, sessionId } = await params
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', errorAr: 'غير مصرح' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'CREATOR') {
      return NextResponse.json(
        { error: 'Only creators can access attendance', errorAr: 'المنشئون فقط يمكنهم الوصول إلى الحضور' },
        { status: 403 }
      );
    }

    const cohortId = id;

    // Verify session exists and user owns the cohort
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

    if (cohortSession.cohortId !== cohortId) {
      return NextResponse.json(
        { error: 'Session does not belong to this cohort', errorAr: 'الجلسة لا تنتمي إلى هذه المجموعة' },
        { status: 400 }
      );
    }

    if (cohortSession.cohort.course.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not own this cohort', errorAr: 'أنت لا تملك هذه المجموعة' },
        { status: 403 }
      );
    }

    // Fetch all attendance records for this session
    const attendance = await prisma.sessionAttendance.findMany({
      where: {
        sessionId,
      },
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
      orderBy: {
        joinedAt: 'asc',
      },
    });

    // Calculate stats
    const totalMembers = await prisma.cohortMember.count({
      where: {
        cohortId,
        status: 'ACTIVE',
      },
    });

    const attendedCount = attendance.filter((a: any) => a.attended).length;
    const attendanceRate = totalMembers > 0 
      ? Math.round((attendedCount / totalMembers) * 100)
      : 0;

    return NextResponse.json({
      attendance,
      stats: {
        totalMembers,
        attendedCount,
        registeredCount: attendance.length,
        attendanceRate,
      },
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance', errorAr: 'فشل في جلب الحضور' },
      { status: 500 }
    );
  }
}

// POST /api/creator/cohorts/[id]/sessions/[sessionId]/attendance - Mark attendance
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const { id, sessionId } = await params
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', errorAr: 'غير مصرح' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'CREATOR') {
      return NextResponse.json(
        { error: 'Only creators can mark attendance', errorAr: 'المنشئون فقط يمكنهم تحديد الحضور' },
        { status: 403 }
      );
    }

    const cohortId = id;

    // Verify session exists and user owns the cohort
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

    if (cohortSession.cohortId !== cohortId) {
      return NextResponse.json(
        { error: 'Session does not belong to this cohort', errorAr: 'الجلسة لا تنتمي إلى هذه المجموعة' },
        { status: 400 }
      );
    }

    if (cohortSession.cohort.course.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not own this cohort', errorAr: 'أنت لا تملك هذه المجموعة' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { memberId, attended, duration, notes } = body;

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required', errorAr: 'معرف العضو مطلوب' },
        { status: 400 }
      );
    }

    if (attended === undefined) {
      return NextResponse.json(
        { error: 'Attended status is required', errorAr: 'حالة الحضور مطلوبة' },
        { status: 400 }
      );
    }

    // Verify member exists and belongs to this cohort
    const member = await prisma.cohortMember.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found', errorAr: 'العضو غير موجود' },
        { status: 404 }
      );
    }

    if (member.cohortId !== cohortId) {
      return NextResponse.json(
        { error: 'Member does not belong to this cohort', errorAr: 'العضو لا ينتمي إلى هذه المجموعة' },
        { status: 400 }
      );
    }

    // Check if attendance record already exists
    const existingAttendance = await prisma.sessionAttendance.findFirst({
      where: {
        sessionId,
        memberId,
      },
    });

    let attendanceRecord;

    if (existingAttendance) {
      // Update existing attendance
      attendanceRecord = await prisma.sessionAttendance.update({
        where: { id: existingAttendance.id },
        data: {
          attended,
          duration,
          notes,
        },
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
      });
    } else {
      // Create new attendance record
      attendanceRecord = await prisma.sessionAttendance.create({
        data: {
          sessionId,
          memberId,
          attended,
          duration,
          notes,
          joinedAt: attended ? new Date() : undefined,
        },
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
      });
    }

    // Update member's total attendance count
    if (attended && !existingAttendance?.attended) {
      await prisma.cohortMember.update({
        where: { id: memberId },
        data: {
          sessionsAttended: { increment: 1 },
        },
      });
    } else if (!attended && existingAttendance?.attended) {
      await prisma.cohortMember.update({
        where: { id: memberId },
        data: {
          sessionsAttended: { decrement: 1 },
        },
      });
    }

    return NextResponse.json({
      attendance: attendanceRecord,
      message: 'Attendance marked successfully',
      messageAr: 'تم تسجيل الحضور بنجاح',
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    return NextResponse.json(
      { error: 'Failed to mark attendance', errorAr: 'فشل في تسجيل الحضور' },
      { status: 500 }
    );
  }
}
