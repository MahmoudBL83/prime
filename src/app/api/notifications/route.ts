import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const offset = parseInt(searchParams.get('offset') || '0')
    const unreadOnly = searchParams.get('unread') === 'true'

    // Build where clause
    const where: any = {
      userId: session.user.id,
    }

    if (unreadOnly) {
      where.isRead = false
    }

    // Fetch notifications from database
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          isRead: true,
          createdAt: true,
          data: true,
        },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          userId: session.user.id,
          isRead: false,
        },
      }),
    ])

    // Format notifications for frontend
    const formattedNotifications = notifications.map((n) => {
      let parsedData: any = {}
      try {
        if (n.data) {
          parsedData = typeof n.data === 'string' ? JSON.parse(n.data) : n.data
        }
      } catch {
        // Ignore parse errors
      }

      return {
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.isRead,
        createdAt: n.createdAt.toISOString(),
        actionUrl: parsedData.actionUrl || null,
        priority: parsedData.priority || 'medium',
        sender: parsedData.sender || null,
        imageUrl: parsedData.imageUrl || null,
      }
    })

    return NextResponse.json({
      notifications: formattedNotifications,
      unreadCount,
      total,
      hasMore: offset + notifications.length < total,
    })

  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { notificationIds } = body

    // Mark notifications as read
    const whereClause = notificationIds?.length
      ? { id: { in: notificationIds }, userId: session.user.id }
      : { userId: session.user.id, isRead: false }

    await prisma.notification.updateMany({
      where: whereClause,
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })

    return NextResponse.json({ message: 'Notifications marked as read' })

  } catch (error) {
    console.error('Update notifications error:', error)
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const notificationId = searchParams.get('id')

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 })
    }

    // Delete notification (only if it belongs to the user)
    await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ message: 'Notification deleted' })

  } catch (error) {
    console.error('Delete notification error:', error)
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { ids } = body

    // Bulk delete notifications
    if (ids?.length) {
      await prisma.notification.deleteMany({
        where: {
          id: { in: ids },
          userId: session.user.id,
        },
      })

      return NextResponse.json({
        message: `${ids.length} notifications deleted`,
        deleted: ids.length
      })
    }

    return NextResponse.json({ error: 'No notification IDs provided' }, { status: 400 })

  } catch (error) {
    console.error('Bulk delete notifications error:', error)
    return NextResponse.json(
      { error: 'Failed to delete notifications' },
      { status: 500 }
    )
  }
}
