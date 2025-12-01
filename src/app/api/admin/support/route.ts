import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma, TicketCategory, TicketPriority, TicketStatus, UserRole } from '@prisma/client'
import { z } from 'zod'
import type { Session } from 'next-auth'

const SLA_HOURS: Record<TicketPriority, number> = {
    LOW: 48,
    MEDIUM: 24,
    HIGH: 8,
    URGENT: 2
}

const ticketInclude = {
    user: {
        select: { id: true, name: true, email: true, phone: true, role: true }
    },
    assignedTo: {
        select: { id: true, name: true, email: true }
    },
    messages: {
        orderBy: { createdAt: 'asc' },
        include: {
            author: {
                select: { id: true, name: true, role: true }
            }
        }
    }
} satisfies Prisma.SupportTicketInclude

type TicketWithRelations = Prisma.SupportTicketGetPayload<{ include: typeof ticketInclude }>

const updateSchema = z.object({
    ticketId: z.string().min(1),
    action: z.enum(['reply', 'status', 'assign', 'priority']),
    message: z.string().min(2).optional(),
    isInternal: z.boolean().optional(),
    status: z.nativeEnum(TicketStatus).optional(),
    assignedToId: z.string().optional(),
    priority: z.nativeEnum(TicketPriority).optional()
})

function assertAdmin(session: Session | null): asserts session is Session {
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
        throw new Error('UNAUTHORIZED')
    }
}

function mapTicket(ticket: NonNullable<TicketWithRelations>) {
    const firstResponse = ticket.messages.find(message => message.authorId !== ticket.userId && !message.isInternal)
    const firstResponseAt = firstResponse?.createdAt ?? null
    const responseTimeHours = firstResponseAt
        ? (firstResponseAt.getTime() - ticket.createdAt.getTime()) / (1000 * 60 * 60)
        : null

    const slaTarget = SLA_HOURS[ticket.priority]
    const slaBreached = responseTimeHours !== null ? responseTimeHours > slaTarget : false

    return {
        id: ticket.id,
        ticketNumber: `TKT-${ticket.createdAt.getFullYear()}-${ticket.id.slice(-6).toUpperCase()}`,
        subject: ticket.subject,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        normalizedStatus: ticket.status.toLowerCase(),
        slaBreached,
        responseTimeHours: responseTimeHours ? Number(responseTimeHours.toFixed(1)) : null,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
        lastMessageAt: ticket.lastMessageAt?.toISOString() ?? ticket.updatedAt.toISOString(),
        firstResponseAt: firstResponseAt?.toISOString() ?? null,
        resolvedAt: ticket.status === TicketStatus.RESOLVED || ticket.status === TicketStatus.CLOSED
            ? ticket.updatedAt.toISOString()
            : null,
        user: ticket.user ? {
            id: ticket.user.id,
            name: ticket.user.name ?? 'Unknown User',
            email: ticket.user.email,
            phone: ticket.user.phone,
            role: ticket.user.role
        } : null,
        assignedTo: ticket.assignedTo ? {
            id: ticket.assignedTo.id,
            name: ticket.assignedTo.name ?? 'Unassigned',
            email: ticket.assignedTo.email
        } : null,
        messages: ticket.messages.map(message => ({
            id: message.id,
            content: message.content,
            sender: message.authorId === ticket.userId ? 'user' : 'admin',
            senderId: message.author.id,
            senderName: message.author.name ?? 'System',
            senderRole: message.author.role,
            createdAt: message.createdAt.toISOString(),
            attachments: message.attachmentUrls ? message.attachmentUrls.split(',') : [],
            isInternal: message.isInternal
        }))
    }
}

