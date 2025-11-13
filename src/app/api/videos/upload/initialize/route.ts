import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const {
            title,
            titleAr,
            description,
            descriptionAr,
            courseId,
            lessonId,
            fileName,
            fileSize,
            fileType
        } = body

        // Validate required fields
        if (!title || !fileName || !fileSize) {
            return NextResponse.json(
                { error: 'Missing required fields: title, fileName, fileSize' },
                { status: 400 }
            )
        }

        // Validate file type
        const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
        if (!allowedTypes.includes(fileType)) {
            return NextResponse.json(
                { error: 'Invalid file type. Allowed: MP4, WebM, OGG, MOV' },
                { status: 400 }
            )
        }

        // Validate file size (max 2GB)
        const maxSize = 2 * 1024 * 1024 * 1024 // 2GB in bytes
        if (fileSize > maxSize) {
            return NextResponse.json(
                { error: 'File size exceeds maximum allowed (2GB)' },
                { status: 400 }
            )
        }

        // Get creator ID
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id },
            select: { id: true }
        })

        if (!creator) {
            return NextResponse.json(
                { error: 'Creator profile not found' },
                { status: 404 }
            )
        }

        // If courseId provided, verify ownership
        if (courseId) {
            const course = await prisma.course.findFirst({
                where: {
                    id: courseId,
                    creatorId: creator.id
                }
            })

            if (!course) {
                return NextResponse.json(
                    { error: 'Course not found or access denied' },
                    { status: 404 }
                )
            }
        }

        // If lessonId provided, verify it belongs to the course
        if (lessonId) {
            const lesson = await prisma.lesson.findFirst({
                where: {
                    id: lessonId,
                    courseId: courseId || undefined
                }
            })

            if (!lesson) {
                return NextResponse.json(
                    { error: 'Lesson not found or does not belong to course' },
                    { status: 404 }
                )
            }
        }

        // Generate unique upload ID
        const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substring(7)}`

        // Create VideoAsset record with UPLOADING status
        const videoAsset = await prisma.videoAsset.create({
            data: {
                uploadId,
                status: 'UPLOADING',
                title,
                titleAr,
                description,
                descriptionAr,
                originalFilename: fileName,
                fileSize,
                creatorId: creator.id,
                courseId: courseId || null,
                lessonId: lessonId || null,
                metadata: {
                    fileType,
                    initiatedAt: new Date().toISOString(),
                    chunks: {
                        total: Math.ceil(fileSize / (5 * 1024 * 1024)), // 5MB chunks
                        uploaded: 0
                    }
                }
            }
        })

        // In production, generate presigned URLs for S3
        // For now, return mock upload configuration
        const chunkSize = 5 * 1024 * 1024 // 5MB chunks
        const totalChunks = Math.ceil(fileSize / chunkSize)

        return NextResponse.json({
            success: true,
            uploadId,
            videoAssetId: videoAsset.id,
            uploadConfig: {
                chunkSize,
                totalChunks,
                uploadUrl: `/api/videos/upload/chunk`, // Client will POST chunks here
                headers: {
                    'X-Upload-ID': uploadId,
                    'X-Video-Asset-ID': videoAsset.id
                }
            },
            videoAsset: {
                id: videoAsset.id,
                title: videoAsset.title,
                status: videoAsset.status,
                createdAt: videoAsset.createdAt
            }
        })
    } catch (error) {
        console.error('Error initializing video upload:', error)
        return NextResponse.json(
            { error: 'Failed to initialize upload' },
            { status: 500 }
        )
    }
}
