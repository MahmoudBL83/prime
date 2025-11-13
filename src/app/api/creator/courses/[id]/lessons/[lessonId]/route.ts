import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile } from 'fs/promises'
import { join } from 'path'

/**
 * PATCH /api/creator/courses/[id]/lessons/[lessonId]
 * Update a lesson
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id: courseId, lessonId } = await params

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

        // Verify lesson belongs to course
        const existingLesson = await prisma.lesson.findUnique({
            where: { id: lessonId }
        })

        if (!existingLesson || existingLesson.courseId !== courseId) {
            return NextResponse.json(
                { error: 'Lesson not found' },
                { status: 404 }
            )
        }

        const formData = await request.formData()
        const title = formData.get('title') as string
        const titleAr = formData.get('titleAr') as string
        const description = formData.get('description') as string
        const descriptionAr = formData.get('descriptionAr') as string
        const video = formData.get('video') as File | null
        const duration = formData.get('duration') ? parseInt(formData.get('duration') as string) : undefined
        const seasonNumber = formData.get('seasonNumber') ? parseInt(formData.get('seasonNumber') as string) : null
        const episodeNumber = formData.get('episodeNumber') ? parseInt(formData.get('episodeNumber') as string) : null

        // Handle video upload if new video provided
        let videoUrl = existingLesson.videoUrl
        if (video && video.size > 0) {
            const bytes = await video.arrayBuffer()
            const buffer = Buffer.from(bytes)
            
            const timestamp = Date.now()
            const filename = `${timestamp}-${video.name.replace(/\s/g, '-')}`
            const uploadDir = join(process.cwd(), 'public', 'uploads', 'videos', 'lessons')
            const filepath = join(uploadDir, filename)
            
            try {
                const { mkdir } = await import('fs/promises')
                await mkdir(uploadDir, { recursive: true })
                await writeFile(filepath, buffer)
                videoUrl = `/uploads/videos/lessons/${filename}`
            } catch (error) {
                console.error('Failed to save video:', error)
            }
        }

        // Update lesson
        const updatedLesson = await prisma.lesson.update({
            where: { id: lessonId },
            data: {
                ...(title && { title }),
                ...(titleAr !== undefined && { titleAr: titleAr || null }),
                ...(description !== undefined && { description: description || null }),
                ...(descriptionAr !== undefined && { descriptionAr: descriptionAr || null }),
                ...(videoUrl && { videoUrl }),
                ...(duration !== undefined && { duration }),
                ...(seasonNumber !== undefined && { seasonNumber: seasonNumber || null }),
                ...(episodeNumber !== undefined && { episodeNumber: episodeNumber || null })
            }
        })

        return NextResponse.json({
            success: true,
            lesson: updatedLesson,
            message: 'Lesson updated successfully'
        })

    } catch (error) {
        console.error('Failed to update lesson:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/creator/courses/[id]/lessons/[lessonId]
 * Delete a lesson
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id: courseId, lessonId } = await params

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

        // Verify lesson belongs to course
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId }
        })

        if (!lesson || lesson.courseId !== courseId) {
            return NextResponse.json(
                { error: 'Lesson not found' },
                { status: 404 }
            )
        }

        // Delete the lesson
        await prisma.lesson.delete({
            where: { id: lessonId }
        })

        // Reorder remaining lessons
        const remainingLessons = await prisma.lesson.findMany({
            where: { courseId },
            orderBy: { order: 'asc' }
        })

        // Update order numbers
        for (let i = 0; i < remainingLessons.length; i++) {
            await prisma.lesson.update({
                where: { id: remainingLessons[i].id },
                data: { order: i + 1 }
            })
        }

        return NextResponse.json({
            success: true,
            message: 'Lesson deleted successfully'
        })

    } catch (error) {
        console.error('Failed to delete lesson:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
