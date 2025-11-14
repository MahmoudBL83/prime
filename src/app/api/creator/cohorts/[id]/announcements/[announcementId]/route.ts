import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/creator/cohorts/[id]/announcements/[announcementId]
 * Get a specific announcement
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; announcementId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, announcementId } = await params;
    // Verify creator status
    const creator = await prisma.creator.findUnique({
      where: { userId: session.user.id },
    });

    if (!creator) {
      return NextResponse.json(
        { error: 'Only creators can view announcements' },
        { status: 403 }
      );
    }

    const { id: cohortId, announcementId } = params;

    // Fetch announcement with cohort info for ownership verification
    const announcement = await prisma.cohortAnnouncement.findUnique({
      where: { id: announcementId },
      include: {
        cohort: {
          include: {
            course: {
              select: {
                creatorId: true,
              },
            },
          },
        },
      },
    });

    if (!announcement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      );
    }

    // Verify cohort ownership
    if (announcement.cohort.course.creatorId !== creator.id) {
      return NextResponse.json(
        { error: 'You can only view announcements for your own cohorts' },
        { status: 403 }
      );
    }

    // Verify announcement belongs to the cohort
    if (announcement.cohortId !== cohortId) {
      return NextResponse.json(
        { error: 'Announcement does not belong to this cohort' },
        { status: 400 }
      );
    }

    return NextResponse.json({ announcement });
  } catch (error: any) {
    console.error('Error fetching announcement:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/creator/cohorts/[id]/announcements/[announcementId]
 * Update an announcement
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; announcementId: string } }
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
        { error: 'Only creators can update announcements' },
        { status: 403 }
      );
    }

    const { id: cohortId, announcementId } = params;

    // Verify announcement exists and ownership
    const existingAnnouncement = await prisma.cohortAnnouncement.findUnique({
      where: { id: announcementId },
      include: {
        cohort: {
          include: {
            course: {
              select: {
                creatorId: true,
              },
            },
          },
        },
      },
    });

    if (!existingAnnouncement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      );
    }

    if (existingAnnouncement.cohort.course.creatorId !== creator.id) {
      return NextResponse.json(
        { error: 'You can only update your own announcements' },
        { status: 403 }
      );
    }

    if (existingAnnouncement.cohortId !== cohortId) {
      return NextResponse.json(
        { error: 'Announcement does not belong to this cohort' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, titleAr, content, contentAr, isPinned } = body;

    // Build update object (only include provided fields)
    const updateData: any = {};

    if (title !== undefined) {
      if (title.length < 5) {
        return NextResponse.json(
          { error: 'Title must be at least 5 characters' },
          { status: 400 }
        );
      }
      updateData.title = title;
    }

    if (titleAr !== undefined) updateData.titleAr = titleAr;

    if (content !== undefined) {
      if (content.length < 10) {
        return NextResponse.json(
          { error: 'Content must be at least 10 characters' },
          { status: 400 }
        );
      }
      updateData.content = content;
    }

    if (contentAr !== undefined) updateData.contentAr = contentAr;
    if (isPinned !== undefined) updateData.isPinned = isPinned;

    // Update announcement
    const updatedAnnouncement = await prisma.cohortAnnouncement.update({
      where: { id: announcementId },
      data: updateData,
    });

    return NextResponse.json({
      message: 'Announcement updated successfully',
      messageAr: 'تم تحديث الإعلان بنجاح',
      announcement: updatedAnnouncement,
    });
  } catch (error: any) {
    console.error('Error updating announcement:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/creator/cohorts/[id]/announcements/[announcementId]
 * Delete an announcement
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; announcementId: string } }
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
        { error: 'Only creators can delete announcements' },
        { status: 403 }
      );
    }

    const { id: cohortId, announcementId } = params;

    // Verify announcement exists and ownership
    const announcement = await prisma.cohortAnnouncement.findUnique({
      where: { id: announcementId },
      include: {
        cohort: {
          include: {
            course: {
              select: {
                creatorId: true,
              },
            },
          },
        },
      },
    });

    if (!announcement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      );
    }

    if (announcement.cohort.course.creatorId !== creator.id) {
      return NextResponse.json(
        { error: 'You can only delete your own announcements' },
        { status: 403 }
      );
    }

    if (announcement.cohortId !== cohortId) {
      return NextResponse.json(
        { error: 'Announcement does not belong to this cohort' },
        { status: 400 }
      );
    }

    // Delete announcement
    await prisma.cohortAnnouncement.delete({
      where: { id: announcementId },
    });

    return NextResponse.json({
      message: 'Announcement deleted successfully',
      messageAr: 'تم حذف الإعلان بنجاح',
    });
  } catch (error: any) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
