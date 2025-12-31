import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole, EmailCampaignStatus } from '@prisma/client'
import { z } from 'zod'

const createCampaignSchema = z.object({
    name: z.string().min(1).max(100),
    subject: z.string().min(1).max(200),
    content: z.string().min(1),
    htmlContent: z.string().optional(),
    segmentId: z.string().optional(),
    scheduledAt: z.string().datetime().optional()
})

const updateCampaignSchema = createCampaignSchema.partial()

export async function GET(request: NextRequest) {
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

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const search = searchParams.get('search')
        const status = searchParams.get('status')

        const where: any = {}

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { subject: { contains: search, mode: 'insensitive' } }
            ]
        }

        if (status && status !== 'all') {
            where.status = status.toUpperCase()
        }

        const [campaigns, total] = await Promise.all([
            prisma.emailCampaign.findMany({
                where,
                include: {
                    segment: {
                        select: { id: true, name: true }
                    },
                    creator: {
                        select: { name: true, email: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.emailCampaign.count({ where })
        ])

        // Calculate rates for each campaign
        const campaignsWithRates = campaigns.map(campaign => ({
            ...campaign,
            openRate: campaign.sentCount > 0 ? (campaign.openCount / campaign.sentCount) * 100 : 0,
            clickRate: campaign.sentCount > 0 ? (campaign.clickCount / campaign.sentCount) * 100 : 0
        }))

        return NextResponse.json({
            campaigns: campaignsWithRates,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error('Failed to fetch email campaigns:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
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

        const body = await request.json()
        const validatedData = createCampaignSchema.parse(body)

        // If segment is specified, calculate recipient count
        let recipientCount = 0
        if (validatedData.segmentId) {
            const segment = await prisma.userSegment.findUnique({
                where: { id: validatedData.segmentId }
            })
            if (!segment) {
                return NextResponse.json(
                    { error: 'User segment not found' },
                    { status: 400 }
                )
            }
            recipientCount = segment.userCount
        }

        const campaign = await prisma.emailCampaign.create({
            data: {
                name: validatedData.name,
                subject: validatedData.subject,
                content: validatedData.content,
                htmlContent: validatedData.htmlContent,
                segmentId: validatedData.segmentId,
                recipientCount,
                scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : undefined,
                createdBy: currentUser.id
            },
            include: {
                segment: {
                    select: { id: true, name: true }
                },
                creator: {
                    select: { name: true, email: true }
                }
            }
        })

        return NextResponse.json(campaign, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.issues },
                { status: 400 }
            )
        }

        console.error('Failed to create email campaign:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}