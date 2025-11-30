import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { requestId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { requestId } = params

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

    // Update request status to rejected
    await prisma.messageRequest.update({
      where: {
        id: requestId,
      },
      data: {
        status: 'REJECTED',
      },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Error rejecting message request:', error)
    return NextResponse.json(
      { error: 'Failed to reject message request' },
      { status: 500 }
    )
  }
}
