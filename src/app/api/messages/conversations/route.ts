import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get all conversations where user is a participant
    const participants = await prisma.conversationParticipant.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                sender: {
                  select: {
                    id: true,
                    name: true,
                    profileImage: true,
                  },
                },
              },
            },
            participants: {
              where: {
                userId: { not: userId },
              },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    profileImage: true,
                    createdAt: true,
                  },
                },
              },
            },
            groups: {
              include: {
                members: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        profileImage: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    // Format conversations for frontend
    const conversations = participants.map((p) => {
      const conversation = p.conversation
      const lastMessage = conversation.messages[0]
      const isGroup = conversation.type === 'GROUP'
      const otherParticipant = conversation.participants[0]

      // Count unread messages
      const unreadCount = p.lastReadAt
        ? conversation.messages.filter(
            (m: any) => m.createdAt > p.lastReadAt && m.senderId !== userId
          ).length
        : 0

      if (isGroup && conversation.groups) {
        const group = conversation.groups
        return {
          id: conversation.id,
          isGroup: true,
          groupName: group.name,
          groupDescription: group.description,
          groupImage: null,
          cohortId: null,
          members: group.members.map((m) => ({
            id: m.user.id,
            name: m.user.name,
            image: m.user.profileImage,
            role: m.role.toLowerCase(),
            isOnline: false, // TODO: Implement online status
          })),
          admins: group.members
            .filter((m) => m.role === 'ADMIN')
            .map((m) => m.userId),
          user: {
            id: conversation.id,
            name: group.name,
            image: null,
            isOnline: true,
          },
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                createdAt: lastMessage.createdAt,
                read: !!p.lastReadAt && lastMessage.createdAt <= p.lastReadAt,
                senderId: lastMessage.senderId,
              }
            : undefined,
          unreadCount,
          isArchived: p.isArchived,
          isMuted: p.isMuted,
        }
      } else {
        // Direct conversation
        return {
          id: conversation.id,
          isGroup: false,
          user: {
            id: otherParticipant?.user.id || '',
            name: otherParticipant?.user.name || 'Unknown User',
            image: otherParticipant?.user.profileImage || null,
            isOnline: false, // TODO: Implement online status
            lastSeen: otherParticipant?.user.createdAt,
          },
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                createdAt: lastMessage.createdAt,
                read: !!p.lastReadAt && lastMessage.createdAt <= p.lastReadAt,
                senderId: lastMessage.senderId,
              }
            : undefined,
          unreadCount,
          isArchived: p.isArchived,
          isMuted: p.isMuted,
        }
      }
    })

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}
