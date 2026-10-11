import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkCourseAccess } from '@/lib/subscription-access'
import { presentCourse } from '@/lib/course-presentation'

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const [{ id }, session] = await Promise.all([params, getServerSession(authOptions)])
        const course = await prisma.course.findUnique({
            where: { id },
            include: {
                lessons: {
                    orderBy: { order: 'asc' },
                    select: {
                        id: true,
                        title: true,
                        titleAr: true,
                        titleDe: true,
                        description: true,
                        descriptionAr: true,
                        duration: true,
                        order: true,
                        seasonNumber: true,
                        episodeNumber: true,
                        videoUrl: true,
                    },
                },
                creator: {
                    select: {
                        id: true,
                        userId: true,
                        expertise: true,
                        user: {
                            select: { id: true, name: true, arabicName: true, bio: true, profileImage: true },
                        },
                    },
                },
            },
        })

        if (!course || course.status !== 'PUBLISHED' || course.isHidden) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 })
        }

        const viewerId = session?.user?.id
        const isCreator = !!viewerId && course.creator.userId === viewerId
        const [enrollment, access] = viewerId && !isCreator
            ? await Promise.all([
                prisma.enrollment.findUnique({
                    where: { userId_courseId: { userId: viewerId, courseId: id } },
                    select: { id: true },
                }),
                checkCourseAccess(viewerId, id),
            ])
            : [null, null]
        const canPlay = isCreator || (!!enrollment && !!access?.hasAccess)
        const { creator, lessons, ...publicCourse } = course

        return NextResponse.json({
            ...presentCourse(publicCourse),
            creator: {
                id: creator.id,
                expertise: creator.expertise,
                user: creator.user,
            },
            lessons: lessons.map(lesson => ({ ...lesson, videoUrl: canPlay ? lesson.videoUrl : null })),
            canPlay,
            canEnroll: isCreator || !!access?.hasAccess,
            enrolled: !!enrollment,
            currency: 'EGP',
        }, { headers: { 'Cache-Control': 'private, no-store' } })
    } catch (error) {
        console.error('Course fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 })
    }
}
