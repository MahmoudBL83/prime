import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch members of a group (creator/moderator only)
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const groupId = searchParams.get('groupId')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')

        if (!groupId) {
            return NextResponse.json(
                { error: 'Group ID is required' },
                { status: 400 }
            )
        }

        const skip = (page - 1) * limit

        // Verify creator ownership or moderator status
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        let hasAccess = false

        if (creator) {
            const group = await prisma.memberGroup.findFirst({
                where: {
                    id: groupId,
                    channel: {
                        creatorId: creator.id
                    }
                }
            })
            hasAccess = !!group
        }

        if (!hasAccess) {
            const moderator = await prisma.groupModerator.findFirst({
                where: {
                    groupId,
                    userId: session.user.id
                }
            })
            hasAccess = !!moderator
        }

        if (!hasAccess) {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            )
        }

        // Fetch members and users separately
        const [members, total] = await Promise.all([
            prisma.channelGroupMember.findMany({
                where: { groupId },
                orderBy: { joinedAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.channelGroupMember.count({ where: { groupId } })
        ])

        // Get user data for all members
        const userIds = members.map(m => m.userId)
        const users = await prisma.user.findMany({
            where: {
                id: {
                    in: userIds
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                profileImage: true
            }
        })

        // Create a map for quick lookup
        const userMap = new Map(users.map(user => [user.id, user]))

        // Check moderator status for each member
        const membersWithRoles = await Promise.all(
            members.map(async (member) => {
                const isModerator = await prisma.groupModerator.findFirst({
                    where: {
                        groupId,
                        userId: member.userId
                    }
                })

                const postCount = await prisma.groupPost.count({
                    where: {
                        groupId,
                        userId: member.userId
                    }
                })

                return {
                    ...member,
                    user: userMap.get(member.userId),
                    isModerator: !!isModerator,
                    postCount
                }
            })
        )

        return NextResponse.json({
            success: true,
            data: {
                members: membersWithRoles,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        })
    } catch (error) {
        console.error('Error fetching members:', error)
        return NextResponse.json(
            { error: 'Failed to fetch members' },
            { status: 500 }
        )
    }
}

// POST - Add member to group or promote to moderator
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { groupId, userId, action } = body

        if (!groupId || !userId || !action) {
            return NextResponse.json(
                { error: 'Group ID, user ID, and action are required' },
                { status: 400 }
            )
        }

        // Verify creator ownership
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json(
                { error: 'Only creators can manage members' },
                { status: 403 }
            )
        }

        const group = await prisma.memberGroup.findFirst({
            where: {
                id: groupId,
                channel: {
                    creatorId: creator.id
                }
            },
            include: {
                _count: {
                    select: {
                        members: true
                    }
                }
            }
        })

        if (!group) {
            return NextResponse.json(
                { error: 'Group not found or access denied' },
                { status: 404 }
            )
        }

        if (action === 'add_member') {
            // Check max members limit
            if (group.maxMembers && group._count.members >= group.maxMembers) {
                return NextResponse.json(
                    { error: 'Group has reached maximum capacity' },
                    { status: 400 }
                )
            }

            // Check if already member
            const existing = await prisma.channelGroupMember.findFirst({
                where: { groupId, userId }
            })

            if (existing) {
                return NextResponse.json(
                    { error: 'User is already a member' },
                    { status: 400 }
                )
            }

            // Add member
            const member = await prisma.channelGroupMember.create({
                data: {
                    groupId,
                    userId
                }
            })

            return NextResponse.json({
                success: true,
                message: 'Member added successfully',
                data: member
            })
        } else if (action === 'promote_moderator') {
            // Check if user is member
            const member = await prisma.channelGroupMember.findFirst({
                where: { groupId, userId }
            })

            if (!member) {
                return NextResponse.json(
                    { error: 'User is not a member of this group' },
                    { status: 400 }
                )
            }

            // Check if already moderator
            const existing = await prisma.groupModerator.findFirst({
                where: { groupId, userId }
            })

            if (existing) {
                return NextResponse.json(
                    { error: 'User is already a moderator' },
                    { status: 400 }
                )
            }

            // Promote to moderator
            const moderator = await prisma.groupModerator.create({
                data: {
                    groupId,
                    userId
                }
            })

            return NextResponse.json({
                success: true,
                message: 'User promoted to moderator',
                data: moderator
            })
        } else {
            return NextResponse.json(
                { error: 'Invalid action' },
                { status: 400 }
            )
        }
    } catch (error) {
        console.error('Error managing member:', error)
        return NextResponse.json(
            { error: 'Failed to manage member' },
            { status: 500 }
        )
    }
}

// DELETE - Remove member or demote moderator
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const groupId = searchParams.get('groupId')
        const userId = searchParams.get('userId')
        const action = searchParams.get('action')

        if (!groupId || !userId || !action) {
            return NextResponse.json(
                { error: 'Group ID, user ID, and action are required' },
                { status: 400 }
            )
        }

        // Verify creator ownership
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json(
                { error: 'Only creators can manage members' },
                { status: 403 }
            )
        }

        const group = await prisma.memberGroup.findFirst({
            where: {
                id: groupId,
                channel: {
                    creatorId: creator.id
                }
            }
        })

        if (!group) {
            return NextResponse.json(
                { error: 'Group not found or access denied' },
                { status: 404 }
            )
        }

        if (action === 'remove_member') {
            // Remove member (also removes moderator role if exists due to cascade)
            await prisma.channelGroupMember.deleteMany({
                where: { groupId, userId }
            })

            return NextResponse.json({
                success: true,
                message: 'Member removed successfully'
            })
        } else if (action === 'demote_moderator') {
            // Remove moderator role only
            await prisma.groupModerator.deleteMany({
                where: { groupId, userId }
            })

            return NextResponse.json({
                success: true,
                message: 'Moderator demoted successfully'
            })
        } else {
            return NextResponse.json(
                { error: 'Invalid action' },
                { status: 400 }
            )
        }
    } catch (error) {
        console.error('Error removing member:', error)
        return NextResponse.json(
            { error: 'Failed to remove member' },
            { status: 500 }
        )
    }
}
