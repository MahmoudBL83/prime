import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export async function GET(request: NextRequest) {
    try {
        // Verify admin authentication
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
        const firstTime = searchParams.get('firstTime')

        // Build filter
        const where: any = {
            status: { in: ['UNDER_REVIEW'] }
        }

        if (status === 'pending') {
            where.status = 'UNDER_REVIEW'
        } else if (status === 'all') {
            delete where.status
        }

        // Get courses under review with creator info
        const courses = await prisma.course.findMany({
            where,
            include: {
                creator: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        },
                        _count: {
                            select: {
                                courses: {
                                    where: { status: 'PUBLISHED' }
                                }
                            }
                        }
                    }
                },
                lessons: {
                    select: {
                        id: true,
                        duration: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        })

        // Transform to submission format
        const submissions = courses.map(course => {
            const isFirstTime = course.creator._count.courses === 0
            const submittedDate = course.updatedAt
            const daysInQueue = Math.floor((Date.now() - new Date(submittedDate).getTime()) / (1000 * 60 * 60 * 24))
            const totalDuration = course.lessons.reduce((sum, l) => sum + (l.duration || 0), 0)

            let slaStatus: 'on_time' | 'near_breach' | 'breached' = 'on_time'
            if (daysInQueue > 7) {
                slaStatus = 'breached'
            } else if (daysInQueue > 5) {
                slaStatus = 'near_breach'
            }

            return {
                id: course.id,
                courseTitle: course.title,
                creator: {
                    id: course.creator.id,
                    name: course.creator.user.name || 'Unknown',
                    email: course.creator.user.email || '',
                    isFirstTime,
                    previousApprovals: course.creator._count.courses
                },
                submittedDate: submittedDate.toISOString(),
                status: 'pending_first_review',
                daysInQueue,
                slaStatus,
                totalLessons: course.lessons.length,
                totalDuration,
                category: course.contentCategory === 'CATEGORY_A' ? 'Category A - All-Access Library' :
                         course.contentCategory === 'CATEGORY_B' ? 'Category B - Premium Content' :
                         'Category C - Exclusive',
                thumbnail: course.thumbnail || '/placeholder-course.jpg',
                autoCheckResults: {
                    videoQuality: 'good' as const,
                    audioQuality: 'good' as const,
                    captionsAvailable: true,
                    policyFlags: 0,
                    plagiarismScore: 0
                }
            }
        })

        // Filter by first time if requested
        const filtered = firstTime === 'true' 
            ? submissions.filter(s => s.creator.isFirstTime)
            : firstTime === 'false'
            ? submissions.filter(s => !s.creator.isFirstTime)
            : submissions

        return NextResponse.json({ 
            submissions: filtered,
            stats: {
                totalFirstTime: submissions.filter(s => s.creator.isFirstTime).length,
                totalOngoing: submissions.filter(s => !s.creator.isFirstTime).length,
                underReview: submissions.length,
                slaBreached: submissions.filter(s => s.slaStatus === 'breached').length
            }
        })

    } catch (error) {
        console.error('Content review API error:', error)
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

        const { courseId, action, notes } = await request.json()

        if (!courseId || !action) {
            return NextResponse.json(
                { error: 'Course ID and action required' },
                { status: 400 }
            )
        }

        let newStatus: 'PUBLISHED' | 'REJECTED' | 'DRAFT'

        switch (action) {
            case 'approve':
                newStatus = 'PUBLISHED'
                break
            case 'reject':
                newStatus = 'REJECTED'
                break
            case 'request_revisions':
                newStatus = 'DRAFT'
                break
            default:
                return NextResponse.json(
                    { error: 'Invalid action' },
                    { status: 400 }
                )
        }

        const course = await prisma.course.update({
            where: { id: courseId },
            data: {
                status: newStatus,
                publishedAt: action === 'approve' ? new Date() : undefined
            }
        })

        // TODO: Send notification to creator about the review result

        return NextResponse.json({ 
            success: true, 
            course: {
                id: course.id,
                title: course.title,
                status: course.status
            }
        })

    } catch (error) {
        console.error('Content review update error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
