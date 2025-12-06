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

type ActionType = 'APPROVE_PITCH' | 'REQUEST_CHANGES' | 'DECLINE' | 'APPROVE_PUBLISH' | 'MOVE_TO_REVIEW'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const adminCheck = await requireAdmin()
        if ('error' in adminCheck) {
            return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
        }
        const { currentUser } = adminCheck

        const body = await req.json().catch(() => null)
        const action: ActionType | undefined = body?.action
        const notes: string | undefined = body?.notes

        if (!action) {
            return NextResponse.json({ error: 'action is required' }, { status: 400 })
        }

        const proposal = await prisma.signatureCourseProposal.findUnique({ where: { id } })
        if (!proposal) {
            return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
        }

        const now = new Date()
        let newStage = proposal.stage

        switch (action) {
            case 'APPROVE_PITCH':
                newStage = 'SCRIPT_REVIEW'
                break
            case 'MOVE_TO_REVIEW':
                newStage = 'PRODUCTION_REVIEW'
                break
            case 'REQUEST_CHANGES':
                newStage = 'SCRIPT_REVIEW'
                break
            case 'DECLINE':
                newStage = 'REJECTED'
                break
            case 'APPROVE_PUBLISH':
                newStage = 'APPROVED'
                break
            default:
                return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
        }

        const updatedProposal = await prisma.signatureCourseProposal.update({
            where: { id },
            data: {
                stage: newStage,
                reviewNotes: notes || proposal.reviewNotes,
                reviewedAt: now,
                reviewedBy: currentUser.id
            }
        })

        if (action === 'APPROVE_PUBLISH' && proposal.courseId) {
            await prisma.course.update({
                where: { id: proposal.courseId },
                data: {
                    status: 'PUBLISHED',
                    publishedAt: proposal.courseId ? now : undefined
                }
            })
        }

        return NextResponse.json({ proposal: updatedProposal })
    } catch (error) {
        console.error('Admin signature proposal action error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}