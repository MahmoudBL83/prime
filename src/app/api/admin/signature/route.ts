import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

type SignatureCourseItem = {
    id: string
    type: 'proposal' | 'invitation'
    stage: string
    enrollments: number
    revenue: number
    rating?: number
    [key: string]: unknown
}

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

function mapStageFromProposal(stage: string, courseStatus?: string) {
    if (courseStatus === 'PUBLISHED') return 'published'
    switch (stage) {
        case 'APPROVED':
            return 'approved'
        case 'PRODUCTION_REVIEW':
            return 'review'
        case 'SCRIPT_REVIEW':
            return 'in-production'
        case 'REJECTED':
            return 'rejected'
        case 'PROPOSAL':
        default:
            return 'pitch'
    }
}

function progressForStage(stage: string) {
    switch (stage) {
        case 'invited':
            return 0
        case 'pitch':
            return 10
        case 'in-production':
            return 60
        case 'review':
            return 85
        case 'approved':
            return 95
        case 'published':
            return 100
        case 'rejected':
        default:
            return 0
    }
}

export async function GET(req: NextRequest) {
    try {
        const adminCheck = await requireAdmin()
        if ('error' in adminCheck) {
            return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
        }

        const [proposals, invitations] = await Promise.all([
            prisma.signatureCourseProposal.findMany({
                orderBy: { submittedAt: 'desc' },
                include: {
                    course: {
                        select: {
                            id: true,
                            title: true,
                            category: true,
                            price: true,
                            totalEnrollments: true,
                            rating: true,
                            status: true,
                            publishedAt: true,
                            _count: {
                                select: {
                                    lessons: true,
                                    videoAssets: true,
                                    assignments: true,
                                    quizzes: true
                                }
                            }
                        }
                    }
                }
            }),
            prisma.signatureCourseInvitation.findMany({
                orderBy: { invitedAt: 'desc' },
                include: {
                    creator: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            profileImage: true,
                            avatar: true
                        }
                    }
                }
            })
        ])

        const proposalCreatorIds = proposals.map(p => p.creatorId)
        const invitationCreatorIds = invitations.map(i => i.creatorId)
        const userIds = Array.from(new Set([...proposalCreatorIds, ...invitationCreatorIds]))

        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: {
                id: true,
                name: true,
                email: true,
                profileImage: true,
                avatar: true,
                role: true
            }
        })
        const userById = new Map(users.map(u => [u.id, u]))

        const mappedFromProposals = proposals.map((proposal) => {
            const creator = userById.get(proposal.creatorId)
            const stage = mapStageFromProposal(proposal.stage, proposal.course?.status)

            const enrollments = proposal.course?.totalEnrollments || 0
            const price = proposal.course?.price || proposal.pricing || 0
            const revenue = enrollments * price

            const content = {
                modules: proposal.course?._count.lessons || 0,
                videos: proposal.course?._count.videoAssets || 0,
                documents: proposal.course?._count.assignments || 0,
                quizzes: proposal.course?._count.quizzes || 0
            }

            return {
                id: proposal.id,
                type: 'proposal' as const,
                proposalId: proposal.id,
                courseId: proposal.courseId || undefined,
                title: proposal.courseTitle || proposal.course?.title || 'Signature Course Proposal',
                creator: {
                    id: creator?.id || proposal.creatorId,
                    name: creator?.name || 'Unknown Creator',
                    email: creator?.email,
                    avatar: creator?.avatar || (creator?.name ? creator.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() : 'SC'),
                    verified: creator?.role === UserRole.CREATOR || creator?.role === UserRole.ADMIN,
                    expertise: proposal.targetAudience || 'Expert creator'
                },
                stage,
                category: proposal.course?.category || 'General',
                estimatedPrice: price || 0,
                completionProgress: progressForStage(stage),
                content,
                quality: {
                    productionValue: Math.max(0, Math.min(100, Math.round((proposal.course?.rating || 0) * 20))) || 0,
                    contentDepth: 0,
                    pedagogicalDesign: 0,
                    marketFit: 0
                },
                enrollments,
                revenue,
                rating: proposal.course?.rating || undefined,
                submittedAt: proposal.submittedAt?.toISOString(),
                reviewedAt: proposal.reviewedAt?.toISOString(),
                notes: proposal.reviewNotes,
                creatorEmail: creator?.email
            } satisfies SignatureCourseItem
        })

        const proposalsCreatorSet = new Set(proposalCreatorIds)
        const mappedFromInvitations = invitations
            .filter(inv => !proposalsCreatorSet.has(inv.creatorId))
            .map((invitation) => {
                const creator = invitation.creator || userById.get(invitation.creatorId)
                const stage = invitation.status === 'DECLINED' ? 'rejected' : 'invited'
                return {
                    id: invitation.id,
                    type: 'invitation' as const,
                    invitationId: invitation.id,
                    title: 'Signature Course Invitation',
                    creator: {
                        id: creator?.id || invitation.creatorId,
                        name: creator?.name || 'Unknown Creator',
                        email: creator?.email,
                        avatar: creator?.avatar || (creator?.name ? creator.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() : 'SC'),
                        verified: false,
                        expertise: 'Invited expert'
                    },
                    stage,
                    category: 'General',
                    enrollments: 0,
                    revenue: 0,
                    rating: undefined,
                    estimatedPrice: 0,
                    completionProgress: progressForStage(stage),
                    content: { modules: 0, videos: 0, documents: 0, quizzes: 0 },
                    quality: { productionValue: 0, contentDepth: 0, pedagogicalDesign: 0, marketFit: 0 },
                    notes: invitation.message,
                    submittedAt: invitation.invitedAt.toISOString(),
                    creatorEmail: creator?.email
                } satisfies SignatureCourseItem
            })

        const courses: SignatureCourseItem[] = [...mappedFromProposals, ...mappedFromInvitations]

        const stats = (() => {
            const totalCourses = courses.length
            const inPipeline = courses.filter(c => ['invited', 'pitch', 'in-production'].includes(c.stage)).length
            const awaitingReview = courses.filter(c => c.stage === 'review').length
            const published = courses.filter(c => c.stage === 'published').length
            const totalRevenue = courses.reduce((sum, c) => sum + (c.revenue || 0), 0)
            const totalEnrollments = courses.reduce((sum, c) => sum + (c.enrollments || 0), 0)
            const ratings = courses.map(c => c.rating).filter((r): r is number => typeof r === 'number')
            const avgRating = ratings.length ? Number((ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(2)) : 0
            return { totalCourses, inPipeline, awaitingReview, published, totalRevenue, avgRating, totalEnrollments }
        })()

        return NextResponse.json({ courses, stats })
    } catch (error) {
        console.error('Admin signature courses GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}