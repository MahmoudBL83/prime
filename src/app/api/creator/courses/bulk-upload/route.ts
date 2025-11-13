import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
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
                sections: {
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
            // Find or create section
            let section = course.sections[video.moduleIndex]
            
            if (!section) {
                section = await prisma.section.create({
                    data: {
                        courseId: courseId,
                        title: `Module ${video.moduleIndex + 1}`,
                        titleAr: `الوحدة ${video.moduleIndex + 1}`,
                        order: video.moduleIndex
                    }
                })
            }

            // Create lesson
            const lesson = await prisma.lesson.create({
                data: {
                    sectionId: section.id,
                    title: video.lessonTitle,
                    titleAr: video.lessonTitleAr || video.lessonTitle,
                    duration: video.duration,
                    order: video.order,
                    videoUrl: '', // Will be updated after upload
                    status: 'PENDING_UPLOAD'
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
                details: error.errors
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

        // Get all lessons with upload status
        const lessons = await prisma.lesson.findMany({
            where: {
                section: {
                    courseId: courseId
                }
            },
            include: {
                section: {
                    select: {
                        title: true,
                        titleAr: true
                    }
                }
            },
            orderBy: [
                { section: { order: 'asc' } },
                { order: 'asc' }
            ]
        })

        const statusSummary = {
            total: lessons.length,
            uploaded: lessons.filter(l => l.status === 'READY').length,
            processing: lessons.filter(l => l.status === 'PROCESSING').length,
            pending: lessons.filter(l => l.status === 'PENDING_UPLOAD').length,
            failed: lessons.filter(l => l.status === 'FAILED').length
        }

        return NextResponse.json({
            success: true,
            summary: statusSummary,
            lessons: lessons.map(l => ({
                id: l.id,
                title: l.title,
                titleAr: l.titleAr,
                duration: l.duration,
                status: l.status,
                videoUrl: l.videoUrl,
                sectionTitle: l.section.title
            }))
        })

    } catch (error) {
        console.error('Get bulk upload status error:', error)
        return NextResponse.json({
            error: 'Failed to get upload status'
        }, { status: 500 })
    }
}
