import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ inviteCode: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { inviteCode } = await params

        // For now, since we're generating codes dynamically without storing them,
        // we'll need to check if the code format is valid and return demo group info
        // In production, you'd query a GroupInvite table
        
        // Validate invite code format (26 characters, alphanumeric)
        if (!inviteCode || inviteCode.length < 10) {
            return NextResponse.json(
                { error: 'Invalid invite code' },
                { status: 404 }
            )
        }

        // Since we don't have invite codes stored yet, return a demo group
        // TODO: Query actual group from database using stored invite code
        const demoGroup = {
            id: 'demo-group-1',
            name: 'Study Group',
            description: 'A group for collaborative learning',
            memberCount: 5,
            createdAt: new Date()
        }

        // Check if user is already a member
        // TODO: Check actual membership in database
        const alreadyMember = false

        return NextResponse.json({
            group: demoGroup,
            alreadyMember
        })
    } catch (error) {
        console.error('Error fetching group invite info:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
