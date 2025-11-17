import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for bulk upload
const bulkUploadSchema = z.object({
    courseId: z.string(),
    videos: z.array(z.object({
        lessonTitle: z.string(),
        lessonTitleAr: z.string().optional(),
        duration: z.number(),
        order: z.number(),
        moduleIndex: z.number(),
        file: z.object({
            name: z.string(),
            size: z.number(),
            type: z.string()
        })
    }))
})

/**
 * POST /api/creator/courses/bulk-upload
 * 
 * Handles bulk video upload for course lessons
 * Creates multiple lessons and returns upload URLs for each video
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify creator
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 })
        }

        const body = await request.json()
        const { courseId, videos } = bulkUploadSchema.parse(body)

        // Verify course ownership
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                lessons: {
                    orderBy: { order: 'asc' }
                }
            }
        })

        if (!course || course.creatorId !== creator.id) {
            return NextResponse.json({ error: 'Course not found or unauthorized' }, { status: 404 })
        }

        // Create lessons for each video
        const createdLessons = []
        
        for (const video of videos) {
            // Get the next order number for this course
            const maxOrder = course.lessons.length > 0 
                ? Math.max(...course.lessons.map(l => l.order))
                : 0

            // Create lesson directly in course
            const lesson = await prisma.lesson.create({
                data: {
                    courseId: courseId,
                    title: video.lessonTitle,
                    titleAr: video.lessonTitleAr || video.lessonTitle,
                    duration: video.duration,
                    order: video.order > 0 ? video.order : maxOrder + 1,
                    videoUrl: `placeholder_${video.file.name}` // Placeholder until upload
                }
            })

            // Generate Mux upload URL
            const uploadUrlResponse = await fetch('/api/videos/upload-lesson', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    lessonId: lesson.id,
                    fileName: video.file.name,
                    fileSize: video.file.size
                })
            })

            const uploadData = await uploadUrlResponse.json()

            createdLessons.push({
                lessonId: lesson.id,
                lessonTitle: lesson.title,
                uploadUrl: uploadData.uploadUrl,
                uploadId: uploadData.uploadId
            })
        }

        return NextResponse.json({
            success: true,
            message: `Created ${createdLessons.length} lessons`,
            lessons: createdLessons
        })

    } catch (error) {
        console.error('Bulk upload error:', error)
        
        if (error instanceof z.ZodError) {
            return NextResponse.json({
                error: 'Invalid request data',
                details: error.issues
            }, { status: 400 })
        }

        return NextResponse.json({
            error: 'Failed to process bulk upload'
        }, { status: 500 })
    }
}

/**
 * GET /api/creator/courses/bulk-upload?courseId=xxx
 * 
 * Get status of bulk upload for a course
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const courseId = searchParams.get('courseId')

        if (!courseId) {
            return NextResponse.json({ error: 'Course ID required' }, { status: 400 })
        }

        // Get all lessons for the course
        const lessons = await prisma.lesson.findMany({
            where: {
                courseId: courseId
            },
            orderBy: {
                order: 'asc'
            }
        })

        const statusSummary = {
            total: lessons.length,
            // Since we don't have status tracking, categorize by videoUrl presence
            uploaded: lessons.filter(l => l.videoUrl && !l.videoUrl.startsWith('placeholder_')).length,
            processing: 0, // Not supported without status field
            pending: lessons.filter(l => !l.videoUrl || l.videoUrl.startsWith('placeholder_')).length,
            failed: 0 // Not supported without status field
        }

        return NextResponse.json({
            success: true,
            summary: statusSummary,
            lessons: lessons.map(l => ({
                id: l.id,
                title: l.title,
                titleAr: l.titleAr,
                duration: l.duration,
                status: l.videoUrl && !l.videoUrl.startsWith('placeholder_') ? 'READY' : 'PENDING',
                videoUrl: l.videoUrl && !l.videoUrl.startsWith('placeholder_') ? l.videoUrl : null,
                order: l.order
            }))
        })

    } catch (error) {
        console.error('Get bulk upload status error:', error)
        return NextResponse.json({
            error: 'Failed to get upload status'
        }, { status: 500 })
    }
}