async function getTicketById(id: string) {
    return prisma.supportTicket.findUnique({
        where: { id },
        include: ticketInclude
    })
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        assertAdmin(session)

        const searchParams = request.nextUrl.searchParams
        const status = searchParams.get('status') as TicketStatus | null
        const priority = searchParams.get('priority') as TicketPriority | null
        const category = searchParams.get('category') as TicketCategory | null
        const search = searchParams.get('search')
        const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1)
        const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '25', 10), 1), 100)

        const where: any = {}
        if (status && Object.values(TicketStatus).includes(status)) {
            where.status = status
        }
        if (priority && Object.values(TicketPriority).includes(priority)) {
            where.priority = priority
        }
        if (category && Object.values(TicketCategory).includes(category)) {
            where.category = category
        }
        if (search) {
            where.OR = [
                { subject: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { user: { name: { contains: search, mode: 'insensitive' } } },
                { user: { email: { contains: search, mode: 'insensitive' } } }
            ]
        }

        const [total, tickets, statusGroups, priorityGroups] = await Promise.all([
            prisma.supportTicket.count({ where }),
            prisma.supportTicket.findMany({
                where,
                include: ticketInclude,
                orderBy: { updatedAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize
            }),
            prisma.supportTicket.groupBy({
                by: ['status'],
                _count: { _all: true },
                where
            }),
            prisma.supportTicket.groupBy({
                by: ['priority'],
                _count: { _all: true },
                where
            })
        ])

        const mapped = tickets.map(mapTicket)
        const slaBreached = mapped.filter(ticket => ticket.slaBreached).length
        const avgResponse = mapped.reduce((sum, ticket) => sum + (ticket.responseTimeHours ?? 0), 0)
        const respondedCount = mapped.filter(ticket => ticket.responseTimeHours !== null).length

        return NextResponse.json({
            tickets: mapped,
            meta: {
                total,
                page,
                pageSize
            },
            stats: {
                status: Object.values(TicketStatus).reduce<Record<TicketStatus, number>>((acc, key) => {
                    acc[key] = statusGroups.find(group => group.status === key)?._count._all ?? 0
                    return acc
                }, {
                    OPEN: 0,
                    IN_PROGRESS: 0,
                    RESOLVED: 0,
                    CLOSED: 0
                }),
                priority: Object.values(TicketPriority).reduce<Record<TicketPriority, number>>((acc, key) => {
                    acc[key] = priorityGroups.find(group => group.priority === key)?._count._all ?? 0
                    return acc
                }, {
                    LOW: 0,
                    MEDIUM: 0,
                    HIGH: 0,
                    URGENT: 0
                }),
                slaBreached,
                avgResponseTimeHours: respondedCount ? Number((avgResponse / respondedCount).toFixed(1)) : null
            }
        })
    } catch (error) {
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        console.error('Admin support tickets error:', error)
        return NextResponse.json({ error: 'Failed to load support tickets' }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        assertAdmin(session)

        const body = await request.json()
        const parsed = updateSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
        }

        const { action, ticketId, message, isInternal, status, assignedToId, priority } = parsed.data

        const ticketExists = await prisma.supportTicket.findUnique({ where: { id: ticketId } })
        if (!ticketExists) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
        }

        switch (action) {
            case 'reply': {
                if (!message) {
                    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
                }

                await prisma.supportTicketMessage.create({
                    data: {
                        ticketId,
                        authorId: session!.user.id,
                        content: message,
                        isInternal: Boolean(isInternal)
                    }
                })

                await prisma.supportTicket.update({
                    where: { id: ticketId },
                    data: {
                        status: TicketStatus.IN_PROGRESS,
                        lastMessageAt: new Date(),
                        assignedToId: ticketExists.assignedToId ?? session!.user.id
                    }
                })
                break
            }
            case 'status': {
                if (!status) {
                    return NextResponse.json({ error: 'Status is required' }, { status: 400 })
                }
                await prisma.supportTicket.update({
                    where: { id: ticketId },
                    data: { status }
                })
                break
            }
            case 'assign': {
                if (!assignedToId) {
                    return NextResponse.json({ error: 'assignedToId is required' }, { status: 400 })
                }
                await prisma.supportTicket.update({
                    where: { id: ticketId },
                    data: { assignedToId }
                })
                break
            }
            case 'priority': {
                if (!priority) {
                    return NextResponse.json({ error: 'Priority is required' }, { status: 400 })
                }
                await prisma.supportTicket.update({ where: { id: ticketId }, data: { priority } })
                break
            }
        }

        const updatedTicket = await getTicketById(ticketId)
        if (!updatedTicket) {
            return NextResponse.json({ error: 'Ticket not found after update' }, { status: 404 })
        }

        return NextResponse.json({ ticket: mapTicket(updatedTicket) })
    } catch (error) {
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        console.error('Admin support ticket update error:', error)
        return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        assertAdmin(session)

        const body = await request.json()
        const parsed = z.object({
            subject: z.string().min(5),
            description: z.string().min(10),
            category: z.nativeEnum(TicketCategory).default(TicketCategory.OTHER),
            priority: z.nativeEnum(TicketPriority).default(TicketPriority.MEDIUM),
            userId: z.string().min(1)
        }).safeParse(body)

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
        }

        const { subject, description, category, priority, userId } = parsed.data

        const ticket = await prisma.supportTicket.create({
            data: {
                userId,
                subject,
                description,
                category,
                priority,
                messages: {
                    create: {
                        authorId: session!.user.id,
                        content: description,
                        isInternal: true
                    }
                }
            }
        })

        const created = await getTicketById(ticket.id)
        if (!created) {
            return NextResponse.json({ error: 'Failed to load created ticket' }, { status: 500 })
        }

        return NextResponse.json({ ticket: mapTicket(created) }, { status: 201 })
    } catch (error) {
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        console.error('Admin support ticket create error:', error)
        return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
    }
}
