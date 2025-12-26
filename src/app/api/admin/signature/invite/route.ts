import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

async function requireAdmin() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
        return { error: 'Authentication required', status: 401 as const }
    }

    const currentUser = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
        return { error: 'Admin access required', status: 403 as const }
    }

    return { currentUser }
}

export async function POST(req: NextRequest) {
    try {
        const adminCheck = await requireAdmin()
        if ('error' in adminCheck) {
            return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
        }
        const { currentUser } = adminCheck

        const body = await req.json().catch(() => null)
        const email = body?.email?.trim()
        const message = (body?.message || 'We would like you to build a signature course with us.').trim()

        if (!email) {
            return NextResponse.json({ error: 'email is required' }, { status: 400 })
        }

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Ensure creator record exists for this user
        await prisma.creator.upsert({
            where: { userId: user.id },
            create: { userId: user.id },
            update: {}
        })

        const invitation = await prisma.signatureCourseInvitation.upsert({
            where: { creatorId: user.id },
            update: {
                invitedBy: currentUser.id,
                message,
                invitedAt: new Date(),
                status: 'PENDING'
            },
            create: {
                creatorId: user.id,
                invitedBy: currentUser.id,
                message,
                status: 'PENDING'
            },
            include: {
                creator: {
                    select: { id: true, name: true, email: true, profileImage: true, avatar: true }
                }
            }
        })

        return NextResponse.json({ invitation })
    } catch (error) {
        console.error('Admin signature invite error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
