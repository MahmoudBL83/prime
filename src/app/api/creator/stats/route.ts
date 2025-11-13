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

        // Get creator profile
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json({
                totalCourses: 0,
                totalStudents: 0,
                totalRevenue: 0,
                totalViews: 0
            })
        }

        // Get creator statistics
        const [coursesCount, enrollmentsData, totalViews] = await Promise.all([
            // Total courses
            prisma.course.count({
                where: { creatorId: creator.id }
            }),

            // Total students and revenue
            prisma.enrollment.groupBy({
                by: ['courseId'],
                where: {
                    course: {
                        creatorId: creator.id
                    }
                },
                _count: {
                    userId: true
                }
            }),

            // Total course views
            prisma.course.aggregate({
                where: { creatorId: creator.id },
                _sum: {
                    totalViews: true
                }
            })
        ])

        const totalStudents = enrollmentsData.reduce((sum, enrollment) => sum + enrollment._count.userId, 0)

        // Calculate revenue (simplified - would need actual payment data)
        const courses = await prisma.course.findMany({
            where: { creatorId: creator.id },
            include: {
                _count: {
                    select: {
                        enrollments: true
                    }
                }
            }
        })

        const totalRevenue = courses.reduce((sum, course) => {
            return sum + (course.price || 0) * course._count.enrollments
        }, 0)

        return NextResponse.json({
            totalCourses: coursesCount,
            totalStudents,
            totalRevenue,
            totalViews: totalViews._sum.totalViews || 0
        })

    } catch (error) {
        console.error('Creator stats error:', error)
        return NextResponse.json({
            error: 'Failed to fetch creator statistics'
        }, { status: 500 })
    }
}
