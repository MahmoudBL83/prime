import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

/**
 * Unified Content Moderation API for Admin
 * POST: Perform moderation actions (hide, remove, warn, approve, reject)
 * GET: List pending moderation items
 */

const moderationSchema = z.object({
    contentType: z.enum(['course', 'lesson', 'video', 'live_session', 'post', 'comment', 'review']),
    contentId: z.string().min(1),
    action: z.enum(['hide', 'unhide', 'remove', 'warn', 'approve', 'reject', 'flag', 'dismiss']),
    reason: z.string().optional(),
    notifyCreator: z.boolean().default(true),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM')
})

// GET: List content pending moderation
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const contentType = searchParams.get('type')
        const status = searchParams.get('status') || 'pending'
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')

        // Get courses pending review
        const pendingCourses = await prisma.course.findMany({
            where: {
                status: status === 'pending' ? 'PENDING_REVIEW' : undefined,
                ...(contentType === 'course' ? {} : contentType ? { id: 'never' } : {})
            },
            select: {
                id: true,
                title: true,
                titleAr: true,
                status: true,
                isHidden: true,
                createdAt: true,
                creator: {
                    select: {
                        id: true,
                        user: { select: { id: true, name: true, email: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit
        })

        // Get flagged content from reviews
        const flaggedReviews = await prisma.review.findMany({
            where: {
                // Flagged reviews (with reports)
                ...(contentType === 'review' || !contentType ? {} : { id: 'never' })
            },
            select: {
                id: true,
                rating: true,
                comment: true,
                createdAt: true,
                userId: true,
                user: { select: { id: true, name: true, email: true } },
                course: { select: { id: true, title: true } }
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit
        })

        // Get moderation history
        const moderationHistory = await prisma.moderationEvent.findMany({
            where: {
                source: 'ADMIN_ACTION',
                eventType: { startsWith: 'CONTENT_' }
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
            select: {
                id: true,
                eventType: true,
                severity: true,
                reason: true,
                createdAt: true,
                resolvedAt: true,
                metadata: true,
                user: { select: { id: true, name: true, email: true } }
            }
        })

        return NextResponse.json({
            pendingCourses: pendingCourses.map(c => ({
                id: c.id,
                type: 'course',
                title: c.title,
                titleAr: c.titleAr,
                status: c.status,
                isHidden: c.isHidden,
                createdAt: c.createdAt,
                creator: c.creator?.user
            })),
            flaggedReviews: flaggedReviews.map(r => ({
                id: r.id,
                type: 'review',
                rating: r.rating,
                comment: r.comment,
                createdAt: r.createdAt,
                user: r.user,
                course: r.course
            })),
            moderationHistory,
            stats: {
                pendingCourses: pendingCourses.length,
                flaggedContent: flaggedReviews.length
            }
        })
    } catch (error) {
        console.error('Content moderation GET error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch moderation data' },
            { status: 500 }
        )
    }
}

// POST: Perform moderation action
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const parsed = moderationSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
        }

        const { contentType, contentId, action, reason, notifyCreator, severity } = parsed.data
        let result: any = null
        let creatorId: string | null = null
        let contentTitle = ''
        let moderationEventType = `CONTENT_${action.toUpperCase()}`

        // Process based on content type
        switch (contentType) {
            case 'course': {
                const course = await prisma.course.findUnique({
                    where: { id: contentId },
                    select: {
                        id: true,
                        title: true,
                        creatorId: true,
                        creator: { select: { userId: true, user: { select: { name: true } } } }
                    }
                })

                if (!course) {
                    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
                }

                contentTitle = course.title
                creatorId = course.creator.userId

                switch (action) {
                    case 'hide':
                        result = await prisma.course.update({
                            where: { id: contentId },
                            data: { isHidden: true }
                        })
                        break
                    case 'unhide':
                        result = await prisma.course.update({
                            where: { id: contentId },
                            data: { isHidden: false }
                        })
                        break
                    case 'approve':
                        result = await prisma.course.update({
                            where: { id: contentId },
                            data: { status: 'PUBLISHED', publishedAt: new Date() }
                        })
                        break
                    case 'reject':
                        result = await prisma.course.update({
                            where: { id: contentId },
                            data: { status: 'REJECTED' }
                        })
                        break
                    case 'remove':
                        result = await prisma.course.update({
                            where: { id: contentId },
                            data: { status: 'ARCHIVED', isHidden: true }
                        })
                        break
                }
                break
            }

            case 'lesson': {
                const lesson = await prisma.lesson.findUnique({
                    where: { id: contentId },
                    select: {
                        id: true,
                        title: true,
                        section: {
                            select: {
                                course: {
                                    select: {
                                        creatorId: true,
                                        creator: { select: { userId: true } }
                                    }
                                }
                            }
                        }
                    }
                })

                if (!lesson) {
                    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
                }

                contentTitle = lesson.title
                creatorId = lesson.section.course.creator.userId

                switch (action) {
                    case 'hide':
                        result = await prisma.lesson.update({
                            where: { id: contentId },
                            data: { isPublished: false }
                        })
                        break
                    case 'unhide':
                        result = await prisma.lesson.update({
                            where: { id: contentId },
                            data: { isPublished: true }
                        })
                        break
                    case 'remove':
                        result = await prisma.lesson.update({
                            where: { id: contentId },
                            data: { isPublished: false }
                        })
                        break
                }
                break
            }

            case 'review': {
                const review = await prisma.review.findUnique({
                    where: { id: contentId },
                    select: { id: true, userId: true, comment: true }
                })

                if (!review) {
                    return NextResponse.json({ error: 'Review not found' }, { status: 404 })
                }

                contentTitle = review.comment?.substring(0, 50) || 'Review'
                creatorId = review.userId

                switch (action) {
                    case 'remove':
                        result = await prisma.review.delete({
                            where: { id: contentId }
                        })
                        break
                    case 'dismiss':
                        // Mark as reviewed (no action needed)
                        result = { dismissed: true }
                        break
                }
                break
            }
        }

        // Create moderation event for creator
        if (creatorId) {
            await prisma.moderationEvent.create({
                data: {
                    userId: creatorId,
                    eventType: moderationEventType,
                    severity: severity,
                    status: 'RESOLVED',
                    reason: reason || `Admin ${action} action on ${contentType}`,
                    source: 'ADMIN_ACTION',
                    resolvedAt: new Date(),
                    resolvedBy: session.user.id,
                    metadata: {
                        contentType,
                        contentId,
                        action,
                        contentTitle
                    }
                }
            })
        }

        // Send notification to creator
        if (notifyCreator && creatorId) {
            const notificationTitle = action === 'approve' ? 'Content Approved' :
                action === 'reject' ? 'Content Rejected' :
                    action === 'hide' ? 'Content Hidden' :
                        action === 'remove' ? 'Content Removed' :
                            action === 'warn' ? 'Content Warning' : 'Content Update'

            const notificationMessage = action === 'approve'
                ? `Your ${contentType} "${contentTitle}" has been approved and is now published.`
                : action === 'reject'
                    ? `Your ${contentType} "${contentTitle}" has been rejected. ${reason || 'Please review our content guidelines.'}`
                    : action === 'hide' || action === 'remove'
                        ? `Your ${contentType} "${contentTitle}" has been ${action === 'hide' ? 'hidden' : 'removed'}. ${reason || ''}`
                        : `Your ${contentType} "${contentTitle}" requires attention. ${reason || ''}`

            await prisma.notification.create({
                data: {
                    userId: creatorId,
                    type: action === 'approve' ? 'GENERAL' : 'WARNING',
                    title: notificationTitle,
                    message: notificationMessage,
                    metadata: { contentType, contentId, action, adminAction: true }
                }
            })
        }

        // Log admin action
        await prisma.adminAuditLog.create({
            data: {
                adminId: session.user.id,
                action: `${action.toUpperCase()}_${contentType.toUpperCase()}`,
                module: 'Content Moderation',
                details: `${action} ${contentType}: ${contentTitle}. ${reason || ''}`,
                status: 'SUCCESS',
                targetId: contentId,
                targetType: contentType.toUpperCase(),
                metadata: { contentType, contentId, action, reason, severity }
            }
        })

        return NextResponse.json({
            success: true,
            action,
            contentType,
            contentId,
            result,
            message: `${contentType} ${action} successfully`
        })
    } catch (error) {
        console.error('Content moderation POST error:', error)
        return NextResponse.json(
            { error: 'Failed to perform moderation action' },
            { status: 500 }
        )
    }
}
