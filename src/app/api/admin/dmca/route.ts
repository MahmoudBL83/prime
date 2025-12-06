import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DMCAStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const searchParams = req.nextUrl.searchParams
        const status = searchParams.get('status')
        const type = searchParams.get('type') || searchParams.get('claimType')
        const page = parseInt(searchParams.get('page') || '1')
        const pageSize = parseInt(searchParams.get('pageSize') || '25')

        // Build filter
        const where: Record<string, unknown> = {}

        const statusFilter = (() => {
            if (!status || status === 'all') return undefined
            const normalized = status.toLowerCase()
            const map: Record<string, DMCAStatus> = {
                pending: DMCAStatus.PENDING,
                under_review: DMCAStatus.UNDER_REVIEW,
                approved: DMCAStatus.CONTENT_REMOVED,
                resolved: DMCAStatus.RESOLVED,
                rejected: DMCAStatus.REJECTED,
                counter_notice_filed: DMCAStatus.COUNTER_NOTICE_FILED,
            }
            return map[normalized]
        })()

        if (statusFilter) {
            where.status = statusFilter
        }

        if (type && type !== 'all') {
            const normalized = type.toLowerCase()
            if (normalized === 'counter_notice') where.counterNotice = true
            if (normalized === 'takedown') where.counterNotice = false
        }

        // Fetch DMCA requests with stats
        const [
            dmcaRequests,
            total,
            pendingCount,
            reviewingCount,
            counterNoticeCount,
            removedCount,
            rejectedCount,
            resolvedCount,
        ] = await Promise.all([
            prisma.dMCARequest.findMany({
                where,
                take: pageSize,
                skip: (page - 1) * pageSize,
                orderBy: { submittedAt: 'desc' },
                include: {
                    reviewer: {
                        select: { id: true, name: true, email: true }
                    }
                }
            }),
            prisma.dMCARequest.count({ where }),
            prisma.dMCARequest.count({ where: { ...where, status: DMCAStatus.PENDING } }),
            prisma.dMCARequest.count({ where: { ...where, status: DMCAStatus.UNDER_REVIEW } }),
            prisma.dMCARequest.count({ where: { ...where, status: DMCAStatus.COUNTER_NOTICE_FILED } }),
            prisma.dMCARequest.count({ where: { ...where, status: DMCAStatus.CONTENT_REMOVED } }),
            prisma.dMCARequest.count({ where: { ...where, status: DMCAStatus.REJECTED } }),
            prisma.dMCARequest.count({ where: { ...where, status: DMCAStatus.RESOLVED } }),
        ])

        // Format requests
        const formattedRequests = dmcaRequests.map(request => ({
            id: request.id,
            requestNumber: request.caseNumber,
            type: request.counterNotice ? 'counter_notice' : 'takedown',
            status: (() => {
                switch (request.status) {
                    case DMCAStatus.PENDING:
                        return 'pending'
                    case DMCAStatus.UNDER_REVIEW:
                        return 'under_review'
                    case DMCAStatus.CONTENT_REMOVED:
                        return 'approved'
                    case DMCAStatus.RESOLVED:
                        return 'resolved'
                    case DMCAStatus.REJECTED:
                        return 'rejected'
                    case DMCAStatus.COUNTER_NOTICE_FILED:
                        return 'under_review'
                    default:
                        return 'pending'
                }
            })(),
            contentType: request.contentType?.toLowerCase() || 'course',
            contentId: request.contentId,
            contentTitle: request.contentTitle,
            creator: {
                id: request.contentId,
                name: 'Unknown creator',
                email: '',
            },
            complainant: {
                name: request.complainantName,
                email: request.complainantEmail,
                company: request.complainantCompany || undefined,
            },
            copyrightWork: request.originalWorkDesc,
            description: request.claimDescription,
            evidence: [],
            submittedAt: request.submittedAt.toISOString(),
            reviewedAt: request.reviewedAt?.toISOString(),
            resolvedAt: request.status === DMCAStatus.RESOLVED ? request.reviewedAt?.toISOString() : undefined,
            actionTaken: (() => {
                if (request.status === DMCAStatus.CONTENT_REMOVED) return 'content_removed'
                if (request.status === DMCAStatus.REJECTED) return 'dismissed'
                return undefined
            })(),
            reviewNotes: request.resolution || undefined,
            autoTakedownAt: null,
        }))

        return NextResponse.json({
            requests: formattedRequests,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize)
            },
            stats: {
                total,
                pending: pendingCount,
                underReview: reviewingCount + counterNoticeCount,
                resolved: resolvedCount + removedCount,
                rejected: rejectedCount,
            }
        })
    } catch (error) {
        console.error('Error fetching DMCA data:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await req.json()
        const { action, requestId, claimNumber, ...data } = body

        // Handle different actions
        if (action === 'create') {
            const year = new Date().getFullYear()
            const count = await prisma.dMCARequest.count() + 1
            const newCaseNumber = `DMCA-${year}-${count.toString().padStart(6, '0')}`

            const newRequest = await prisma.dMCARequest.create({
                data: {
                    caseNumber: newCaseNumber,
                    complainantName: data.complainantName || data.claimantName || 'Unknown',
                    complainantEmail: data.complainantEmail || data.claimantEmail || '',
                    complainantCompany: data.complainantCompany || data.claimantCompany || null,
                    contentType: data.contentType || 'COURSE',
                    contentId: data.contentId || data.courseId || 'unknown',
                    contentTitle: data.contentTitle || data.infringingDescription || 'Unknown content',
                    contentUrl: data.infringingUrl || null,
                    originalWorkUrl: data.originalWorkUrl || null,
                    originalWorkDesc: data.copyrightWork || data.originalWorkDesc || '',
                    claimDescription: data.claimDescription || data.infringingDescription || '',
                    counterNotice: !!data.counterNotice,
                    status: DMCAStatus.PENDING
                }
            })

            return NextResponse.json({ success: true, request: newRequest })
        }

        if (action === 'review') {
            const updated = await prisma.dMCARequest.update({
                where: { id: requestId },
                data: {
                    status: DMCAStatus.UNDER_REVIEW,
                    reviewedBy: session.user.id,
                    reviewedAt: new Date()
                }
            })

            return NextResponse.json({ success: true, request: updated })
        }

        if (action === 'validate') {
            const updated = await prisma.dMCARequest.update({
                where: { id: requestId },
                data: {
                    status: DMCAStatus.CONTENT_REMOVED,
                    resolution: data.notes,
                    contentRemoved: true,
                    reviewedBy: session.user.id,
                    reviewedAt: new Date()
                }
            })

            return NextResponse.json({ success: true, request: updated })
        }

        if (action === 'invalidate') {
            const updated = await prisma.dMCARequest.update({
                where: { id: requestId },
                data: {
                    status: DMCAStatus.REJECTED,
                    resolution: data.notes,
                    reviewedBy: session.user.id,
                    reviewedAt: new Date()
                }
            })

            return NextResponse.json({ success: true, request: updated })
        }

        if (action === 'resolve') {
            const updated = await prisma.dMCARequest.update({
                where: { id: requestId },
                data: {
                    status: DMCAStatus.RESOLVED,
                    resolution: data.notes,
                    reviewedBy: session.user.id,
                    reviewedAt: new Date()
                }
            })

            return NextResponse.json({ success: true, request: updated })
        }

        if (action === 'counter-claim') {
            const updated = await prisma.dMCARequest.update({
                where: { id: requestId },
                data: {
                    status: DMCAStatus.COUNTER_NOTICE_FILED,
                    counterNotice: true,
                    resolution: data.counterClaimText || data.notes || null,
                    reviewedBy: session.user.id,
                    reviewedAt: new Date()
                }
            })

            return NextResponse.json({ success: true, request: updated })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    } catch (error) {
        console.error('Error updating DMCA request:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
