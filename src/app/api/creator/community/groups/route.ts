import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch creator's member groups
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify creator
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 })
        }

        const { searchParams } = new URL(request.url)
        const channelId = searchParams.get('channelId')

        // Build where clause
        const where: any = {}
        
        if (channelId) {
            // Verify channel ownership
            const channel = await prisma.creatorChannel.findFirst({
                where: {
                    id: channelId,
                    creatorId: creator.id
                }
            })

            if (!channel) {
                return NextResponse.json(
                    { error: 'Channel not found or access denied' },
                    { status: 404 }
                )
            }

            where.channelId = channelId
        } else {
            // Get all groups from creator's channels
            const creatorChannels = await prisma.creatorChannel.findMany({
                where: { creatorId: creator.id },
                select: { id: true }
            })
            where.channelId = { in: creatorChannels.map(c => c.id) }
        }

        // Fetch groups with stats
        const groups = await prisma.memberGroup.findMany({
            where,
            include: {
                channel: {
                    select: {
                        id: true,
                        name: true,
                        coverImage: true
                    }
                },
                _count: {
                    select: {
                        members: true,
                        posts: true,
                        moderators: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        // Calculate additional stats
        const groupsWithStats = await Promise.all(
            groups.map(async (group) => {
                const recentPosts = await prisma.groupPost.count({
                    where: {
                        groupId: group.id,
                        createdAt: {
                            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                        }
                    }
                })

                return {
                    ...group,
                    stats: {
                        totalMembers: group._count.members,
                        totalPosts: group._count.posts,
                        totalModerators: group._count.moderators,
                        recentPosts
                    }
                }
            })
        )

        return NextResponse.json({
            success: true,
            data: {
                groups: groupsWithStats,
                total: groups.length
            }
        })
    } catch (error) {
        console.error('Error fetching groups:', error)
        return NextResponse.json(
            { error: 'Failed to fetch groups' },
            { status: 500 }
        )
    }
}

// POST - Create new member group
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify creator
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 })
        }

        const body = await request.json()
        const {
            channelId,
            name,
            nameAr,
            description,
            descriptionAr,
            rules,
            rulesAr,
            tier,
            isPrivate,
            maxMembers
        } = body

        // Validation
        if (!channelId || !name) {
            return NextResponse.json(
                { error: 'Channel ID and name are required' },
                { status: 400 }
            )
        }

        // Verify channel ownership
        const channel = await prisma.creatorChannel.findFirst({
            where: {
                id: channelId,
                creatorId: creator.id
            }
        })

        if (!channel) {
            return NextResponse.json(
                { error: 'Channel not found or access denied' },
                { status: 404 }
            )
        }

        // Validate tier
        const validTiers = ['BRONZE', 'SILVER', 'GOLD']
        if (tier && !validTiers.includes(tier)) {
            return NextResponse.json(
                { error: 'Invalid tier. Must be BRONZE, SILVER, or GOLD' },
                { status: 400 }
            )
        }

        // Create group
        const group = await prisma.memberGroup.create({
            data: {
                channelId,
                name,
                nameAr: nameAr || null,
                description: description || null,
                descriptionAr: descriptionAr || null,
                rules: rules || null,
                rulesAr: rulesAr || null,
                tier: tier || 'BRONZE',
                isPrivate: isPrivate || false,
                maxMembers: maxMembers || null
            },
            include: {
                channel: {
                    select: {
                        id: true,
                        name: true,
                        coverImage: true
                    }
                }
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Group created successfully',
            data: group
        })
    } catch (error) {
        console.error('Error creating group:', error)
        return NextResponse.json(
            { error: 'Failed to create group' },
            { status: 500 }
        )
    }
}

// PUT - Update group
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify creator
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 })
        }

        const body = await request.json()
        const {
            groupId,
            name,
            nameAr,
            description,
            descriptionAr,
            rules,
            rulesAr,
            tier,
            isPrivate,
            maxMembers
        } = body

        if (!groupId) {
            return NextResponse.json(
                { error: 'Group ID is required' },
                { status: 400 }
            )
        }

        // Verify group ownership
        const existingGroup = await prisma.memberGroup.findFirst({
            where: {
                id: groupId,
                channel: {
                    creatorId: creator.id
                }
            }
        })

        if (!existingGroup) {
            return NextResponse.json(
                { error: 'Group not found or access denied' },
                { status: 404 }
            )
        }

        // Build update data
        const updateData: any = {}
        if (name !== undefined) updateData.name = name
        if (nameAr !== undefined) updateData.nameAr = nameAr
        if (description !== undefined) updateData.description = description
        if (descriptionAr !== undefined) updateData.descriptionAr = descriptionAr
        if (rules !== undefined) updateData.rules = rules
        if (rulesAr !== undefined) updateData.rulesAr = rulesAr
        if (tier !== undefined) updateData.tier = tier
        if (isPrivate !== undefined) updateData.isPrivate = isPrivate
        if (maxMembers !== undefined) updateData.maxMembers = maxMembers

        // Update group
        const updatedGroup = await prisma.memberGroup.update({
            where: { id: groupId },
            data: updateData,
            include: {
                channel: {
                    select: {
                        id: true,
                        name: true,
                        coverImage: true
                    }
                }
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Group updated successfully',
            data: updatedGroup
        })
    } catch (error) {
        console.error('Error updating group:', error)
        return NextResponse.json(
            { error: 'Failed to update group' },
            { status: 500 }
        )
    }
}

// DELETE - Remove group
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify creator
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 })
        }

        const { searchParams } = new URL(request.url)
        const groupId = searchParams.get('groupId')

        if (!groupId) {
            return NextResponse.json(
                { error: 'Group ID is required' },
                { status: 400 }
            )
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
            return NextResponse.json(
                { error: 'Group not found or access denied' },
                { status: 404 }
            )
        }

        // Delete group (cascade will handle members and posts)
        await prisma.memberGroup.delete({
            where: { id: groupId }
        })

        return NextResponse.json({
            success: true,
            message: 'Group deleted successfully'
        })
    } catch (error) {
        console.error('Error deleting group:', error)
        return NextResponse.json(
            { error: 'Failed to delete group' },
            { status: 500 }
        )
    }
}
