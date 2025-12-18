import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch sent broadcast messages
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const creator = await prisma.creator.findUnique({
            where: { id },
            include: {
                channels: { select: { id: true }, take: 1 }
            }
        })

        if (!creator || creator.userId !== session.user.id) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
        }

        const messages = await prisma.memberMessage.findMany({
            where: { creatorId: creator.id },
            orderBy: { sentAt: 'desc' },
            take: 20
        })

        return NextResponse.json({
            messages: messages.map(m => ({
                id: m.id,
                subject: m.subject,
                content: m.content,
                contentAr: m.contentAr,
                recipientCount: m.recipientCount,
                sentCount: m.sentCount,
                readCount: m.readCount,
                sentAt: m.sentAt.toISOString()
            }))
        })
    } catch (error) {
        console.error('Error fetching broadcast messages:', error)
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }
}

// POST - Send a broadcast message to all members
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { subject, content, contentAr, targetTiers } = body

        if (!subject || !content) {
            return NextResponse.json({ error: 'Subject and content are required' }, { status: 400 })
        }

        const creator = await prisma.creator.findUnique({
            where: { id },
            include: {
                channels: { select: { id: true }, take: 1 }
            }
        })

        if (!creator || creator.userId !== session.user.id) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
        }

        const channelId = creator.channels[0]?.id

        if (!channelId) {
            return NextResponse.json({ error: 'No channel found' }, { status: 404 })
        }

        // Get all subscribers
        const subscriptions = await prisma.channelSubscription.findMany({
            where: {
                channelId,
                status: 'ACTIVE'
            },
            include: {
                user: { select: { id: true, email: true, name: true } },
                tier: { select: { id: true, name: true } }
            }
        })

        // Filter by target tiers if specified
        let targetSubscriptions = subscriptions
        if (targetTiers && targetTiers.length > 0) {
            targetSubscriptions = subscriptions.filter(s => 
                targetTiers.includes(s.tier?.name?.toLowerCase())
            )
        }

        // Create the broadcast message record
        const broadcastMessage = await prisma.memberMessage.create({
            data: {
                channelId,
                creatorId: creator.id,
                subject,
                content,
                contentAr: contentAr || null,
                targetTierIds: targetTiers ? targetTiers.join(',') : 'all',
                recipientCount: targetSubscriptions.length,
                sentCount: 0,
                readCount: 0
            }
        })

        // Create notifications for each subscriber
        const notifications = targetSubscriptions.map(sub => ({
            userId: sub.userId,
            type: 'MESSAGE' as const,
            title: subject,
            message: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
            data: {
                messageId: broadcastMessage.id,
                creatorId: creator.id,
                channelId
            }
        }))

        // Batch create notifications
        if (notifications.length > 0) {
            await prisma.notification.createMany({
                data: notifications
            })

            // Update sent count
            await prisma.memberMessage.update({
                where: { id: broadcastMessage.id },
                data: { sentCount: notifications.length }
            })
        }

        return NextResponse.json({
            success: true,
            message: `Message sent to ${targetSubscriptions.length} members`,
            broadcastId: broadcastMessage.id,
            recipientCount: targetSubscriptions.length
        })
    } catch (error) {
        console.error('Error sending broadcast message:', error)
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }
}
