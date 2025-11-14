import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        notificationSettings: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return notification settings or default values
    const settings = user.notificationSettings || {
      emailNotifications: true,
      pushNotifications: false,
      courseUpdates: true,
      newMessages: true,
      studyBuddyRequests: true,
      marketingEmails: false,
      weeklyDigest: true,
    };

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification settings' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      emailNotifications,
      pushNotifications,
      courseUpdates,
      newMessages,
      studyBuddyRequests,
      marketingEmails,
      weeklyDigest,
    } = body;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Upsert notification settings
    const settings = await prisma.notificationSetting.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        emailNotifications: emailNotifications ?? true,
        pushNotifications: pushNotifications ?? false,
        courseUpdates: courseUpdates ?? true,
        newMessages: newMessages ?? true,
        studyBuddyRequests: studyBuddyRequests ?? true,
        marketingEmails: marketingEmails ?? false,
        weeklyDigest: weeklyDigest ?? true,
      },
      update: {
        emailNotifications,
        pushNotifications,
        courseUpdates,
        newMessages,
        studyBuddyRequests,
        marketingEmails,
        weeklyDigest,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      settings,
      message: 'Notification settings saved successfully',
    });
  } catch (error) {
    console.error('Error saving notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to save notification settings' },
      { status: 500 }
    );
  }
}
