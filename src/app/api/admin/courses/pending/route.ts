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

        // Check if user is admin
        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        })

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({
                error: 'Admin access required'
            }, { status: 403 })
        }

        // Get courses pending review
        const pendingCourses = await prisma.course.findMany({
            where: {
                status: 'UNDER_REVIEW'
            },
            orderBy: {
                updatedAt: 'desc'
            }
        })

        // Get additional data for each course
        const coursesWithDetails = await Promise.all(
            pendingCourses.map(async (course) => {
                const [creator, lessonCount, enrollmentCount, videoAssets] = await Promise.all([
                    prisma.creator.findUnique({
                        where: { id: course.creatorId },
                        include: {
                            user: {
                                select: { name: true, email: true }
                            }
                        }
                    }),
                    prisma.lesson.count({
                        where: { courseId: course.id }
                    }),
                    prisma.enrollment.count({
                        where: { courseId: course.id }
                    }),
                    prisma.videoAsset.findMany({
                        where: { courseId: course.id },
                        select: { id: true, status: true, duration: true }
                    })
                ])

                return {
                    ...course,
                    creator,
                    lessonCount,
                    enrollmentCount,
                    videoAssets
                }
            })
        )

        // Transform data for admin dashboard
        const transformedCourses = coursesWithDetails.map(course => ({
            id: course.id,
            title: course.title,
            titleAr: course.titleAr,
            description: course.description,
            category: course.category,
            skillLevel: course.skillLevel,
            price: course.price,
            duration: course.duration,
            thumbnail: course.thumbnail,
            createdAt: course.createdAt,
            updatedAt: course.updatedAt,
            creator: course.creator ? {
                id: course.creator.id,
                name: course.creator.user.name,
                email: course.creator.user.email,
                expertise: course.creator.expertise
            } : null,
            stats: {
                totalLessons: course.lessonCount,
                totalEnrollments: course.enrollmentCount,
                videoCount: course.videoAssets.length,
                readyVideos: course.videoAssets.filter((asset: any) => asset.status === 'READY').length
            }
        }))

        return NextResponse.json({
            success: true,
            courses: transformedCourses,
            total: transformedCourses.length
        })

    } catch (error) {
        console.error('Pending courses fetch error:', error)
        return NextResponse.json({
            error: 'Failed to fetch pending courses'
        }, { status: 500 })
    }
}
