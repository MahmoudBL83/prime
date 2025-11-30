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
      include: {
        sender: true,
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

    // Update request status to approved
    await prisma.messageRequest.update({
      where: {
        id: requestId,
      },
      data: {
        status: 'APPROVED',
      },
    })

    // Create or find existing conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        participants: {
          every: {
            userId: {
              in: [session.user.id, messageRequest.senderId],
            },
          },
        },
      },
    })

    if (!conversation) {
      // Create new conversation
      conversation = await prisma.conversation.create({
        data: {
          type: 'DIRECT',
          participants: {
            create: [
              {
                userId: session.user.id,
                role: 'MEMBER',
              },
              {
                userId: messageRequest.senderId,
                role: 'MEMBER',
              },
            ],
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      conversationId: conversation.id,
    })
  } catch (error) {
    console.error('Error approving message request:', error)
    return NextResponse.json(
      { error: 'Failed to approve message request' },
      { status: 500 }
    )
  }
}
