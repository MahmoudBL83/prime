import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserAccessibleCourses } from '@/lib/subscription-access'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/my-learning
 * 
 * Returns all courses the user has access to based on their active subscriptions,
 * organized by enrollment status and progress
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Get all courses user has access to via subscriptions
        const accessibleCourses = await getUserAccessibleCourses(session.user.id)

        // Get user's enrollments to track progress
        const enrollments = await prisma.enrollment.findMany({
            where: {
                userId: session.user.id
            },
            include: {
                course: {
                    include: {
                        creator: {
                            include: {
                                user: {
                                    select: {
                                        name: true,
                                        arabicName: true,
                                        profileImage: true
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
                }
            },
            orderBy: {
                lastAccessedAt: 'desc'
            }
        })

        // Get user's subscriptions for display
        const subscriptions = await prisma.subscription.findMany({
            where: {
                userId: session.user.id,
                status: {
                    in: ['ACTIVE', 'CANCELLED']
                },
                endDate: {
                    gte: new Date()
                }
            },
            include: {
                channel: {
                    include: {
                        creator: {
                            include: {
                                user: {
                                    select: {
                                        name: true,
                                        profileImage: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        // Organize courses by status
        const inProgress = enrollments.filter(e => 
            e.progress > 0 && e.progress < 100
        )
        const completed = enrollments.filter(e => 
            e.progress >= 100
        )
        const notStarted = accessibleCourses.filter(course => 
            !enrollments.some(e => e.courseId === course.id)
        )

        // Calculate statistics
        const stats = {
            totalAccessibleCourses: accessibleCourses.length,
            totalEnrolled: enrollments.length,
            inProgress: inProgress.length,
            completed: completed.length,
            notStarted: notStarted.length,
            totalHoursLearned: Math.round(enrollments.reduce((sum, e) => 
                sum + (e.progress / 100 * (e.course.duration / 60)), 0
            )),
            averageProgress: enrollments.length > 0
                ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length)
                : 0
        }

        // Format response
        return NextResponse.json({
            stats,
            subscriptions: subscriptions.map(sub => ({
                id: sub.id,
                type: sub.type,
                status: sub.status,
                endDate: sub.endDate,
                channelId: sub.channel?.id, // Add channelId for navigation
                channelName: sub.channel?.name,
                creatorName: sub.channel?.creator?.user?.name,
                creatorImage: sub.channel?.creator?.user?.profileImage
            })),
            courses: {
                continueWatching: inProgress.slice(0, 10).map(e => ({
                    enrollmentId: e.id,
                    courseId: e.course.id,
                    title: e.course.title,
                    titleAr: e.course.titleAr,
                    thumbnail: e.course.thumbnail,
                    instructor: {
                        name: e.course.creator.user.name,
                        arabicName: e.course.creator.user.arabicName,
                        image: e.course.creator.user.profileImage
                    },
                    progress: e.progress,
                    lastAccessedAt: e.lastAccessedAt,
                    totalLessons: e.course._count.lessons,
                    duration: e.course.duration,
                    category: e.course.contentCategory
                })),
                completed: completed.slice(0, 10).map(e => ({
                    enrollmentId: e.id,
                    courseId: e.course.id,
                    title: e.course.title,
                    titleAr: e.course.titleAr,
                    thumbnail: e.course.thumbnail,
                    instructor: {
                        name: e.course.creator.user.name,
                        arabicName: e.course.creator.user.arabicName,
                        image: e.course.creator.user.profileImage
                    },
                    completedAt: e.completedAt,
                    totalLessons: e.course._count.lessons,
                    duration: e.course.duration,
                    category: e.course.contentCategory
                })),
                recommended: notStarted.slice(0, 10).map(course => ({
                    id: course.id,
                    title: course.title,
                    titleAr: course.titleAr,
                    thumbnail: course.thumbnail,
                    instructor: {
                        name: course.creator.user.name,
                        arabicName: course.creator.user.arabicName,
                        image: course.creator.user.profileImage
                    },
                    rating: course.rating,
                    totalEnrollments: course.totalEnrollments,
                    totalLessons: course._count.lessons,
                    duration: course.duration,
                    category: course.contentCategory,
                    skillLevel: course.skillLevel
                }))
            }
        })

    } catch (error) {
        console.error('My Learning error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch learning data' },
            { status: 500 }
        )
    }
}
