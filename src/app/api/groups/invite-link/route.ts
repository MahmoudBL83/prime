import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// POST /api/groups/invite-link - Generate invite link for a group
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { groupId } = await req.json()

        if (!groupId) {
            return NextResponse.json({ error: 'Group ID is required' }, { status: 400 })
        }

        // Check if user is a member of the group
        const conversation = await prisma.conversation.findUnique({
            where: { id: groupId },
            include: {
                participants: {
                    where: {
                        userId: session.user.id
                    }
                }
            }
        })

        if (!conversation) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 })
        }

        if (conversation.participants.length === 0) {
            return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })
        }

        // Generate a unique invite code
        const inviteCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

        // Store the invite code (you can create a GroupInvite model if needed)
        // For now, we'll just return the code
        // In production, you'd want to store this with expiration, usage limits, etc.

        return NextResponse.json({
            inviteCode,
            groupId,
            groupName: conversation.title || 'Group',
            expiresAt: null, // null means never expires
        })
    } catch (error) {
        console.error('Error generating invite link:', error)
        return NextResponse.json(
            { error: 'Failed to generate invite link' },
            { status: 500 }
        )
    }
}
