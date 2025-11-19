import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const conversationRequestSchema = z.object({
    matchId: z.string(),
    otherUserId: z.string(),
})

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const validation = conversationRequestSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues },
                { status: 400 }
            )
        }

        const { matchId, otherUserId } = validation.data

        // Verify the match exists and belongs to the current user
        const match = await prisma.studyBuddyMatch.findFirst({
            where: {
                id: matchId,
                status: 'accepted',
                OR: [
                    { user1Id: session.user.id, user2Id: otherUserId },
                    { user1Id: otherUserId, user2Id: session.user.id },
                ],
            },
        })

        if (!match) {
            return NextResponse.json({ error: 'Match not found or not accepted' }, { status: 404 })
        }

        // Check if conversation already exists between these users
        const existingConversation = await prisma.conversation.findFirst({
            where: {
                type: 'DIRECT',
                participants: {
                    every: {
                        userId: {
                            in: [session.user.id, otherUserId]
                        }
                    }
                }
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                arabicName: true
                            }
                        }
                    }
                }
            }
        })

        let conversationId: string

        if (existingConversation) {
            conversationId = existingConversation.id
        } else {
            // Get other user details for conversation title
            const otherUser = await prisma.user.findUnique({
                where: { id: otherUserId },
                select: {
                    name: true,
                    arabicName: true
                }
            })

            if (!otherUser) {
                return NextResponse.json({ error: 'Other user not found' }, { status: 404 })
            }

            // Create new conversation
            const newConversation = await prisma.conversation.create({
                data: {
                    type: 'DIRECT',
                    title: `Study Session with ${otherUser.name}`,
                    description: 'Study buddy conversation',
                    participants: {
                        create: [
                            {
                                userId: session.user.id,
                                role: 'MEMBER',
                                joinedAt: new Date(),
                            },
                            {
                                userId: otherUserId,
                                role: 'MEMBER',
                                joinedAt: new Date(),
                            },
                        ]
                    }
                }
            })

            conversationId = newConversation.id

            // Update the study buddy match with the chat room ID
            await prisma.studyBuddyMatch.update({
                where: { id: matchId },
                data: { chatRoomId: conversationId }
            })

            // Send a welcome message
            await prisma.message.create({
                data: {
                    conversationId: conversationId,
                    senderId: session.user.id,
                    content: `Hi! I'm excited to be your study buddy. Let's start learning together! 🎉`,
                    messageType: 'TEXT'
                }
            })
        }

        return NextResponse.json({
            conversationId: conversationId,
            message: existingConversation ? 'Conversation found' : 'Conversation created'
        })

    } catch (error) {
        console.error('Study buddy conversation error:', error)
        return NextResponse.json(
            { error: 'Failed to create/find conversation' },
            { status: 500 }
        )
    }
}
