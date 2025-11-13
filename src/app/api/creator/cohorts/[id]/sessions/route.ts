import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/creator/cohorts/[id]/sessions - List all sessions for a cohort
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: cohortId } = await params;

    // Verify cohort exists and user owns the course
    const cohort = await prisma.cohort.findUnique({
      where: { id: cohortId },
      include: {
        course: {
          select: {
            id: true,
            creatorId: true,
          },
        },
      },
    });

    if (!cohort) {
      return NextResponse.json(
        { error: 'Cohort not found', errorAr: 'المجموعة غير موجودة' },
        { status: 404 }
      );
    }

    if (cohort.course.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not own this cohort', errorAr: 'أنت لا تملك هذه المجموعة' },
        { status: 403 }
      );
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    // Build filter
    const where: any = {
      cohortId,
    };

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    // Fetch sessions with attendance counts
    const sessions = await prisma.cohortSession.findMany({
      where,
      include: {
        attendance: {
          select: {
            id: true,
            attended: true,
          },
        },
        _count: {
          select: {
            attendance: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });

    // Calculate attendance stats for each session
    const sessionsWithStats = sessions.map((session: any) => {
      const attendedCount = session.attendance.filter((a: any) => a.attended).length;
      const totalRegistered = session.attendance.length;
      const attendanceRate = totalRegistered > 0 
        ? Math.round((attendedCount / totalRegistered) * 100)
        : 0;

      return {
        ...session,
        attendedCount,
        totalRegistered,
        attendanceRate,
      };
    });

    // Calculate overall stats
    const totalSessions = sessions.length;
    const upcomingSessions = sessions.filter((s: any) => s.status === 'SCHEDULED').length;
    const completedSessions = sessions.filter((s: any) => s.status === 'COMPLETED').length;
    const liveSessions = sessions.filter((s: any) => s.status === 'LIVE').length;

    return NextResponse.json({
      sessions: sessionsWithStats,
      stats: {
        total: totalSessions,
        upcoming: upcomingSessions,
        completed: completedSessions,
        live: liveSessions,
      },
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions', errorAr: 'فشل في جلب الجلسات' },
      { status: 500 }
    );
  }
}

// POST /api/creator/cohorts/[id]/sessions - Create a new session
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
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
        { error: 'Only creators can create sessions', errorAr: 'المنشئون فقط يمكنهم إنشاء الجلسات' },
        { status: 403 }
      );
    }

    const cohortId = params.id;

    // Verify cohort exists and user owns the course
    const cohort = await prisma.cohort.findUnique({
      where: { id: cohortId },
      include: {
        course: {
          select: {
            id: true,
            creatorId: true,
          },
        },
      },
    });

    if (!cohort) {
      return NextResponse.json(
        { error: 'Cohort not found', errorAr: 'المجموعة غير موجودة' },
        { status: 404 }
      );
    }

    if (cohort.course.creatorId !== session.user.id) {
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
      notifyMembers,
    } = body;

    // Validation
    if (!title || title.length < 5) {
      return NextResponse.json(
        { error: 'Title must be at least 5 characters', errorAr: 'يجب أن يكون العنوان 5 أحرف على الأقل' },
        { status: 400 }
      );
    }

    if (!type || !['LIVE_QA', 'OFFICE_HOURS', 'GROUP_WORK', 'GUEST_SPEAKER', 'REVIEW_SESSION', 'ORIENTATION'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid session type', errorAr: 'نوع جلسة غير صالح' },
        { status: 400 }
      );
    }

    if (!scheduledAt) {
      return NextResponse.json(
        { error: 'Scheduled date and time is required', errorAr: 'التاريخ والوقت المجدول مطلوب' },
        { status: 400 }
      );
    }

    if (!duration || duration < 15) {
      return NextResponse.json(
        { error: 'Duration must be at least 15 minutes', errorAr: 'يجب أن تكون المدة 15 دقيقة على الأقل' },
        { status: 400 }
      );
    }

    // Validate scheduled time is in the future
    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future', errorAr: 'يجب أن يكون الوقت المجدول في المستقبل' },
        { status: 400 }
      );
    }

    // Validate scheduled time is within cohort duration
    if (scheduledDate < new Date(cohort.startDate) || scheduledDate > new Date(cohort.endDate)) {
      return NextResponse.json(
        { error: 'Session must be scheduled within cohort dates', errorAr: 'يجب جدولة الجلسة ضمن تواريخ المجموعة' },
        { status: 400 }
      );
    }

    // Create session
    const newSession = await prisma.cohortSession.create({
      data: {
        cohortId,
        title,
        titleAr,
        description,
        descriptionAr,
        type,
        scheduledAt: new Date(scheduledAt),
        duration,
        meetingUrl,
        maxAttendees,
        isRecorded: isRecorded || false,
        status: 'SCHEDULED',
      },
      include: {
        _count: {
          select: {
            attendance: true,
          },
        },
      },
    });

    // If notifyMembers is true, fetch active members for email notification
    if (notifyMembers) {
      const activeMembers = await prisma.cohortMember.findMany({
        where: {
          cohortId,
          status: 'ACTIVE',
        },
        include: {
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      });

      // TODO: Queue email notifications
      console.log(`Sending session notification to ${activeMembers.length} members`);
      // In production, integrate with email service (SendGrid, AWS SES, etc.)
    }

    return NextResponse.json({
      session: newSession,
      message: 'Session created successfully',
      messageAr: 'تم إنشاء الجلسة بنجاح',
      notificationsSent: notifyMembers ? (await prisma.cohortMember.count({
        where: { cohortId, status: 'ACTIVE' }
      })) : 0,
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session', errorAr: 'فشل في إنشاء الجلسة' },
      { status: 500 }
    );
  }
}
