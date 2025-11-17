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
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
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

    const attendedCount = attendance.length; // All records mean they attended (joined)
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
    const { userId, duration } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required', errorAr: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    // Verify user exists and is a member of this cohort
    const member = await prisma.cohortMember.findFirst({
      where: { 
        cohortId: cohortId,
        userId: userId,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'User is not a member of this cohort', errorAr: 'المستخدم ليس عضواً في هذه المجموعة' },
        { status: 404 }
      );
    }

    // Check if attendance record already exists
    const existingAttendance = await prisma.sessionAttendance.findFirst({
      where: {
        sessionId,
        userId,
      },
    });

    let attendanceRecord;

    if (existingAttendance) {
      // Update existing attendance (extend duration)
      attendanceRecord = await prisma.sessionAttendance.update({
        where: { id: existingAttendance.id },
        data: {
          leftAt: new Date(),
          durationMinutes: duration,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true,
            },
          },
        },
      });
    } else {
      // Create new attendance record
      attendanceRecord = await prisma.sessionAttendance.create({
        data: {
          sessionId,
          userId,
          joinedAt: new Date(),
          durationMinutes: duration,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true,
            },
          },
        },
      });
    }

    // Update member's total attendance count if this is a new attendance
    if (!existingAttendance) {
      await prisma.cohortMember.update({
        where: { id: member.id },
        data: {
          attendedSessions: { increment: 1 },
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
