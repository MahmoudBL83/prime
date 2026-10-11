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
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const course = await prisma.course.findUnique({
            where: { id },
            select: {
                id: true,
                title: true,
                titleAr: true,
                description: true,
                descriptionAr: true,
                thumbnail: true,
                status: true,
                isHidden: true,
                creator: { select: { userId: true } },
                lessons: { orderBy: { order: 'asc' } },
            },
        })

        if (!course || course.status !== 'PUBLISHED' || course.isHidden) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 })
        }

        const isCreator = course.creator.userId === session.user.id
        const [enrollment, access] = await Promise.all([
            prisma.enrollment.findUnique({
                where: { userId_courseId: { userId: session.user.id, courseId: id } },
                select: { progress: true, completedLessons: true },
            }),
            isCreator ? Promise.resolve({ hasAccess: true }) : checkCourseAccess(session.user.id, id),
        ])

        if (!isCreator && (!enrollment || !access.hasAccess)) {
            return NextResponse.json({ error: 'Active course access required' }, { status: 403 })
        }

        let completedLessons: string[] = []
        try {
            const parsed = JSON.parse(enrollment?.completedLessons || '[]')
            if (Array.isArray(parsed)) completedLessons = parsed.filter((value): value is string => typeof value === 'string')
        } catch {
            // An old or damaged progress value must not prevent the course from loading.
        }

        const presented = presentCourse(course)
        const lessons = course.lessons.map(lesson => ({
            id: lesson.id,
            title: lesson.title,
            titleAr: lesson.titleAr,
            description: lesson.description,
            descriptionAr: lesson.descriptionAr,
            order: lesson.order,
            duration: lesson.duration,
            type: 'video',
            videoUrl: lesson.videoUrl,
            isCompleted: completedLessons.includes(lesson.id),
            moduleId: course.id,
            objectives: [],
            resources: parseResources(lesson.resources),
            transcript: lesson.transcript,
            transcriptAr: lesson.transcriptAr,
        }))

        return NextResponse.json({
            course: {
                id: course.id,
                title: presented.title,
                titleAr: presented.titleAr,
                description: presented.description,
                descriptionAr: presented.descriptionAr,
                thumbnail: presented.thumbnail,
                totalDuration: course.lessons.reduce((total, lesson) => total + lesson.duration, 0),
                totalLessons: lessons.length,
                progress: enrollment?.progress || 0,
                modules: [{
                    id: course.id,
                    title: presented.title,
                    titleAr: presented.titleAr,
                    description: presented.description,
                    descriptionAr: presented.descriptionAr,
                    order: 0,
                    lessons,
                }],
            },
        }, { headers: { 'Cache-Control': 'private, no-store' } })
    } catch (error) {
        console.error('Error fetching course for learning:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

function parseResources(value: unknown): unknown[] {
    try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}
