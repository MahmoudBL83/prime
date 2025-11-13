import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/creator/cohorts/[id]/analytics
 * Get comprehensive analytics for a cohort
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify creator status
    const creator = await prisma.creator.findUnique({
      where: { userId: session.user.id },
    });

    if (!creator) {
      return NextResponse.json(
        { error: 'Only creators can view analytics' },
        { status: 403 }
      );
    }

    const { id: cohortId } = await params;

    // Verify cohort exists and ownership
    const cohort = await prisma.cohort.findUnique({
      where: { id: cohortId },
      include: {
        course: {
          select: {
            id: true,
            creatorId: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                arabicName: true,
                profileImage: true,
              },
            },
          },
        },
        sessions: {
          include: {
            attendees: true,
          },
        },
      },
    });

    if (!cohort) {
      return NextResponse.json(
        { error: 'Cohort not found' },
        { status: 404 }
      );
    }

    if (cohort.course.creatorId !== creator.id) {
      return NextResponse.json(
        { error: 'You can only view analytics for your own cohorts' },
        { status: 403 }
      );
    }

    // Calculate member statistics
    const activeMembers = cohort.members.filter((m) => m.status === 'ACTIVE');
    const completedMembers = cohort.members.filter((m) => m.status === 'COMPLETED');
    const droppedMembers = cohort.members.filter((m) => m.status === 'DROPPED');
    const pendingMembers = cohort.members.filter((m) => m.status === 'PENDING');

    // Calculate average progress
    const avgProgress = activeMembers.length > 0
      ? Math.round(
          activeMembers.reduce((sum, m) => sum + m.progressPercent, 0) /
            activeMembers.length
        )
      : 0;

    // Calculate completion rate
    const completionRate = cohort.members.length > 0
      ? Math.round((completedMembers.length / cohort.members.length) * 100)
      : 0;

    // Calculate retention rate
    const retentionRate = cohort.members.length > 0
      ? Math.round(
          ((activeMembers.length + completedMembers.length) /
            cohort.members.length) *
            100
        )
      : 0;

    // Identify at-risk students
    const atRiskStudents = activeMembers.filter((member) => {
      const attendanceRate = member.attendedSessions + member.missedSessions > 0
        ? (member.attendedSessions / (member.attendedSessions + member.missedSessions)) * 100
        : 100;

      return (
        member.progressPercent < 40 ||
        attendanceRate < 60 ||
        member.missedSessions > 3
      );
    }).map((member) => ({
      id: member.id,
      userId: member.userId,
      name: member.user.name || member.user.arabicName || 'Unknown',
      profileImage: member.user.profileImage,
      progressPercent: member.progressPercent,
      attendedSessions: member.attendedSessions,
      missedSessions: member.missedSessions,
      attendanceRate: member.attendedSessions + member.missedSessions > 0
        ? Math.round((member.attendedSessions / (member.attendedSessions + member.missedSessions)) * 100)
        : 0,
      lastActive: member.lastActiveAt,
      risks: [
        member.progressPercent < 40 && 'Low progress',
        member.missedSessions > 3 && 'High absences',
        member.attendedSessions + member.missedSessions > 0 &&
        (member.attendedSessions / (member.attendedSessions + member.missedSessions)) * 100 < 60 &&
        'Poor attendance',
      ].filter(Boolean),
    }));

    // Calculate engagement metrics
    const totalSessions = cohort.sessions.length;
    const completedSessions = cohort.sessions.filter((s) => s.status === 'COMPLETED').length;
    const avgAttendance = completedSessions > 0
      ? Math.round(
          cohort.sessions
            .filter((s) => s.status === 'COMPLETED')
            .reduce((sum, s) => {
              const attended = s.attendance.filter((a: any) => a.attended).length;
              const rate = activeMembers.length > 0 ? (attended / activeMembers.length) * 100 : 0;
              return sum + rate;
            }, 0) / completedSessions
        )
      : 0;

    // Progress distribution
    const progressDistribution = {
      '0-25': activeMembers.filter((m) => m.progressPercent < 25).length,
      '25-50': activeMembers.filter((m) => m.progressPercent >= 25 && m.progressPercent < 50).length,
      '50-75': activeMembers.filter((m) => m.progressPercent >= 50 && m.progressPercent < 75).length,
      '75-100': activeMembers.filter((m) => m.progressPercent >= 75).length,
    };

    // Attendance trends (last 5 sessions)
    const recentSessions = cohort.sessions
      .filter((s) => s.status === 'COMPLETED')
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
      .slice(0, 5)
      .reverse();

    const attendanceTrend = recentSessions.map((session) => {
      const attended = session.attendance.filter((a: any) => a.attended).length;
      const rate = activeMembers.length > 0 ? Math.round((attended / activeMembers.length) * 100) : 0;
      
      return {
        sessionId: session.id,
        title: session.title,
        date: session.scheduledAt,
        attendanceRate: rate,
        attendedCount: attended,
        totalMembers: activeMembers.length,
      };
    });

    // Top performers (highest progress + attendance)
    const topPerformers = activeMembers
      .map((member) => {
        const attendanceRate = member.attendedSessions + member.missedSessions > 0
          ? (member.attendedSessions / (member.attendedSessions + member.missedSessions)) * 100
          : 0;
        
        const score = (member.progressPercent * 0.6) + (attendanceRate * 0.4);
        
        return {
          id: member.id,
          userId: member.userId,
          name: member.user.name || member.user.arabicName || 'Unknown',
          profileImage: member.user.profileImage,
          progressPercent: member.progressPercent,
          attendanceRate: Math.round(attendanceRate),
          attendedSessions: member.attendedSessions,
          score: Math.round(score),
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // Milestone progress
    const milestones = await prisma.cohortMilestone.findMany({
      where: { cohortId },
      orderBy: { dueDate: 'asc' },
    });

    const milestonesStats = {
      total: milestones.length,
      completed: milestones.filter((m) => m.isCompleted).length,
      upcoming: milestones.filter((m) => !m.isCompleted && new Date(m.dueDate) > new Date()).length,
      overdue: milestones.filter((m) => !m.isCompleted && new Date(m.dueDate) < new Date()).length,
    };

    // Capstone progress
    const capstoneStats = {
      submitted: cohort.members.filter((m) => m.capstoneSubmitted).length,
      pending: activeMembers.filter((m) => !m.capstoneSubmitted).length,
      submissionRate: activeMembers.length > 0
        ? Math.round((cohort.members.filter((m) => m.capstoneSubmitted).length / activeMembers.length) * 100)
        : 0,
    };

    // Time-based metrics
    const now = new Date();
    const totalDays = Math.ceil(
      (new Date(cohort.endDate).getTime() - new Date(cohort.startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const elapsedDays = Math.ceil(
      (now.getTime() - new Date(cohort.startDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysRemaining = Math.max(
      0,
      Math.ceil((new Date(cohort.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );
    const expectedProgress = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
    const progressPace = avgProgress - expectedProgress; // positive = ahead, negative = behind

    return NextResponse.json({
      overview: {
        totalMembers: cohort.members.length,
        activeMembers: activeMembers.length,
        completedMembers: completedMembers.length,
        droppedMembers: droppedMembers.length,
        pendingMembers: pendingMembers.length,
        avgProgress,
        completionRate,
        retentionRate,
        totalSessions,
        completedSessions,
        avgAttendance,
      },
      atRiskStudents: {
        count: atRiskStudents.length,
        students: atRiskStudents,
      },
      topPerformers,
      progressDistribution,
      attendanceTrend,
      milestones: milestonesStats,
      capstone: capstoneStats,
      timeMetrics: {
        totalDays,
        elapsedDays,
        daysRemaining,
        expectedProgress: Math.round(expectedProgress),
        actualProgress: avgProgress,
        progressPace: Math.round(progressPace),
        isOnTrack: progressPace >= -10, // Within 10% of expected
      },
      engagement: {
        avgSessionAttendance: avgAttendance,
        totalAnnouncements: cohort._count?.announcements || 0,
        activeMembersPercent: cohort.members.length > 0
          ? Math.round((activeMembers.length / cohort.members.length) * 100)
          : 0,
      },
    });
  } catch (error: any) {
    console.error('Error fetching cohort analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
