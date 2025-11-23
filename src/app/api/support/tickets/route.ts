import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TicketCategory, TicketPriority, TicketStatus, UserRole } from '@prisma/client'
import { z } from 'zod'

const createTicketSchema = z.object({
  subject: z.string().min(5).max(120),
  description: z.string().min(10),
  category: z.nativeEnum(TicketCategory).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  referenceType: z.string().max(64).optional(),
  referenceId: z.string().max(64).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = session.user.role === UserRole.ADMIN
    const searchParams = req.nextUrl.searchParams
    const statusFilter = searchParams.get('status') as TicketStatus | null
    const priorityFilter = searchParams.get('priority') as TicketPriority | null
    const categoryFilter = searchParams.get('category') as TicketCategory | null
    const take = Math.min(Math.max(Number(searchParams.get('take') ?? 25), 1), 50)

    const where: any = {}
    if (!isAdmin) {
      where.userId = session.user.id
    }
    if (statusFilter && Object.values(TicketStatus).includes(statusFilter)) {
      where.status = statusFilter
    }
    if (priorityFilter && Object.values(TicketPriority).includes(priorityFilter)) {
      where.priority = priorityFilter
    }
    if (categoryFilter && Object.values(TicketCategory).includes(categoryFilter)) {
      where.category = categoryFilter
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take,
    })

    return NextResponse.json({ tickets })
  } catch (error) {
    console.error('Support ticket list error:', error)
    return NextResponse.json({ error: 'Failed to load tickets' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = createTicketSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: session.user.id,
        subject: data.subject,
        description: data.description,
        category: data.category ?? TicketCategory.OTHER,
        priority: data.priority ?? TicketPriority.MEDIUM,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        messages: {
          create: {
            authorId: session.user.id,
            content: data.description,
            isInternal: false,
          },
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        _count: { select: { messages: true } },
      },
    })

    return NextResponse.json({ ticket }, { status: 201 })
  } catch (error) {
    console.error('Support ticket create error:', error)
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
  }
}
