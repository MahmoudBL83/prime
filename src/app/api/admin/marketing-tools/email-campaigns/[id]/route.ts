import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole, EmailCampaignStatus } from '@prisma/client'
import { z } from 'zod'

const updateCampaignSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    subject: z.string().min(1).max(200).optional(),
    content: z.string().min(1).optional(),
    htmlContent: z.string().optional(),
    segmentId: z.string().optional(),
    scheduledAt: z.string().datetime().optional(),
    status: z.nativeEnum(EmailCampaignStatus).optional()
})

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!currentUser || currentUser.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            )
        }

        const { id: campaignId } = await params

        const campaign = await prisma.emailCampaign.findUnique({
            where: { id: campaignId },
            include: {
                segment: {
                    select: { id: true, name: true, userCount: true }
                },
                creator: {
                    select: { name: true, email: true }
                }
            }
        })

        if (!campaign) {
            return NextResponse.json(
                { error: 'Email campaign not found' },
                { status: 404 }
            )
        }

        // Calculate rates
        const openRate = campaign.sentCount > 0 ? (campaign.openCount / campaign.sentCount) * 100 : 0
        const clickRate = campaign.sentCount > 0 ? (campaign.clickCount / campaign.sentCount) * 100 : 0

        return NextResponse.json({
            ...campaign,
            openRate,
            clickRate
        })
    } catch (error) {
        console.error('Failed to fetch email campaign:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!currentUser || currentUser.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            )
        }

        const { id: campaignId } = await params
        const body = await request.json()
        const validatedData = updateCampaignSchema.parse(body)

        // Check if campaign exists
        const existingCampaign = await prisma.emailCampaign.findUnique({
            where: { id: campaignId }
        })

        if (!existingCampaign) {
            return NextResponse.json(
                { error: 'Email campaign not found' },
                { status: 404 }
            )
        }

        // Prevent editing sent campaigns
        if (existingCampaign.status === EmailCampaignStatus.SENT) {
            return NextResponse.json(
                { error: 'Cannot edit sent campaigns' },
                { status: 400 }
            )
        }

        // Prepare update data
        const updateData: any = { ...validatedData }
        if (validatedData.scheduledAt) {
            updateData.scheduledAt = new Date(validatedData.scheduledAt)
        }

        // If segment changed, recalculate recipient count
        if (validatedData.segmentId && validatedData.segmentId !== existingCampaign.segmentId) {
            const segment = await prisma.userSegment.findUnique({
                where: { id: validatedData.segmentId }
            })
            if (segment) {
                updateData.recipientCount = segment.userCount
            }
        }

        const updatedCampaign = await prisma.emailCampaign.update({
            where: { id: campaignId },
            data: updateData,
            include: {
                segment: {
                    select: { id: true, name: true, userCount: true }
                },
                creator: {
                    select: { name: true, email: true }
                }
            }
        })

        return NextResponse.json(updatedCampaign)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.issues },
                { status: 400 }
            )
        }

        console.error('Failed to update email campaign:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!currentUser || currentUser.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            )
        }

        const { id: campaignId } = await params

        // Check if campaign exists
        const campaign = await prisma.emailCampaign.findUnique({
            where: { id: campaignId }
        })

        if (!campaign) {
            return NextResponse.json(
                { error: 'Email campaign not found' },
                { status: 404 }
            )
        }

        // Prevent deletion of sent or sending campaigns
        if (campaign.status === EmailCampaignStatus.SENT || campaign.status === EmailCampaignStatus.SENDING) {
            return NextResponse.json(
                { error: 'Cannot delete campaigns that are sending or have been sent' },
                { status: 400 }
            )
        }

        await prisma.emailCampaign.delete({
            where: { id: campaignId }
        })

        return NextResponse.json({ message: 'Email campaign deleted successfully' })
    } catch (error) {
        console.error('Failed to delete email campaign:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}