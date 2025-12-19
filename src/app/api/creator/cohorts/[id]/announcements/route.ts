import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/creator/cohorts/[id]/announcements
 * List all announcements for a cohort
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
        { error: 'Only creators can view cohort announcements' },
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
            creatorId: true,
          },
        },
      },
    });

    if (!cohort) {
      return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    }

    if (cohort.course.creatorId !== creator.id) {
      return NextResponse.json(
        { error: 'You can only view announcements for your own cohorts' },
        { status: 403 }
      );
    }

    // Fetch announcements
    const announcements = await prisma.cohortAnnouncement.findMany({
      where: { cohortId },
      orderBy: [
        { isPinned: 'desc' }, // Pinned first
        { createdAt: 'desc' }, // Then by newest
      ],
    });

    return NextResponse.json({
      announcements,
      stats: {
        total: announcements.length,
        pinned: announcements.filter((a) => a.isPinned).length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/creator/cohorts/[id]/announcements
 * Create a new announcement for the cohort
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
        { error: 'Only creators can create announcements' },
        { status: 403 }
      );
    }

    const cohortId = id;

    // Verify cohort exists and ownership
    const cohort = await prisma.cohort.findUnique({
      where: { id: cohortId },
      include: {
        course: {
          select: {
            creatorId: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!cohort) {
      return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    }

    if (cohort.course.creatorId !== creator.id) {
      return NextResponse.json(
        { error: 'You can only create announcements for your own cohorts' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, titleAr, content, contentAr, isPinned, sendEmail } = body;

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Validate minimum lengths
    if (title.length < 5) {
      return NextResponse.json(
        { error: 'Title must be at least 5 characters' },
        { status: 400 }
      );
    }

    if (content.length < 10) {
      return NextResponse.json(
        { error: 'Content must be at least 10 characters' },
        { status: 400 }
      );
    }

    // Create announcement
    const announcement = await prisma.cohortAnnouncement.create({
      data: {
        cohortId,
        title,
        titleAr,
        content,
        contentAr,
        isPinned: isPinned || false,
        sendEmail: sendEmail || false,
        createdBy: session.user.id,
      },
    });

    // Send email notifications to all cohort members if requested
    if (sendEmail) {
      // Get all active members
      const members = await prisma.cohortMember.findMany({
        where: {
          cohortId,
          status: {
            in: ['ACTIVE', 'APPROVED'],
          },
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

      // Import and send emails to each member
      const { sendEmail: sendEmailFn } = await import('@/lib/email');

      // Send emails in parallel (with error handling for each)
      const emailPromises = members.map(async (member) => {
        try {
          await sendEmailFn({
            to: member.user.email,
            subject: `📢 New Announcement: ${title}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 20px; border-radius: 10px 10px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 24px;">📢 New Announcement</h1>
                </div>
                <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                  <p style="color: #374151;">Hello ${member.user.name || 'Student'},</p>
                  <h2 style="color: #1f2937; margin: 20px 0 10px;">${title}</h2>
                  <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #6366f1;">
                    ${content}
                  </div>
                  <p style="color: #6b7280; margin-top: 20px; font-size: 12px;">
                    This announcement was sent from your cohort. 
                    <a href="${process.env.NEXTAUTH_URL}/cohorts/${cohortId}" style="color: #6366f1;">View in platform</a>
                  </p>
                </div>
              </div>
            `
          });
          return { success: true, email: member.user.email };
        } catch (error) {
          console.error(`Failed to send email to ${member.user.email}:`, error);
          return { success: false, email: member.user.email, error };
        }
      });

      const results = await Promise.all(emailPromises);
      const successCount = results.filter(r => r.success).length;
      console.log(`Sent ${successCount}/${members.length} announcement emails for cohort ${cohortId}`);
    }

    return NextResponse.json(
      {
        message: 'Announcement created successfully',
        messageAr: 'تم إنشاء الإعلان بنجاح',
        announcement,
        notificationsSent: sendEmail ? cohort._count.members : 0,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating announcement:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
