import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// DELETE /api/messaging/conversations/[id] - Soft delete conversation for current user
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        const participant = await prisma.conversationParticipant.findFirst({
            where: {
                conversationId: id,
                userId: session.user.id,
                isActive: true,
            },
        })

        if (!participant) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
        }

        await prisma.conversationParticipant.update({
            where: { id: participant.id },
            data: { isActive: false },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting conversation:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
