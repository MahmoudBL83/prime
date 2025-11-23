import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma, TicketStatus, UserRole } from '@prisma/client'
import { z } from 'zod'

const messageSchema = z.object({
  content: z.string().min(2).max(2000),
  attachments: z.array(z.string().url()).optional(),
  isInternal: z.boolean().optional(),
  status: z.nativeEnum(TicketStatus).optional(),
})

type RouteContext = { params: Promise<{ id: string }> }

const CLOSED_STATES: TicketStatus[] = [TicketStatus.CLOSED, TicketStatus.RESOLVED]

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      select: { id: true, userId: true },
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const isAdmin = session.user.role === UserRole.ADMIN
    if (!isAdmin && ticket.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const messages = await prisma.supportTicketMessage.findMany({
      where: { ticketId: id },
      orderBy: { createdAt: Prisma.SortOrder.asc },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Support ticket message list error:', error)
    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ticket = await prisma.supportTicket.findUnique({ where: { id } })
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const isAdmin = session.user.role === UserRole.ADMIN
    if (!isAdmin && ticket.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = messageSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { content, attachments, isInternal, status } = parsed.data

    if (!isAdmin && isInternal) {
      return NextResponse.json({ error: 'Cannot create internal notes' }, { status: 403 })
    }

    if (!isAdmin && status) {
      return NextResponse.json({ error: 'Only admins can change status' }, { status: 403 })
    }

    const now = new Date()

    const result = await prisma.$transaction(async (tx) => {
      const message = await tx.supportTicketMessage.create({
        data: {
          ticketId: id,
          authorId: session.user.id,
          content,
          isInternal: Boolean(isInternal && isAdmin),
          attachmentUrls: attachments?.length ? JSON.stringify(attachments) : null,
        },
        include: {
          author: { select: { id: true, name: true, email: true } },
        },
      })

      await tx.supportTicket.update({
        where: { id },
        data: {
          lastMessageAt: now,
          status: isAdmin
            ? status ?? ticket.status
            : CLOSED_STATES.includes(ticket.status)
              ? TicketStatus.OPEN
              : ticket.status,
        },
      })

      return message
    })

    return NextResponse.json({ message: result }, { status: 201 })
  } catch (error) {
    console.error('Support ticket message create error:', error)
    return NextResponse.json({ error: 'Failed to post message' }, { status: 500 })
  }
}
