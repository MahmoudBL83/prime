import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

/**
 * Family/Group Plans API
 * Allows users to manage family subscriptions with shared access
 * GET/POST/PATCH /api/subscriptions/family
 */

const familyPlanSchema = z.object({
    name: z.string().min(1).max(100),
    memberEmails: z.array(z.string().email()).max(5), // Up to 5 family members
    subscriptionType: z.enum(['BASIC', 'PREMIUM', 'VIP'])
})

const addMemberSchema = z.object({
    planId: z.string(),
    email: z.string().email()
})

// GET: Get user's family plan
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Find family plans where user is owner or member
        const ownedPlans = await prisma.subscription.findMany({
            where: {
                userId: session.user.id,
                type: { in: ['FAMILY_BASIC', 'FAMILY_PREMIUM', 'FAMILY_VIP'] }
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true, profileImage: true }
                }
            }
        })

        // Check if user is a member of another family plan
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                email: true,
                subscriptions: {
                    where: { status: 'ACTIVE' },
                    select: { type: true, metadata: true }
                }
            }
        })

        // Parse family membership from subscription metadata
        const familyMembership = user?.subscriptions.find(
            s => s.metadata && JSON.parse(s.metadata as string)?.familyPlanId
        )

        return NextResponse.json({
            ownedPlans: ownedPlans.map(plan => ({
                ...plan,
                members: plan.metadata ? JSON.parse(plan.metadata as string)?.members || [] : []
            })),
            memberOf: familyMembership ? JSON.parse(familyMembership.metadata as string) : null,
            maxMembers: 5
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
        const parsed = familyPlanSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
        }

        const { name, memberEmails, subscriptionType } = parsed.data

        // Check if user already has a family plan
        const existingPlan = await prisma.subscription.findFirst({
            where: {
                userId: session.user.id,
                type: { in: ['FAMILY_BASIC', 'FAMILY_PREMIUM', 'FAMILY_VIP'] },
                status: 'ACTIVE'
            }
        })

        if (existingPlan) {
            return NextResponse.json(
                { error: 'You already have an active family plan' },
                { status: 400 }
            )
        }

        // Validate member emails - they should exist and not have active subscriptions
        const members = await prisma.user.findMany({
            where: {
                email: { in: memberEmails },
                id: { not: session.user.id }
            },
            select: { id: true, email: true, name: true, profileImage: true }
        })

        // Calculate pricing (example: base price + per member)
        const basePrices = {
            BASIC: 99,
            PREMIUM: 199,
            VIP: 399
        }
        const perMemberPrice = 29
        const totalPrice = basePrices[subscriptionType] + (members.length * perMemberPrice)

        // Create family subscription
        const subscription = await prisma.subscription.create({
            data: {
                userId: session.user.id,
                type: `FAMILY_${subscriptionType}` as any,
                status: 'ACTIVE',
                pricePerMonth: totalPrice,
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                metadata: JSON.stringify({
                    planName: name,
                    members: members.map(m => ({
                        id: m.id,
                        email: m.email,
                        name: m.name,
                        profileImage: m.profileImage,
                        status: 'PENDING',
                        invitedAt: new Date().toISOString()
                    })),
                    maxMembers: 5
                })
            }
        })

        // Send invitations to members
        for (const member of members) {
            await prisma.notification.create({
                data: {
                    userId: member.id,
                    type: 'FAMILY_INVITE',
                    title: 'Family Plan Invitation',
                    message: `${session.user.name} has invited you to join their family plan!`,
                    metadata: {
                        planId: subscription.id,
                        inviterId: session.user.id,
                        inviterName: session.user.name
                    }
                }
            })
        }

        return NextResponse.json({
            subscription,
            invitedMembers: members.length,
            monthlyPrice: totalPrice,
            message: `Family plan created! ${members.length} invitation(s) sent.`
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
        const { action, planId, email, memberId } = body

        if (!action || !planId) {
            return NextResponse.json(
                { error: 'action and planId are required' },
                { status: 400 }
            )
        }

        const plan = await prisma.subscription.findUnique({
            where: { id: planId }
        })

        if (!plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
        }

        const metadata = plan.metadata ? JSON.parse(plan.metadata as string) : { members: [] }

        switch (action) {
            case 'accept_invite': {
                // User is accepting an invitation
                const memberIndex = metadata.members.findIndex(
                    (m: any) => m.id === session.user.id && m.status === 'PENDING'
                )

                if (memberIndex === -1) {
                    return NextResponse.json(
                        { error: 'No pending invitation found' },
                        { status: 400 }
                    )
                }

                metadata.members[memberIndex].status = 'ACTIVE'
                metadata.members[memberIndex].joinedAt = new Date().toISOString()

                await prisma.subscription.update({
                    where: { id: planId },
                    data: { metadata: JSON.stringify(metadata) }
                })

                return NextResponse.json({
                    message: 'Successfully joined family plan!'
                })
            }

            case 'decline_invite': {
                const memberIndex = metadata.members.findIndex(
                    (m: any) => m.id === session.user.id
                )

                if (memberIndex === -1) {
                    return NextResponse.json(
                        { error: 'Not a member of this plan' },
                        { status: 400 }
                    )
                }

                metadata.members.splice(memberIndex, 1)

                await prisma.subscription.update({
                    where: { id: planId },
                    data: { metadata: JSON.stringify(metadata) }
                })

                return NextResponse.json({
                    message: 'Invitation declined'
                })
            }

            case 'add_member': {
                // Only owner can add members
                if (plan.userId !== session.user.id) {
                    return NextResponse.json({ error: 'Only plan owner can add members' }, { status: 403 })
                }

                if (metadata.members.length >= metadata.maxMembers) {
                    return NextResponse.json(
                        { error: `Maximum ${metadata.maxMembers} members allowed` },
                        { status: 400 }
                    )
                }

                const newMember = await prisma.user.findUnique({
                    where: { email },
                    select: { id: true, email: true, name: true, profileImage: true }
                })

                if (!newMember) {
                    return NextResponse.json(
                        { error: 'User not found with this email' },
                        { status: 404 }
                    )
                }

                // Check if already a member
                if (metadata.members.some((m: any) => m.id === newMember.id)) {
                    return NextResponse.json(
                        { error: 'User is already a member' },
                        { status: 400 }
                    )
                }

                metadata.members.push({
                    id: newMember.id,
                    email: newMember.email,
                    name: newMember.name,
                    profileImage: newMember.profileImage,
                    status: 'PENDING',
                    invitedAt: new Date().toISOString()
                })

                await prisma.subscription.update({
                    where: { id: planId },
                    data: { metadata: JSON.stringify(metadata) }
                })

                // Send notification
                await prisma.notification.create({
                    data: {
                        userId: newMember.id,
                        type: 'FAMILY_INVITE',
                        title: 'Family Plan Invitation',
                        message: `${session.user.name} has invited you to join their family plan!`,
                        metadata: {
                            planId: plan.id,
                            inviterId: session.user.id
                        }
                    }
                })

                return NextResponse.json({
                    message: 'Member invited successfully'
                })
            }

            case 'remove_member': {
                // Only owner can remove members
                if (plan.userId !== session.user.id) {
                    return NextResponse.json({ error: 'Only plan owner can remove members' }, { status: 403 })
                }

                const memberIndex = metadata.members.findIndex((m: any) => m.id === memberId)
                if (memberIndex === -1) {
                    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
                }

                metadata.members.splice(memberIndex, 1)

                await prisma.subscription.update({
                    where: { id: planId },
                    data: { metadata: JSON.stringify(metadata) }
                })

                return NextResponse.json({
                    message: 'Member removed successfully'
                })
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
