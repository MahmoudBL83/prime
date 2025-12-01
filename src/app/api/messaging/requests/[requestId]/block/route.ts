import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const { requestId } = await params
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the message request
    const messageRequest = await prisma.messageRequest.findUnique({
      where: {
        id: requestId,
      },
    })

    if (!messageRequest) {
      return NextResponse.json(
        { error: 'Message request not found' },
        { status: 404 }
      )
    }

    if (messageRequest.recipientId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Update request status to blocked
    await prisma.messageRequest.update({
      where: {
        id: requestId,
      },
      data: {
        status: 'BLOCKED',
      },
    })

    // Create a block relationship
    await prisma.blockedUser.create({
      data: {
        userId: session.user.id,
        blockedUserId: messageRequest.senderId,
      },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Error blocking user:', error)
    return NextResponse.json(
      { error: 'Failed to block user' },
      { status: 500 }
    )
  }
}
