import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Family/Group Plans API
 * Uses JSON metadata on User model to store family plan information.
 * Plan owner stores: { familyPlan: { id, name, members: [], maxMembers: 5, createdAt } }
 * Plan members store: { familyPlanMember: { planOwnerId, joinedAt } }
 */

interface FamilyPlan {
    id: string
    name: string
    members: string[] // Array of member user IDs
    maxMembers: number
    createdAt: string
}

interface FamilyMemberInfo {
    planOwnerId: string
    joinedAt: string
}

// GET: Get user's family plan
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                featureFlags: true
            }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const featureFlags = (user.featureFlags as any) || {}
        const ownedPlan = featureFlags.familyPlan as FamilyPlan | undefined
        const memberInfo = featureFlags.familyPlanMember as FamilyMemberInfo | undefined

        // If user owns a plan
        if (ownedPlan) {
            // Fetch member details
            const memberDetails = await prisma.user.findMany({
                where: { id: { in: ownedPlan.members } },
                select: { id: true, name: true, email: true, profileImage: true }
            })

            return NextResponse.json({
                role: 'owner',
                plan: {
                    ...ownedPlan,
                    memberDetails
                },
                maxMembers: ownedPlan.maxMembers
            })
        }

        // If user is a member of another plan
        if (memberInfo) {
            const owner = await prisma.user.findUnique({
                where: { id: memberInfo.planOwnerId },
                select: {
                    id: true,
                    name: true,
                    featureFlags: true
                }
            })

            if (owner) {
                const ownerFlags = (owner.featureFlags as any) || {}
                const plan = ownerFlags.familyPlan as FamilyPlan | undefined

                return NextResponse.json({
                    role: 'member',
                    plan: plan ? {
                        id: plan.id,
                        name: plan.name,
                        ownerName: owner.name
                    } : null,
                    joinedAt: memberInfo.joinedAt
                })
            }
        }

        // User has no family plan
        return NextResponse.json({
            role: null,
            plan: null,
            maxMembers: 5,
            message: 'You are not part of any family plan'
        })
    } catch (error) {
        console.error('Family plans GET error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch family plans' },
            { status: 500 }
        )
    }
}

// POST: Create a family plan
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { name } = body

        if (!name || name.length < 2) {
            return NextResponse.json({ error: 'Plan name must be at least 2 characters' }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { featureFlags: true }
        })

        const featureFlags = (user?.featureFlags as any) || {}

        // Check if user already has or is part of a plan
        if (featureFlags.familyPlan || featureFlags.familyPlanMember) {
            return NextResponse.json({ error: 'You already have or are part of a family plan' }, { status: 400 })
        }

        // Create new family plan
        const newPlan: FamilyPlan = {
            id: `fp_${Date.now()}`,
            name,
            members: [],
            maxMembers: 5,
            createdAt: new Date().toISOString()
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                featureFlags: {
                    ...featureFlags,
                    familyPlan: newPlan
                }
            }
        })

        return NextResponse.json({
            success: true,
            plan: newPlan,
            message: 'Family plan created successfully'
        }, { status: 201 })
    } catch (error) {
        console.error('Family plans POST error:', error)
        return NextResponse.json(
            { error: 'Failed to create family plan' },
            { status: 500 }
        )
    }
}

// PATCH: Manage family plan (add/remove members, accept invite)
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { action, memberEmail, planOwnerId } = body

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { featureFlags: true }
        })

        const featureFlags = (user?.featureFlags as any) || {}

        switch (action) {
            case 'add_member': {
                const plan = featureFlags.familyPlan as FamilyPlan | undefined
                if (!plan) {
                    return NextResponse.json({ error: 'You do not own a family plan' }, { status: 400 })
                }

                if (plan.members.length >= plan.maxMembers) {
                    return NextResponse.json({ error: 'Family plan is full' }, { status: 400 })
                }

                const member = await prisma.user.findUnique({
                    where: { email: memberEmail },
                    select: { id: true, featureFlags: true }
                })

                if (!member) {
                    return NextResponse.json({ error: 'User not found' }, { status: 404 })
                }

                const memberFlags = (member.featureFlags as any) || {}
                if (memberFlags.familyPlan || memberFlags.familyPlanMember) {
                    return NextResponse.json({ error: 'User is already part of a family plan' }, { status: 400 })
                }

                // Add member to plan
                plan.members.push(member.id)
                await prisma.user.update({
                    where: { id: session.user.id },
                    data: {
                        featureFlags: { ...featureFlags, familyPlan: plan }
                    }
                })

                // Mark user as member
                await prisma.user.update({
                    where: { id: member.id },
                    data: {
                        featureFlags: {
                            ...memberFlags,
                            familyPlanMember: {
                                planOwnerId: session.user.id,
                                joinedAt: new Date().toISOString()
                            }
                        }
                    }
                })

                return NextResponse.json({ success: true, message: 'Member added' })
            }

            case 'remove_member': {
                const plan = featureFlags.familyPlan as FamilyPlan | undefined
                if (!plan) {
                    return NextResponse.json({ error: 'You do not own a family plan' }, { status: 400 })
                }

                const memberId = body.memberId
                plan.members = plan.members.filter(id => id !== memberId)

                await prisma.user.update({
                    where: { id: session.user.id },
                    data: {
                        featureFlags: { ...featureFlags, familyPlan: plan }
                    }
                })

                // Remove membership from user
                const member = await prisma.user.findUnique({
                    where: { id: memberId },
                    select: { featureFlags: true }
                })
                if (member) {
                    const memberFlags = (member.featureFlags as any) || {}
                    delete memberFlags.familyPlanMember
                    await prisma.user.update({
                        where: { id: memberId },
                        data: { featureFlags: memberFlags }
                    })
                }

                return NextResponse.json({ success: true, message: 'Member removed' })
            }

            case 'leave_plan': {
                const memberInfo = featureFlags.familyPlanMember as FamilyMemberInfo | undefined
                if (!memberInfo) {
                    return NextResponse.json({ error: 'You are not part of a family plan' }, { status: 400 })
                }

                // Remove from owner's plan
                const owner = await prisma.user.findUnique({
                    where: { id: memberInfo.planOwnerId },
                    select: { featureFlags: true }
                })

                if (owner) {
                    const ownerFlags = (owner.featureFlags as any) || {}
                    const plan = ownerFlags.familyPlan as FamilyPlan | undefined
                    if (plan) {
                        plan.members = plan.members.filter(id => id !== session.user.id)
                        await prisma.user.update({
                            where: { id: memberInfo.planOwnerId },
                            data: { featureFlags: { ...ownerFlags, familyPlan: plan } }
                        })
                    }
                }

                // Remove membership from self
                delete featureFlags.familyPlanMember
                await prisma.user.update({
                    where: { id: session.user.id },
                    data: { featureFlags }
                })

                return NextResponse.json({ success: true, message: 'Left family plan' })
            }

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }
    } catch (error) {
        console.error('Family plans PATCH error:', error)
        return NextResponse.json(
            { error: 'Failed to update family plan' },
            { status: 500 }
        )
    }
}

