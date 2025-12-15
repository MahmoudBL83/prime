import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Content Review Queue API
 * Admin endpoint for reviewing first-time creator courses
 * GET /api/admin/content/review-queue
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status') || 'UNDER_REVIEW'
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const skip = (page - 1) * limit

        // Find courses pending review (first-time courses from each creator)
        const courses = await prisma.course.findMany({
            where: {
                status: status as any
            },
            include: {
                creator: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                arabicName: true,
                                email: true,
                                profileImage: true,
                                createdAt: true
                            }
                        },
                        _count: {
                            select: { courses: true }
                        }
                    }
                },
                lessons: {
                    select: { id: true, title: true, duration: true }
                },
                _count: {
                    select: { lessons: true, enrollments: true }
                }
            },
            orderBy: { createdAt: 'asc' },
            skip,
            take: limit
        })

        const totalCount = await prisma.course.count({
            where: { status: status as any }
        })

        // Identify first-time creators
        const enrichedCourses = courses.map(course => ({
            ...course,
            isFirstCourse: course.creator._count.courses === 1,
            creatorStats: {
                totalCourses: course.creator._count.courses,
                joinedAt: course.creator.user.createdAt,
                kycStatus: course.creator.kycStatus
            }
        }))

        // Get review stats
        const stats = await prisma.course.groupBy({
            by: ['status'],
            _count: { id: true }
        })

        return NextResponse.json({
            courses: enrichedCourses,
            pagination: {
                page,
                limit,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limit)
            },
            stats: {
                pendingReview: stats.find(s => s.status === 'UNDER_REVIEW')?._count.id || 0,
                draft: stats.find(s => s.status === 'DRAFT')?._count.id || 0,
                published: stats.find(s => s.status === 'PUBLISHED')?._count.id || 0,
                rejected: stats.find(s => s.status === 'REJECTED')?._count.id || 0
            }
        })
    } catch (error) {
        console.error('Review queue GET error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch review queue' },
            { status: 500 }
        )
    }
}

// POST: Review a course (approve/reject)
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { courseId, action, reason, notes } = body

        if (!courseId || !action) {
            return NextResponse.json(
                { error: 'courseId and action are required' },
                { status: 400 }
            )
        }

        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                creator: {
                    include: { user: true }
                }
            }
        })

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 })
        }

        let updateData: any = {}
        let notificationMessage = ''

        switch (action) {
            case 'approve':
                updateData = {
                    status: 'PUBLISHED',
                    publishedAt: new Date()
                }
                notificationMessage = `Your course "${course.title}" has been approved and published!`
                break

            case 'reject':
                if (!reason) {
                    return NextResponse.json(
                        { error: 'Reason is required for rejection' },
                        { status: 400 }
                    )
                }
                updateData = {
                    status: 'REJECTED'
                }
                notificationMessage = `Your course "${course.title}" needs revisions: ${reason}`
                break

            case 'request_changes':
                updateData = {
                    status: 'DRAFT'
                }
                notificationMessage = `Your course "${course.title}" requires changes: ${reason}`
                break

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

        // Update course
        const updatedCourse = await prisma.course.update({
            where: { id: courseId },
            data: updateData
        })

        // Create notification for creator
        await prisma.notification.create({
            data: {
                userId: course.creator.userId,
                type: 'COURSE_REVIEW',
                title: action === 'approve' ? 'Course Approved!' : 'Course Review Update',
                message: notificationMessage,
                metadata: {
                    courseId,
                    action,
                    reason,
                    notes,
                    reviewedBy: session.user.id,
                    reviewedAt: new Date().toISOString()
                }
            }
        })

        // Log the action
        await prisma.adminAuditLog.create({
            data: {
                adminId: session.user.id,
                adminName: session.user.name || 'Unknown Admin',
                adminEmail: session.user.email || 'unknown@admin.com',
                action: `COURSE_${action.toUpperCase()}`,
                module: 'Content Review',
                details: `${action} course: ${course.title}. ${reason || ''}`,
                status: 'SUCCESS'
            }
        })

        return NextResponse.json({
            course: updatedCourse,
            message: `Course ${action}d successfully`
        })
    } catch (error) {
        console.error('Review queue POST error:', error)
        return NextResponse.json(
            { error: 'Failed to review course' },
            { status: 500 }
        )
    }
}
