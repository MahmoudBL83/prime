import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.user.id

        // Get user enrollment and progress data
        const enrollments = await prisma.enrollment.findMany({
            where: { userId },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        titleAr: true,
                        creator: {
                            select: {
                                user: {
                                    select: {
                                        name: true,
                                        arabicName: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        // Get meetings count
        const upcomingMeetingsCount = await prisma.meeting.count({
            where: {
                studentId: userId,
                status: {
                    in: ['SCHEDULED', 'CONFIRMED']
                },
                scheduledAt: {
                    gte: new Date()
                }
            }
        })

        const totalMeetingsCount = await prisma.meeting.count({
            where: { studentId: userId }
        })

        // Get unread messages count (approximate based on recent messages)
        const unreadMessagesCount = await prisma.message.count({
            where: {
                conversation: {
                    participants: {
                        some: { userId }
                    }
                },
                senderId: {
                    not: userId
                },
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                }
            }
        })

        // Calculate learning statistics
        const totalCourses = enrollments.length
        const completedCourses = enrollments.filter(e => e.progress >= 100).length
        const inProgressCourses = enrollments.filter(e => e.progress > 0 && e.progress < 100).length
        
        const averageProgress = totalCourses > 0 
            ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / totalCourses)
            : 0

        // Calculate total learning hours (estimated)
        const totalLearningHours = Math.round(
            enrollments.reduce((sum, e) => sum + (e.progress * 2), 0) // 2 hours per course completion
        )

        // Calculate average rating from course ratings
        const courseIds = enrollments.map(e => e.courseId)
        const ratings = await prisma.review.findMany({
            where: {
                userId,
                courseId: { in: courseIds }
            },
            select: { rating: true }
        })

        const averageRating = ratings.length > 0
            ? Math.round((ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length) * 10) / 10
            : 4.5

        // Get recent activity
        const recentEnrollments = await prisma.enrollment.findMany({
            where: { userId },
            include: {
                course: {
                    select: {
                        title: true,
                        titleAr: true
                    }
                }
            },
            orderBy: { lastAccessedAt: 'desc' },
            take: 5
        })

        const recentMeetings = await prisma.meeting.findMany({
            where: {
                studentId: userId,
                status: 'COMPLETED',
                scheduledAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                }
            },
            include: {
                creator: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                arabicName: true
                            }
                        }
                    }
                }
            },
            orderBy: { scheduledAt: 'desc' },
            take: 3
        })

        // Get study buddy matches from database
        const studyBuddyMatches = await prisma.studyBuddyMatch.count({
            where: {
                OR: [
                    { user1Id: userId },
                    { user2Id: userId }
                ],
                status: 'ACCEPTED'
            }
        })

        // Continue learning - courses in progress
        const continueLearning = enrollments
            .filter(e => e.progress > 0 && e.progress < 100)
            .slice(0, 3)
            .map(e => ({
                id: e.courseId,
                title: e.course.title,
                titleAr: e.course.titleAr,
                progress: e.progress,
                lastAccessed: e.lastAccessedAt?.toISOString(),
                instructor: {
                    name: e.course.creator.user.name,
                    arabicName: e.course.creator.user.arabicName
                }
            }))

        // Get recent study buddy matches
        const recentStudyBuddyMatches = await prisma.studyBuddyMatch.findMany({
            where: {
                OR: [
                    { user1Id: userId },
                    { user2Id: userId }
                ],
                status: 'ACCEPTED',
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                }
            },
            include: {
                user1: {
                    select: {
                        name: true,
                        arabicName: true
                    }
                },
                user2: {
                    select: {
                        name: true,
                        arabicName: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 2
        })

        // Recent activities formatted
        const recentActivities = [
            ...recentEnrollments.slice(0, 2).map(e => ({
                type: 'course_progress',
                title: e.course.title,
                titleAr: e.course.titleAr,
                description: `Completed lessons in ${e.course.title}`,
                descriptionAr: `أكمل دروس في ${e.course.titleAr || e.course.title}`,
                timestamp: e.lastAccessedAt?.toISOString() || e.updatedAt.toISOString(),
                icon: 'book'
            })),
            ...recentMeetings.slice(0, 1).map(m => ({
                type: 'meeting_completed',
                title: `Meeting with ${m.creator.user.name}`,
                titleAr: `اجتماع مع ${m.creator.user.arabicName || m.creator.user.name}`,
                description: 'Completed 1-on-1 session',
                descriptionAr: 'أكمل جلسة فردية',
                timestamp: m.scheduledAt.toISOString(),
                icon: 'users'
            })),
            ...recentStudyBuddyMatches.map(match => {
                const otherUser = match.user1Id === userId ? match.user2 : match.user1
                return {
                    type: 'study_buddy_match',
                    title: `Matched with ${otherUser.name}`,
                    titleAr: `تم المطابقة مع ${otherUser.arabicName || otherUser.name}`,
                    description: 'New study buddy connection',
                    descriptionAr: 'اتصال جديد لرفيق الدراسة',
                    timestamp: match.createdAt.toISOString(),
                    icon: 'users'
                }
            })
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

        const stats = {
            totalCourses,
            completedCourses,
            inProgressCourses,
            averageProgress,
            totalLearningHours,
            averageRating,
            upcomingMeetingsCount,
            totalMeetingsCount,
            unreadMessagesCount,
            studyBuddyMatches,
            continueLearning,
            recentActivities: recentActivities.slice(0, 5)
        }

        return NextResponse.json({ stats })
    } catch (error) {
        console.error('Learning stats fetch error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch learning stats' },
            { status: 500 }
        )
    }
}
