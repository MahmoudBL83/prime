import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile } from 'fs/promises'
import { join } from 'path'

/**
 * GET /api/creator/courses/[id]/lessons
 * Get all lessons for a course
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id: courseId } = await params

        // Get creator profile
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json(
                { error: 'Creator profile not found' },
                { status: 404 }
            )
        }

        // Verify course belongs to creator
        const course = await prisma.course.findUnique({
            where: { id: courseId }
        })

        if (!course) {
            return NextResponse.json(
                { error: 'Course not found' },
                { status: 404 }
            )
        }

        if (course.creatorId !== creator.id) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            )
        }

        // Get all lessons for the course
        const lessons = await prisma.lesson.findMany({
            where: { courseId },
            orderBy: { order: 'asc' }
        })

        return NextResponse.json({
            success: true,
            lessons
        })

    } catch (error) {
        console.error('Failed to fetch lessons:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/creator/courses/[id]/lessons
 * Create a new lesson
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id: courseId } = await params

        // Get creator profile
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json(
                { error: 'Creator profile not found' },
                { status: 404 }
            )
        }

        // Verify course belongs to creator
        const course = await prisma.course.findUnique({
            where: { id: courseId }
        })

        if (!course) {
            return NextResponse.json(
                { error: 'Course not found' },
                { status: 404 }
            )
        }

        if (course.creatorId !== creator.id) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            )
        }

        const formData = await request.formData()
        const title = formData.get('title') as string
        const titleAr = formData.get('titleAr') as string
        const description = formData.get('description') as string
        const descriptionAr = formData.get('descriptionAr') as string
        const video = formData.get('video') as File | null
        const duration = parseInt(formData.get('duration') as string || '0')
        const seasonNumber = formData.get('seasonNumber') ? parseInt(formData.get('seasonNumber') as string) : null
        const episodeNumber = formData.get('episodeNumber') ? parseInt(formData.get('episodeNumber') as string) : null

        // Validation
        if (!title || !video) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Handle video upload
        let videoUrl: string = ''
        if (video) {
            const bytes = await video.arrayBuffer()
            const buffer = Buffer.from(bytes)
            
            const timestamp = Date.now()
            const filename = `${timestamp}-${video.name.replace(/\s/g, '-')}`
            const uploadDir = join(process.cwd(), 'public', 'uploads', 'videos', 'lessons')
            const filepath = join(uploadDir, filename)
            
            try {
                const { mkdir } = await import('fs/promises')
                // Ensure directory exists
                await mkdir(uploadDir, { recursive: true })
                await writeFile(filepath, buffer)
                videoUrl = `/uploads/videos/lessons/${filename}`
            } catch (error) {
                console.error('Failed to save video:', error)
                return NextResponse.json(
                    { error: 'Failed to upload video' },
                    { status: 500 }
                )
            }
        }

        if (!videoUrl) {
            return NextResponse.json(
                { error: 'Video upload failed' },
                { status: 500 }
            )
        }

        // Get the next order number
        const lastLesson = await prisma.lesson.findFirst({
            where: { courseId },
            orderBy: { order: 'desc' }
        })

        const order = lastLesson ? lastLesson.order + 1 : 1

        // Create lesson
        const lesson = await prisma.lesson.create({
            data: {
                courseId,
                title,
                titleAr: titleAr || null,
                description: description || null,
                descriptionAr: descriptionAr || null,
                videoUrl,
                duration: duration || 0,
                order,
                seasonNumber: seasonNumber || null,
                episodeNumber: episodeNumber || null
            }
        })

        return NextResponse.json({
            success: true,
            lesson,
            message: 'Lesson created successfully'
        }, { status: 201 })

    } catch (error) {
        console.error('Failed to create lesson:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
