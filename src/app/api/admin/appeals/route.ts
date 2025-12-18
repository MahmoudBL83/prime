import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole, AppealStatus, AppealDecision } from '@prisma/client'

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
        const status = searchParams.get('status')
        const priority = searchParams.get('priority')

        const where: Record<string, unknown> = {}

        if (status && status !== 'all') {
            where.status = status.toUpperCase()
        }

        if (priority && priority !== 'all') {
            where.priority = priority.toUpperCase()
        }

        const appeals = await prisma.appeal.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                ban: {
                    select: {
                        id: true,
                        reason: true,
                        banType: true,
                        bannedAt: true,
                        expiresAt: true
                    }
                },
                reviewer: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: [
                { priority: 'desc' },
                { submittedAt: 'asc' }
            ]
        })

        // Count by status
        const isResolved = (status: AppealStatus) => 
            status === AppealStatus.UPHELD || 
            status === AppealStatus.REDUCED || 
            status === AppealStatus.REINSTATED || 
            status === AppealStatus.REJECTED
        
        const stats = {
            total: appeals.length,
            pending: appeals.filter(a => a.status === AppealStatus.PENDING).length,
            underReview: appeals.filter(a => a.status === AppealStatus.UNDER_REVIEW).length,
            resolved: appeals.filter(a => isResolved(a.status)).length
        }

        const formattedAppeals = appeals.map(appeal => ({
            id: appeal.id,
            appealNumber: appeal.appealNumber,
            user: {
                id: appeal.user.id,
                name: appeal.user.name || 'Unknown',
                email: appeal.user.email || ''
            },
            banType: appeal.ban.banType,
            banReason: appeal.ban.reason,
            banDate: appeal.ban.bannedAt.toISOString(),
            banExpiry: appeal.ban.expiresAt?.toISOString(),
            appealReason: appeal.reason,
            evidence: appeal.evidence,
            status: appeal.status.toLowerCase(),
            priority: appeal.priority.toLowerCase(),
            submittedAt: appeal.submittedAt.toISOString(),
            reviewedAt: appeal.reviewedAt?.toISOString(),
            reviewedBy: appeal.reviewer?.name,
            decision: appeal.decision?.toLowerCase(),
            decisionNotes: appeal.decisionNotes
        }))

        return NextResponse.json({ appeals: formattedAppeals, stats })

    } catch (error) {
        console.error('Appeals API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function PATCH(request: NextRequest) {
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

        const { appealId, action, notes } = await request.json()

        if (!appealId || !action) {
            return NextResponse.json(
                { error: 'Appeal ID and action required' },
                { status: 400 }
            )
        }

        let decision: AppealDecision
        let status: AppealStatus

        switch (action) {
            case 'approve':
            case 'full_reinstatement':
                decision = AppealDecision.FULL_REINSTATEMENT
                status = AppealStatus.REINSTATED
                break
            case 'deny':
            case 'uphold':
                decision = AppealDecision.UPHOLD
                status = AppealStatus.UPHELD
                break
            case 'reduce':
            case 'reduce_duration':
                decision = AppealDecision.REDUCE_DURATION
                status = AppealStatus.REDUCED
                break
            case 'reduce_warning':
                decision = AppealDecision.REDUCE_WARNING
                status = AppealStatus.REDUCED
                break
            default:
                return NextResponse.json(
                    { error: 'Invalid action' },
                    { status: 400 }
                )
        }

        const appeal = await prisma.appeal.update({
            where: { id: appealId },
            data: {
                status,
                decision,
                decisionNotes: notes,
                reviewedAt: new Date(),
                reviewedBy: currentUser.id
            },
            include: {
                ban: true
            }
        })

        // If reinstated, lift the ban
        if (decision === AppealDecision.FULL_REINSTATEMENT) {
            await prisma.userBan.update({
                where: { id: appeal.banId },
                data: { expiresAt: new Date() }
            })
        }

        // If reduced, modify the ban expiry
        if (decision === AppealDecision.REDUCE_DURATION && appeal.ban.expiresAt) {
            const currentExpiry = appeal.ban.expiresAt
            const now = new Date()
            const remainingMs = currentExpiry.getTime() - now.getTime()
            const reducedMs = remainingMs / 2
            
            await prisma.userBan.update({
                where: { id: appeal.banId },
                data: { expiresAt: new Date(now.getTime() + reducedMs) }
            })
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Appeal update error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
