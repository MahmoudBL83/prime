import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

// POST - Handle bulk upload of lessons/videos
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
            return NextResponse.json(
                { error: 'Creator profile not found' },
                { status: 404 }
            )
        }

        const formData = await request.formData()
        const courseId = formData.get('courseId') as string
        const files = formData.getAll('files') as File[]
        const metadata = formData.get('metadata') as string

        if (!courseId || files.length === 0) {
            return NextResponse.json(
                { error: 'Course ID and files are required' },
                { status: 400 }
            )
        }

        // Verify course ownership
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

        // Parse metadata if provided
        let lessonsMetadata: any[] = []
        if (metadata) {
            try {
                lessonsMetadata = JSON.parse(metadata)
            } catch (error) {
                return NextResponse.json(
                    { error: 'Invalid metadata format' },
                    { status: 400 }
                )
            }
        }

        const uploadResults = []
        const errors = []

        // Process each file
        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            const lessonMeta = lessonsMetadata[i] || {}

            try {
                // Validate file type
                const allowedTypes = [
                    'video/mp4',
                    'video/webm',
                    'video/quicktime',
                    'application/pdf',
                    'image/jpeg',
                    'image/png'
                ]

                if (!allowedTypes.includes(file.type)) {
                    errors.push({
                        filename: file.name,
                        error: `Unsupported file type: ${file.type}`
                    })
                    continue
                }

                // Generate unique filename
                const timestamp = Date.now()
                const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
                const filename = `${timestamp}_${sanitizedName}`

                // Determine upload directory based on file type
                let uploadDir = 'videos'
                if (file.type.includes('pdf')) {
                    uploadDir = 'documents'
                } else if (file.type.includes('image')) {
                    uploadDir = 'images'
                }

                const uploadPath = path.join(process.cwd(), 'public', uploadDir, 'lessons')

                // Create directory if it doesn't exist
                await mkdir(uploadPath, { recursive: true })

                // Save file
                const bytes = await file.arrayBuffer()
                const buffer = Buffer.from(bytes)
                const filepath = path.join(uploadPath, filename)
                await writeFile(filepath, buffer)

                // Determine content type
                let contentType: 'VIDEO' | 'TEXT' | 'QUIZ' | 'DOCUMENT' = 'VIDEO'
                if (file.type.includes('pdf')) {
                    contentType = 'DOCUMENT'
                } else if (file.type.includes('image')) {
                    contentType = 'TEXT'
                }

                // Get lesson order
                const maxOrder = await prisma.lesson.findFirst({
                    where: { courseId },
                    orderBy: { order: 'desc' },
                    select: { order: true }
                })

                const order = (maxOrder?.order || 0) + i + 1

                // Create lesson
                const lesson = await prisma.lesson.create({
                    data: {
                        courseId,
                        title: lessonMeta.title || file.name.replace(/\.[^/.]+$/, ''),
                        titleAr: lessonMeta.titleAr || null,
                        description: lessonMeta.description || null,
                        descriptionAr: lessonMeta.descriptionAr || null,
                        contentType,
                        videoUrl: contentType === 'VIDEO' ? `/${uploadDir}/lessons/${filename}` : null,
                        documentUrl: contentType === 'DOCUMENT' ? `/${uploadDir}/lessons/${filename}` : null,
                        duration: lessonMeta.duration || 0,
                        order,
                        isFree: lessonMeta.isFree || false
                    }
                })

                uploadResults.push({
                    filename: file.name,
                    lessonId: lesson.id,
                    title: lesson.title,
                    url: contentType === 'VIDEO' ? lesson.videoUrl : lesson.documentUrl,
                    success: true
                })
            } catch (error) {
                console.error(`Error processing file ${file.name}:`, error)
                errors.push({
                    filename: file.name,
                    error: error instanceof Error ? error.message : 'Unknown error'
                })
            }
        }

        return NextResponse.json({
            success: true,
            message: `Uploaded ${uploadResults.length} of ${files.length} files`,
            data: {
                uploaded: uploadResults,
                errors,
                summary: {
                    total: files.length,
                    successful: uploadResults.length,
                    failed: errors.length
                }
            }
        })
    } catch (error) {
        console.error('Error in bulk upload:', error)
        return NextResponse.json(
            { error: 'Failed to process bulk upload' },
            { status: 500 }
        )
    }
}

// GET - Get bulk upload status
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json(
                { error: 'Creator profile not found' },
                { status: 404 }
            )
        }

        const { searchParams } = new URL(request.url)
        const courseId = searchParams.get('courseId')

        if (!courseId) {
            return NextResponse.json(
                { error: 'Course ID is required' },
                { status: 400 }
            )
        }

        // Get course with lessons
        const course = await prisma.course.findFirst({
            where: {
                id: courseId,
                creatorId: creator.id
            },
            include: {
                lessons: {
                    orderBy: { order: 'asc' },
                    select: {
                        id: true,
                        title: true,
                        contentType: true,
                        duration: true,
                        order: true,
                        createdAt: true
                    }
                }
            }
        })

        if (!course) {
            return NextResponse.json(
                { error: 'Course not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: {
                course: {
                    id: course.id,
                    title: course.title,
                    totalLessons: course.lessons.length
                },
                lessons: course.lessons,
                summary: {
                    total: course.lessons.length,
                    videos: course.lessons.filter(l => l.contentType === 'VIDEO').length,
                    documents: course.lessons.filter(l => l.contentType === 'DOCUMENT').length,
                    text: course.lessons.filter(l => l.contentType === 'TEXT').length
                }
            }
        })
    } catch (error) {
        console.error('Error fetching upload status:', error)
        return NextResponse.json(
            { error: 'Failed to fetch upload status' },
            { status: 500 }
        )
    }
}
