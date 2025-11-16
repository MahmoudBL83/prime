import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const moderatorSchema = z.object({
    userId: z.string(),
    role: z.enum(['MODERATOR', 'ADMIN']).default('MODERATOR')
})

// POST /api/creator/groups/[id]/moderators - Add moderator
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 })
        }

        const groupId = id
        const body = await request.json()
        const { userId, role } = moderatorSchema.parse(body)

        // Verify group ownership
        const group = await prisma.memberGroup.findFirst({
            where: {
                id: groupId,
                channel: {
                    creatorId: creator.id
                }
            }
        })

        if (!group) {
            return NextResponse.json({ error: 'Group not found or not owned by you' }, { status: 404 })
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userId }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Check if already a moderator
        const existing = await prisma.groupModerator.findFirst({
            where: {
                groupId,
                userId
            }
        })

        if (existing) {
            return NextResponse.json({ error: 'User is already a moderator' }, { status: 400 })
        }

        // Add moderator
        const moderator = await prisma.groupModerator.create({
            data: {
                groupId,
                userId,
                role
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Moderator added successfully',
            moderator: {
                id: moderator.id,
                userId: moderator.userId,
                userName: moderator.user.name,
                userEmail: moderator.user.email,
                role: moderator.role,
                assignedAt: moderator.assignedAt
            }
        }, { status: 201 })

    } catch (error: any) {
        console.error('Error adding moderator:', error)
        
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.errors },
                { status: 400 }
            )
        }

        return NextResponse.json({ error: 'Failed to add moderator' }, { status: 500 })
    }
}

// GET /api/creator/groups/[id]/moderators - List moderators
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 })
        }

        const groupId = id

        // Verify group ownership
        const group = await prisma.memberGroup.findFirst({
            where: {
                id: groupId,
                channel: {
                    creatorId: creator.id
                }
            }
        })

        if (!group) {
            return NextResponse.json({ error: 'Group not found or not owned by you' }, { status: 404 })
        }

        const moderators = await prisma.groupModerator.findMany({
            where: { groupId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: { assignedAt: 'desc' }
        })

        return NextResponse.json({
            success: true,
            moderators: moderators.map(m => ({
                id: m.id,
                userId: m.userId,
                userName: m.user.name,
                userEmail: m.user.email,
                role: m.role,
                assignedAt: m.assignedAt
            }))
        })

    } catch (error) {
        console.error('Error fetching moderators:', error)
        return NextResponse.json({ error: 'Failed to fetch moderators' }, { status: 500 })
    }
}

// DELETE /api/creator/groups/[id]/moderators - Remove moderator
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 })
        }

        const groupId = id
        const searchParams = request.nextUrl.searchParams
        const moderatorId = searchParams.get('moderatorId')

        if (!moderatorId) {
            return NextResponse.json({ error: 'Moderator ID required' }, { status: 400 })
        }

        // Verify group ownership
        const group = await prisma.memberGroup.findFirst({
            where: {
                id: groupId,
                channel: {
                    creatorId: creator.id
                }
            }
        })

        if (!group) {
            return NextResponse.json({ error: 'Group not found or not owned by you' }, { status: 404 })
        }

        // Remove moderator
        await prisma.groupModerator.delete({
            where: { id: moderatorId }
        })

        return NextResponse.json({
            success: true,
            message: 'Moderator removed successfully'
        })

    } catch (error) {
        console.error('Error removing moderator:', error)
        return NextResponse.json({ error: 'Failed to remove moderator' }, { status: 500 })
    }
}
