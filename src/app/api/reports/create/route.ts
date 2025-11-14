import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()
    const { type, targetId, reason, details } = body

    // Validate input
    if (!type || !targetId || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Valid report types
    const validTypes = [
      'CONVERSATION',
      'MESSAGE',
      'USER',
      'GROUP',
      'COURSE',
      'COMMENT',
      'POST',
    ]

    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }

    // Create report
    const report = await prisma.report.create({
      data: {
        reporterId: userId,
        type,
        targetId,
        reason,
        status: 'PENDING',
      },
    })

    // Create notification for admins (you can customize this)
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    })

    // Create notifications for all admins
    await Promise.all(
      admins.map((admin) =>
        prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'SYSTEM',
            title: 'New Report Submitted',
            message: `A ${type.toLowerCase()} has been reported for: ${reason}`,
            data: {
              reportId: report.id,
              type,
              targetId,
              reason,
              reporterId: userId,
            },
          },
        })
      )
    )

    return NextResponse.json({
      success: true,
      reportId: report.id,
      message: 'Report submitted successfully',
    })
  } catch (error) {
    console.error('Error creating report:', error)
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    )
  }
}
