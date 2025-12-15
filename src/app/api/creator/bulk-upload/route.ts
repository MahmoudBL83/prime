import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

/**
 * Bulk Upload API for Creators
 * Handles multiple file uploads for course content
 * POST /api/creator/bulk-upload
 */

interface UploadItem {
    id: string
    fileName: string
    fileSize: number
    mimeType: string
    status: 'pending' | 'processing' | 'completed' | 'failed'
    progress: number
    url?: string
    error?: string
    lessonTitle?: string
    order?: number
}

// POST: Initialize bulk upload session
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id || session.user.role !== 'CREATOR') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { courseId, files } = body

        if (!courseId || !files || !Array.isArray(files)) {
            return NextResponse.json(
                { error: 'courseId and files array are required' },
                { status: 400 }
            )
        }

        // Verify course belongs to creator
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
        }

        const course = await prisma.course.findFirst({
            where: {
                id: courseId,
                creatorId: creator.id
            },
            include: {
                lessons: { orderBy: { order: 'desc' }, take: 1 }
            }
        })

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 })
        }

        // Get current max order
        const maxOrder = course.lessons[0]?.order || 0

        // Create upload session
        const uploadSession = {
            id: randomUUID(),
            courseId,
            creatorId: creator.id,
            createdAt: new Date(),
            files: files.map((file: any, index: number) => ({
                id: randomUUID(),
                fileName: file.name,
                fileSize: file.size,
                mimeType: file.type,
                status: 'pending' as const,
                progress: 0,
                order: maxOrder + index + 1,
                lessonTitle: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
            }))
        }

        // In production, store session in Redis or database for tracking
        // For now, return the session info for client-side tracking

        return NextResponse.json({
            session: uploadSession,
            uploadUrls: uploadSession.files.map((file: UploadItem) => ({
                fileId: file.id,
                // In production, generate presigned URLs for direct upload to cloud storage
                uploadUrl: `/api/upload?sessionId=${uploadSession.id}&fileId=${file.id}`,
                method: 'POST'
            })),
            message: 'Bulk upload session created'
        }, { status: 201 })
    } catch (error) {
        console.error('Bulk upload POST error:', error)
        return NextResponse.json(
            { error: 'Failed to create bulk upload session' },
            { status: 500 }
        )
    }
}

// PUT: Process uploaded files and create lessons
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id || session.user.role !== 'CREATOR') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { sessionId, courseId, completedFiles } = body

        if (!courseId || !completedFiles || !Array.isArray(completedFiles)) {
            return NextResponse.json(
                { error: 'courseId and completedFiles are required' },
                { status: 400 }
            )
        }

        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
        }

        // Create lessons from uploaded files
        const createdLessons = []

        for (const file of completedFiles) {
            const lesson = await prisma.lesson.create({
                data: {
                    courseId,
                    title: file.lessonTitle || file.fileName.replace(/\.[^/.]+$/, ''),
                    videoUrl: file.url,
                    duration: file.duration || 0, // Duration should be extracted after processing
                    order: file.order
                }
            })
            createdLessons.push(lesson)
        }

        // Update course duration
        const totalDuration = await prisma.lesson.aggregate({
            where: { courseId },
            _sum: { duration: true }
        })

        await prisma.course.update({
            where: { id: courseId },
            data: { duration: totalDuration._sum.duration || 0 }
        })

        return NextResponse.json({
            lessons: createdLessons,
            totalCreated: createdLessons.length,
            message: `Successfully created ${createdLessons.length} lessons`
        })
    } catch (error) {
        console.error('Bulk upload PUT error:', error)
        return NextResponse.json(
            { error: 'Failed to process uploaded files' },
            { status: 500 }
        )
    }
}

// GET: Get upload session status
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id || session.user.role !== 'CREATOR') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const sessionId = searchParams.get('sessionId')

        if (!sessionId) {
            return NextResponse.json(
                { error: 'sessionId is required' },
                { status: 400 }
            )
        }

        // In production, retrieve from Redis or database
        // For now, return mock status
        return NextResponse.json({
            sessionId,
            status: 'processing',
            message: 'Upload session status retrieved'
        })
    } catch (error) {
        console.error('Bulk upload GET error:', error)
        return NextResponse.json(
            { error: 'Failed to get upload status' },
            { status: 500 }
        )
    }
}
