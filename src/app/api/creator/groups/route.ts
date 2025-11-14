import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createGroupSchema = z.object({
    channelId: z.string(),
    name: z.string().min(3).max(100),
    nameAr: z.string().min(3).max(100).optional(),
    description: z.string().optional(),
    descriptionAr: z.string().optional(),
    rules: z.string().optional(),
    rulesAr: z.string().optional(),
    minTier: z.enum(['BRONZE', 'SILVER', 'GOLD']),
    isPrivate: z.boolean().default(false),
    maxMembers: z.number().int().min(2).max(10000).optional()
})

// GET /api/creator/groups - List all groups for creator's channels
export async function GET(request: NextRequest) {
    try {
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

        const searchParams = request.nextUrl.searchParams
        const channelId = searchParams.get('channelId')

        const groups = await prisma.memberGroup.findMany({
            where: {
                channel: {
                    creatorId: creator.id,
                    ...(channelId ? { id: channelId } : {})
                }
            },
            include: {
                channel: {
                    select: {
                        id: true,
                        name: true,
                        nameAr: true
                    }
                },
                _count: {
                    select: {
                        members: true,
                        posts: true
                    }
                },
                moderators: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    },
                    take: 5
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({
            success: true,
            groups: groups.map(g => ({
                id: g.id,
                name: g.name,
                nameAr: g.nameAr,
                description: g.description,
                descriptionAr: g.descriptionAr,
                rules: g.rules,
                rulesAr: g.rulesAr,
                minTier: g.minTier,
                isPrivate: g.isPrivate,
                maxMembers: g.maxMembers,
                memberCount: g._count.members,
                postCount: g._count.posts,
                channel: g.channel,
                moderators: g.moderators.map(m => ({
                    id: m.id,
                    userId: m.userId,
                    userName: m.user.name,
                    userEmail: m.user.email,
                    role: m.role,
                    assignedAt: m.assignedAt
                })),
                createdAt: g.createdAt
            }))
        })
    } catch (error) {
        console.error('Error fetching groups:', error)
        return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 })
    }
}

// POST /api/creator/groups - Create new community group
export async function POST(request: NextRequest) {
    try {
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

        const body = await request.json()
        const validated = createGroupSchema.parse(body)

        // Verify channel ownership
        const channel = await prisma.creatorChannel.findFirst({
            where: {
                id: validated.channelId,
                creatorId: creator.id
            }
        })

        if (!channel) {
            return NextResponse.json({ error: 'Channel not found or not owned by you' }, { status: 404 })
        }

        // Create group
        const group = await prisma.memberGroup.create({
            data: {
                channelId: validated.channelId,
                name: validated.name,
                nameAr: validated.nameAr,
                description: validated.description,
                descriptionAr: validated.descriptionAr,
                rules: validated.rules,
                rulesAr: validated.rulesAr,
                minTier: validated.minTier,
                isPrivate: validated.isPrivate,
                maxMembers: validated.maxMembers
            },
            include: {
                channel: {
                    select: {
                        name: true,
                        nameAr: true
                    }
                }
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Group created successfully',
            group: {
                id: group.id,
                name: group.name,
                nameAr: group.nameAr,
                description: group.description,
                minTier: group.minTier,
                channel: group.channel,
                createdAt: group.createdAt
            }
        }, { status: 201 })

    } catch (error: any) {
        console.error('Error creating group:', error)
        
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.errors },
                { status: 400 }
            )
        }

        return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
    }
}

// PUT /api/creator/groups - Update group
export async function PUT(request: NextRequest) {
    try {
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

        const body = await request.json()
        const { groupId, ...updates } = body

        if (!groupId) {
            return NextResponse.json({ error: 'Group ID required' }, { status: 400 })
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

        // Update group
        const updated = await prisma.memberGroup.update({
            where: { id: groupId },
            data: {
                ...(updates.name && { name: updates.name }),
                ...(updates.nameAr && { nameAr: updates.nameAr }),
                ...(updates.description !== undefined && { description: updates.description }),
                ...(updates.descriptionAr !== undefined && { descriptionAr: updates.descriptionAr }),
                ...(updates.rules !== undefined && { rules: updates.rules }),
                ...(updates.rulesAr !== undefined && { rulesAr: updates.rulesAr }),
                ...(updates.minTier && { minTier: updates.minTier }),
                ...(updates.isPrivate !== undefined && { isPrivate: updates.isPrivate }),
                ...(updates.maxMembers && { maxMembers: updates.maxMembers })
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Group updated successfully',
            group: updated
        })

    } catch (error) {
        console.error('Error updating group:', error)
        return NextResponse.json({ error: 'Failed to update group' }, { status: 500 })
    }
}

// DELETE /api/creator/groups - Delete group
export async function DELETE(request: NextRequest) {
    try {
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

        const searchParams = request.nextUrl.searchParams
        const groupId = searchParams.get('groupId')

        if (!groupId) {
            return NextResponse.json({ error: 'Group ID required' }, { status: 400 })
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

        // Delete group (cascade will remove members and posts)
        await prisma.memberGroup.delete({
            where: { id: groupId }
        })

        return NextResponse.json({
            success: true,
            message: 'Group deleted successfully'
        })

    } catch (error) {
        console.error('Error deleting group:', error)
        return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 })
    }
}
