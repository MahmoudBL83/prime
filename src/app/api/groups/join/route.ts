import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { inviteCode } = await req.json()

        if (!inviteCode) {
            return NextResponse.json(
                { error: 'Invite code is required' },
                { status: 400 }
            )
        }

        // TODO: In production, query GroupInvite table to get the groupId
        // For now, we'll create a demo implementation
        
        // Find or create a demo group conversation
        // In a real implementation, you would:
        // 1. Query the GroupInvite table by inviteCode
        // 2. Get the groupId from the invite
        // 3. Check if it's expired
        // 4. Add user as participant

        // Demo: Create a new group conversation if it doesn't exist
        let conversation = await prisma.conversation.findFirst({
            where: {
                isGroup: true,
                name: 'Study Group' // Demo group name
            },
            include: {
                participants: true
            }
        })

        // If group doesn't exist, create it
        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    isGroup: true,
                    name: 'Study Group',
                    participants: {
                        create: {
                            userId: session.user.id,
                            isAdmin: true // First member is admin
                        }
                    }
                },
                include: {
                    participants: true
                }
            })
        } else {
            // Check if user is already a member
            const existingParticipant = conversation.participants.find(
                p => p.userId === session.user.id
            )

            if (existingParticipant) {
                return NextResponse.json(
                    { error: 'You are already a member of this group' },
                    { status: 400 }
                )
            }

            // Add user to the group
            await prisma.conversationParticipant.create({
                data: {
                    conversationId: conversation.id,
                    userId: session.user.id,
                    isAdmin: false
                }
            })

            // Create a system message announcing the new member
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { name: true, email: true }
            })

            await prisma.message.create({
                data: {
                    conversationId: conversation.id,
                    senderId: session.user.id,
                    content: `${user?.name || user?.email} joined the group`,
                    isSystemMessage: true
                }
            })
        }

        return NextResponse.json({
            success: true,
            conversationId: conversation.id,
            message: 'Successfully joined the group'
        })
    } catch (error) {
        console.error('Error joining group:', error)
        return NextResponse.json(
            { error: 'Failed to join group' },
            { status: 500 }
        )
    }
}
