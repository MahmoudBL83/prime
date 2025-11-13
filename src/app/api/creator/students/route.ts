import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/creator/students - Fetch student roster with engagement data
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 })
        }

        const searchParams = request.nextUrl.searchParams
        const courseId = searchParams.get('courseId')
        const channelId = searchParams.get('channelId')
        const sortBy = searchParams.get('sortBy') || 'recent'

        // Get enrolled students
        const enrollments = await prisma.enrollment.findMany({
            where: {
                course: {
                    creatorId: creator.id,
                    ...(courseId ? { id: courseId } : {})
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                course: {
                    select: {
                        id: true,
                        title: true,
                        titleAr: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        // Get channel subscribers
        const subscriptions = await prisma.subscription.findMany({
            where: {
                channel: {
                    creatorId: creator.id,
                    ...(channelId ? { id: channelId } : {})
                },
                status: 'ACTIVE'
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                channel: {
                    select: {
                        id: true,
                        name: true,
                        nameAr: true
                    }
                }
            }
        })

        // Calculate engagement metrics
        const studentsMap = new Map()

        // Add enrolled students
        for (const enrollment of enrollments) {
            const student = studentsMap.get(enrollment.userId) || {
                userId: enrollment.user.id,
                name: enrollment.user.name,
                email: enrollment.user.email,
                courses: [],
                channels: [],
                totalProgress: Math.round(enrollment.progress),
                completedLessons: 0,
                totalLessons: 0,
                lastActive: enrollment.lastAccessedAt || enrollment.createdAt
            }

            student.courses.push({
                id: enrollment.course.id,
                title: enrollment.course.title,
                enrolledAt: enrollment.createdAt,
                progress: Math.round(enrollment.progress),
                lastAccessed: enrollment.lastAccessedAt
            })

            studentsMap.set(enrollment.userId, student)
        }

        // Add channel subscribers
        for (const sub of subscriptions) {
            const student = studentsMap.get(sub.userId) || {
                userId: sub.user.id,
                name: sub.user.name,
                email: sub.user.email,
                courses: [],
                channels: [],
                totalProgress: 0,
                completedLessons: 0,
                totalLessons: 0,
                lastActive: sub.startDate
            }

            if (sub.channel) {
                student.channels.push({
                    id: sub.channel.id,
                    name: sub.channel.name,
                    tier: sub.type || 'BRONZE',
                    startDate: sub.startDate
                })
            }

            if (sub.startDate > student.lastActive) {
                student.lastActive = sub.startDate
            }

            studentsMap.set(sub.userId, student)
        }

        // Calculate overall metrics
        const students = Array.from(studentsMap.values()).map(student => ({
            ...student,
            engagement: calculateEngagement(student)
        }))

        // Sort students
        if (sortBy === 'progress') {
            students.sort((a, b) => b.totalProgress - a.totalProgress)
        } else if (sortBy === 'engagement') {
            students.sort((a, b) => b.engagement - a.engagement)
        } else if (sortBy === 'name') {
            students.sort((a, b) => a.name.localeCompare(b.name))
        }

        return NextResponse.json({
            success: true,
            students,
            stats: {
                totalStudents: students.length,
                totalEnrolled: enrollments.length,
                totalSubscribers: subscriptions.length,
                activeStudents: students.filter(s => 
                    s.lastActive && 
                    (new Date().getTime() - new Date(s.lastActive).getTime()) < 7 * 24 * 60 * 60 * 1000
                ).length
            }
        })

    } catch (error) {
        console.error('Error fetching students:', error)
        return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
    }
}

function calculateEngagement(student: any): number {
    let score = 0
    
    // Course progress (40 points max)
    score += student.totalProgress * 0.4
    
    // Active courses (20 points max)
    score += Math.min(student.courses.length * 5, 20)
    
    // Channel subscriptions (20 points max)
    score += Math.min(student.channels.length * 10, 20)
    
    // Recent activity (20 points max)
    if (student.lastActive) {
        const daysSinceActive = (new Date().getTime() - new Date(student.lastActive).getTime()) / (1000 * 60 * 60 * 24)
        if (daysSinceActive < 1) score += 20
        else if (daysSinceActive < 3) score += 15
        else if (daysSinceActive < 7) score += 10
        else if (daysSinceActive < 30) score += 5
    }
    
    return Math.round(score)
}
