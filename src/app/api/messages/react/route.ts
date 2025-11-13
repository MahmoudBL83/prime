import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
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
    const { messageId, emoji } = body

    // Validate input
    if (!messageId || !emoji) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get message to verify it exists
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: true },
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Verify user is participant in the conversation
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: message.conversationId,
          userId,
        },
      },
    })

    if (!participant) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 })
    }

    // Check if reaction already exists
    const existingReaction = await prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji,
        },
      },
    })

    if (existingReaction) {
      // Remove reaction if clicking same emoji
      await prisma.messageReaction.delete({
        where: { id: existingReaction.id },
      })

      return NextResponse.json({ action: 'removed', reactionId: existingReaction.id })
    } else {
      // Check if user has any reaction on this message
      const userReaction = await prisma.messageReaction.findFirst({
        where: {
          messageId,
          userId,
        },
      })

      if (userReaction) {
        // Update existing reaction to new emoji
        const updatedReaction = await prisma.messageReaction.update({
          where: { id: userReaction.id },
          data: { emoji },
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        })

        return NextResponse.json({
          action: 'updated',
          reaction: {
            id: updatedReaction.id,
            emoji: updatedReaction.emoji,
            userId: updatedReaction.userId,
            userName: updatedReaction.user.name,
          },
        })
      } else {
        // Create new reaction
        const newReaction = await prisma.messageReaction.create({
          data: {
            messageId,
            userId,
            emoji,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        })

        return NextResponse.json({
          action: 'added',
          reaction: {
            id: newReaction.id,
            emoji: newReaction.emoji,
            userId: newReaction.userId,
            userName: newReaction.user.name,
          },
        })
      }
    }
  } catch (error) {
    console.error('Error handling reaction:', error)
    return NextResponse.json(
      { error: 'Failed to handle reaction' },
      { status: 500 }
    )
  }
}
