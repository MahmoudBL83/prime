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
    const { conversationId, content, messageType, replyToId, attachments } = body

    // Validate input
    if (!conversationId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify user is participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    })

    if (!participant) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 })
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content,
        messageType: messageType?.toUpperCase() || 'TEXT',
        replyToId: replyToId || null,
        attachments: attachments?.length
          ? {
              create: attachments.map((att: any) => ({
                fileName: att.fileName,
                fileSize: att.fileSize,
                fileType: att.fileType,
                fileUrl: att.fileUrl,
                thumbnailUrl: att.thumbnailUrl,
              })),
            }
          : undefined,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        attachments: true,
      },
    })

    // Update conversation updated time
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    })

    // Update participant's lastReadAt for sender
    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: { lastReadAt: new Date() },
    })

    // Format response
    const formattedMessage = {
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      senderName: message.sender.name,
      senderImage: message.sender.profileImage,
      createdAt: message.createdAt,
      read: false,
      type: message.messageType.toLowerCase(),
      replyTo: message.replyToId,
      reactions: [],
      fileUrl: message.attachments[0]?.fileUrl,
      fileName: message.attachments[0]?.fileName,
    }

    return NextResponse.json({ message: formattedMessage })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
