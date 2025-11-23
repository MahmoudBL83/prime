import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma, TicketPriority, TicketStatus, UserRole } from '@prisma/client'
import { z } from 'zod'

const updateSchema = z.object({
  subject: z.string().min(5).max(120).optional(),
  description: z.string().min(10).optional(),
  status: z.nativeEnum(TicketStatus).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  assignedToId: z.string().min(6).nullable().optional(),
  note: z.string().min(2).max(1000).optional(),
  internal: z.boolean().optional(),
  close: z.boolean().optional(),
})

const selectConfig = {
  user: { select: { id: true, name: true, email: true } },
  assignedTo: { select: { id: true, name: true, email: true } },
  messages: {
    orderBy: { createdAt: Prisma.SortOrder.asc },
  },
  _count: { select: { messages: true } },
} satisfies Prisma.SupportTicketInclude

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: selectConfig,
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const isAdmin = session.user.role === UserRole.ADMIN
    if (!isAdmin && ticket.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error('Support ticket fetch error:', error)
    return NextResponse.json({ error: 'Failed to load ticket' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
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
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data

    if (!isAdmin && !data.close && !data.note) {
      return NextResponse.json({ error: 'No permitted updates provided' }, { status: 400 })
    }

    const updateData: any = {}

    if (isAdmin) {
      if (data.subject) updateData.subject = data.subject
      if (data.description) updateData.description = data.description
      if (data.status) updateData.status = data.status
      if (data.priority) updateData.priority = data.priority
      if (data.assignedToId !== undefined) updateData.assignedToId = data.assignedToId
    }

    if (data.close && !isAdmin) {
      updateData.status = TicketStatus.CLOSED
    }

    let createdMessage = null

    const result = await prisma.$transaction(async (tx) => {
      const updatedTicket = await tx.supportTicket.update({
        where: { id },
        data: {
          ...updateData,
          lastMessageAt: data.note ? new Date() : undefined,
        },
        include: selectConfig,
      })

      if (data.note) {
        createdMessage = await tx.supportTicketMessage.create({
          data: {
            ticketId: id,
            authorId: session.user.id,
            content: data.note,
            isInternal: Boolean(isAdmin && data.internal),
          },
        })
      }

      return updatedTicket
    })

    return NextResponse.json({ ticket: result, note: createdMessage ?? undefined })
  } catch (error) {
    console.error('Support ticket update error:', error)
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.supportTicket.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Support ticket delete error:', error)
    return NextResponse.json({ error: 'Failed to delete ticket' }, { status: 500 })
  }
}
