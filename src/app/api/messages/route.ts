import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/messages - Send a message
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
        const { recipientId, content, type = 'text', attachmentUrl } = body

        // Validate required fields
        if (!recipientId || !content) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Validate type
        if (!['text', 'image', 'tip'].includes(type)) {
            return NextResponse.json(
                { error: 'Invalid message type' },
                { status: 400 }
            )
        }

        // Get recipient user
        const recipient = await prisma.user.findUnique({
            where: { id: recipientId },
            select: {
                id: true,
                name: true,
                email: true
            }
        })

        if (!recipient) {
            return NextResponse.json(
                { error: 'Recipient not found' },
                { status: 404 }
            )
        }

        // Check if recipient is a creator and user has access
        const creator = await prisma.creator.findFirst({
            where: { userId: recipientId }
        })

        if (creator) {
            // Check if user has active subscription to this creator
            const hasSubscription = await prisma.mentorSubscription.findFirst({
                where: {
                    userId: session.user.id,
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

        // Create message
        const message = await prisma.message.create({
            data: {
                senderId: session.user.id,
                recipientId: recipientId,
                content: content,
                type: type,
                attachmentUrl: attachmentUrl || null,
                read: false
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        profileImage: true
                    }
                },
                recipient: {
                    select: {
                        id: true,
                        name: true,
                        profileImage: true
                    }
                }
            }
        })

        // Create notification for recipient
        await prisma.notification.create({
            data: {
                userId: recipientId,
                type: 'NEW_MESSAGE',
                title: `New message from ${session.user.name}`,
                message: type === 'text' ? content.substring(0, 100) : `Sent a ${type}`,
                metadata: {
                    messageId: message.id,
                    senderId: session.user.id,
                    senderName: session.user.name
                }
            }
        })

        // TODO: Send push notification
        // TODO: Send email notification if user has email notifications enabled

        return NextResponse.json({
            success: true,
            message: {
                id: message.id,
                content: message.content,
                type: message.type,
                attachmentUrl: message.attachmentUrl,
                sender: message.sender,
                recipient: message.recipient,
                createdAt: message.createdAt,
                read: message.read
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

// GET /api/messages?userId=xxx - Get conversation with a user
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
        const userId = searchParams.get('userId')

        if (!userId) {
            // Get all conversations
            const messages = await prisma.message.findMany({
                where: {
                    OR: [
                        { senderId: session.user.id },
                        { recipientId: session.user.id }
                    ]
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            profileImage: true
                        }
                    },
                    recipient: {
                        select: {
                            id: true,
                            name: true,
                            profileImage: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: 100
            })

            // Group by conversation
            const conversations = new Map()
            messages.forEach(msg => {
                const otherUserId = msg.senderId === session.user.id 
                    ? msg.recipientId 
                    : msg.senderId
                
                if (!conversations.has(otherUserId)) {
                    conversations.set(otherUserId, {
                        userId: otherUserId,
                        user: msg.senderId === session.user.id ? msg.recipient : msg.sender,
                        lastMessage: msg,
                        unreadCount: 0
                    })
                }

                if (msg.recipientId === session.user.id && !msg.read) {
                    const conv = conversations.get(otherUserId)
                    conv.unreadCount++
                }
            })

            return NextResponse.json({
                conversations: Array.from(conversations.values())
            })

        } else {
            // Get conversation with specific user
            const messages = await prisma.message.findMany({
                where: {
                    OR: [
                        { senderId: session.user.id, recipientId: userId },
                        { senderId: userId, recipientId: session.user.id }
                    ]
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            profileImage: true
                        }
                    },
                    recipient: {
                        select: {
                            id: true,
                            name: true,
                            profileImage: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'asc'
                }
            })

            // Mark messages as read
            await prisma.message.updateMany({
                where: {
                    senderId: userId,
                    recipientId: session.user.id,
                    read: false
                },
                data: {
                    read: true
                }
            })

            return NextResponse.json({
                messages
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
