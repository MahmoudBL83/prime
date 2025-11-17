import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/messages - Send a message to a conversation
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await req.json()
        const { conversationId, content, messageType = 'TEXT', replyToId } = body

        // Validate required fields
        if (!conversationId || !content) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Validate message type
        const validTypes = ['TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'FILE', 'VOICE_NOTE', 'SYSTEM']
        if (!validTypes.includes(messageType)) {
            return NextResponse.json(
                { error: 'Invalid message type' },
                { status: 400 }
            )
        }

        // Verify user has access to the conversation
        const participant = await prisma.conversationParticipant.findFirst({
            where: {
                conversationId: conversationId,
                userId: session.user.id,
                isActive: true
            },
            include: {
                conversation: {
                    include: {
                        participants: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        if (!participant) {
            return NextResponse.json(
                { error: 'Conversation not found or access denied' },
                { status: 404 }
            )
        }

        // Check if this is a direct message to a creator and user has subscription
        const conversation = participant.conversation
        if (conversation.type === 'DIRECT' && conversation.participants.length === 2) {
            // Find the other participant (creator)
            const otherParticipant = conversation.participants.find(p => p.userId !== session.user.id)
            if (otherParticipant) {
                const creator = await prisma.creator.findFirst({
                    where: { userId: otherParticipant.userId }
                })

                if (creator) {
                    // Check if user has active subscription to this creator
                    const hasSubscription = await prisma.mentorSubscription.findFirst({
                        where: {
                            studentId: session.user.id,
                            creatorId: creator.id,
                            status: 'ACTIVE',
                            tier: {
                                in: ['PREMIUM', 'VIP'] // Only premium/VIP can message
                            }
                        }
                    })

                    if (!hasSubscription) {
                        return NextResponse.json(
                            { error: 'You need a Premium or VIP subscription to message this creator' },
                            { status: 403 }
                        )
                    }
                }
            }
        }

        // Create message
        const message = await prisma.message.create({
            data: {
                conversationId: conversationId,
                senderId: session.user.id,
                content: content,
                messageType: messageType as any,
                replyToId: replyToId || null
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        profileImage: true
                    }
                },
                conversation: {
                    include: {
                        participants: {
                            where: {
                                userId: {
                                    not: session.user.id
                                }
                            },
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        // Create notifications for other participants
        const otherParticipants = conversation.participants.filter(p => p.userId !== session.user.id)
        for (const participant of otherParticipants) {
            await prisma.notification.create({
                data: {
                    userId: participant.userId,
                    type: 'MESSAGE',
                    title: `New message from ${session.user.name}`,
                    message: messageType === 'TEXT' ? content.substring(0, 100) : `Sent a ${messageType.toLowerCase()}`,
                    data: {
                        messageId: message.id,
                        conversationId: conversationId,
                        senderId: session.user.id,
                        senderName: session.user.name
                    }
                }
            })
        }

        return NextResponse.json({
            success: true,
            message: {
                id: message.id,
                content: message.content,
                messageType: message.messageType,
                sender: message.sender,
                conversationId: message.conversationId,
                createdAt: message.createdAt
            }
        })

    } catch (error) {
        console.error('Message error:', error)
        return NextResponse.json(
            { error: 'Failed to send message' },
            { status: 500 }
        )
    }
}

// GET /api/messages?conversationId=xxx - Get messages for a conversation
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(req.url)
        const conversationId = searchParams.get('conversationId')

        if (!conversationId) {
            // Get all conversations the user is part of
            const participants = await prisma.conversationParticipant.findMany({
                where: {
                    userId: session.user.id,
                    isActive: true
                },
                include: {
                    conversation: {
                        include: {
                            participants: {
                                where: {
                                    userId: {
                                        not: session.user.id
                                    }
                                },
                                include: {
                                    user: {
                                        select: {
                                            id: true,
                                            name: true,
                                            profileImage: true,
                                            arabicName: true
                                        }
                                    }
                                }
                            },
                            messages: {
                                orderBy: { createdAt: 'desc' },
                                take: 1,
                                include: {
                                    sender: {
                                        select: {
                                            id: true,
                                            name: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    conversation: {
                        updatedAt: 'desc'
                    }
                }
            })

            // Format conversations
            const conversations = participants.map(participant => {
                const conversation = participant.conversation
                const otherParticipant = conversation.participants[0]
                const lastMessage = conversation.messages[0]

                return {
                    id: conversation.id,
                    type: conversation.type,
                    title: conversation.title || otherParticipant?.user?.name || 'Unknown',
                    avatar: conversation.avatar || otherParticipant?.user?.profileImage,
                    lastMessage: lastMessage ? {
                        content: lastMessage.content,
                        senderName: lastMessage.sender.name,
                        createdAt: lastMessage.createdAt
                    } : null,
                    participants: conversation.participants.map(p => ({
                        id: p.user.id,
                        name: p.user.name,
                        profileImage: p.user.profileImage
                    })),
                    unreadCount: 0, // TODO: Implement unread count
                    updatedAt: conversation.updatedAt
                }
            })

            return NextResponse.json({
                conversations
            })

        } else {
            // Get messages for specific conversation
            // Verify user has access to conversation
            const participant = await prisma.conversationParticipant.findFirst({
                where: {
                    conversationId: conversationId,
                    userId: session.user.id,
                    isActive: true
                }
            })

            if (!participant) {
                return NextResponse.json(
                    { error: 'Conversation not found or access denied' },
                    { status: 404 }
                )
            }

            // Get messages
            const messages = await prisma.message.findMany({
                where: {
                    conversationId: conversationId,
                    isDeleted: false
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            profileImage: true,
                            arabicName: true
                        }
                    },
                    attachments: true,
                    reactions: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    createdAt: 'asc'
                }
            })

            // Update last read timestamp for user
            await prisma.conversationParticipant.update({
                where: {
                    id: participant.id
                },
                data: {
                    lastReadAt: new Date()
                }
            })

            return NextResponse.json({
                messages: messages.map(message => ({
                    id: message.id,
                    content: message.content,
                    messageType: message.messageType,
                    sender: message.sender,
                    attachments: message.attachments,
                    reactions: message.reactions,
                    replyToId: message.replyToId,
                    isEdited: message.edited,
                    isPinned: message.isPinned,
                    isStarred: message.isStarred,
                    createdAt: message.createdAt,
                    updatedAt: message.updatedAt
                }))
            })
        }

    } catch (error) {
        console.error('Failed to fetch messages:', error)
        return NextResponse.json(
            { error: 'Failed to fetch messages' },
            { status: 500 }
        )
    }
}
