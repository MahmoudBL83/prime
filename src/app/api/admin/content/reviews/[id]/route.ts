import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * PUT /api/admin/content/reviews/[id]
 * Approve, reject, or request changes for a course
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()
        const { action, reviewNotes, qualityScore } = body

        // Validate action
        if (!['approve', 'reject', 'request_changes', 'start_review'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

        const course = await prisma.course.findUnique({
            where: { id },
            include: {
                creator: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        lessons: true
                    }
                }
            }
        })

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 })
        }

        let updateData: any = {}
        let message = ''

        switch (action) {
            case 'approve':
                // Quality checks before approval
                if (course._count.lessons === 0) {
                    return NextResponse.json({ 
                        error: 'Cannot approve course with no lessons' 
                    }, { status: 400 })
                }

                if (!course.thumbnail) {
                    return NextResponse.json({ 
                        error: 'Cannot approve course without thumbnail' 
                    }, { status: 400 })
                }

                updateData = {
                    status: 'PUBLISHED',
                    publishedAt: new Date()
                }
                message = 'Course approved and published successfully'
                
                // TODO: Send approval notification to creator
                // TODO: Update creator's first-publish flag if this is their first course
                
                break

            case 'reject':
                if (!reviewNotes || reviewNotes.trim().length < 10) {
                    return NextResponse.json({ 
                        error: 'Please provide detailed review notes (minimum 10 characters)' 
                    }, { status: 400 })
                }

                updateData = {
                    status: 'REJECTED'
                }
                message = 'Course rejected'
                
                // Create content strike record
                await prisma.contentStrike.create({
                    data: {
                        creatorId: course.creatorId,
                        contentType: 'COURSE',
                        contentId: course.id,
                        reason: reviewNotes,
                        severity: 'MINOR',
                        issuedBy: session.user.id
                    }
                })
                
                // TODO: Send rejection email with detailed feedback
                
                break

            case 'request_changes':
                if (!reviewNotes || reviewNotes.trim().length < 10) {
                    return NextResponse.json({ 
                        error: 'Please provide detailed feedback (minimum 10 characters)' 
                    }, { status: 400 })
                }

                updateData = {
                    status: 'DRAFT'
                }
                message = 'Changes requested - course returned to draft'
                
                // TODO: Send notification to creator with feedback
                
                break

            case 'start_review':
                updateData = {
                    status: 'UNDER_REVIEW'
                }
                message = 'Course marked as under review'
                break

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

        // Update course
        const updatedCourse = await prisma.course.update({
            where: { id },
            data: updateData
        })

        // Create review record (for audit trail)
        await prisma.courseReview.create({
            data: {
                courseId: id,
                reviewerId: session.user.id,
                status: action === 'approve' ? 'APPROVED' : 
                        action === 'reject' ? 'REJECTED' : 'REQUIRES_CHANGES',
                notes: reviewNotes || null,
                checklist: qualityScore ? { score: qualityScore } : null
            }
        })

        return NextResponse.json({
            success: true,
            message,
            course: {
                id: updatedCourse.id,
                status: updatedCourse.status,
                publishedAt: updatedCourse.publishedAt
            }
        })

    } catch (error) {
        console.error('Error updating course review:', error)
        return NextResponse.json(
            { error: 'Failed to update course review' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/admin/content/reviews/[id]
 * Get detailed course information for review
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        const course = await prisma.course.findUnique({
            where: { id },
            include: {
                creator: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                arabicName: true,
                                profileImage: true,
                                bio: true,
                                createdAt: true
                            }
                        },
                        courses: {
                            select: {
                                id: true,
                                status: true
                            }
                        }
                    }
                },
                lessons: {
                    orderBy: { order: 'asc' },
                    select: {
                        id: true,
                        title: true,
                        titleAr: true,
                        description: true,
                        duration: true,
                        videoUrl: true,
                        order: true,
                        seasonNumber: true,
                        episodeNumber: true
                    }
                },
                _count: {
                    select: {
                        lessons: true,
                        enrollments: true
                    }
                }
            }
        })

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 })
        }

        // Get creator statistics
        const creatorStats = {
            totalCourses: course.creator.courses.length,
            publishedCourses: course.creator.courses.filter(c => c.status === 'PUBLISHED').length,
            isFirstCourse: course.creator.courses.filter(c => c.status === 'PUBLISHED').length === 0
        }

        // Get previous review history for this course
        const reviewHistory = await prisma.courseReview.findMany({
            where: { courseId: id },
            include: {
                reviewer: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: { reviewedAt: 'desc' }
        })

        // Get creator's content strikes
        const strikes = await prisma.contentStrike.findMany({
            where: {
                creatorId: course.creatorId,
                contentType: 'COURSE'
            },
            orderBy: { issuedAt: 'desc' },
            take: 5
        })

        return NextResponse.json({
            success: true,
            course: {
                ...course,
                creatorStats,
                reviewHistory: reviewHistory.map(r => ({
                    id: r.id,
                    status: r.status,
                    notes: r.notes,
                    reviewedAt: r.reviewedAt,
                    reviewer: r.reviewer
                })),
                strikes: strikes.map(s => ({
                    id: s.id,
                    reason: s.reason,
                    severity: s.severity,
                    issuedAt: s.issuedAt
                }))
            }
        })

    } catch (error) {
        console.error('Error fetching course details:', error)
        return NextResponse.json(
            { error: 'Failed to fetch course details' },
            { status: 500 }
        )
    }
}
