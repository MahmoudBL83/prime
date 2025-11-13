import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MuxVideoService } from '@/lib/mux'
import { z } from 'zod'

const uploadVideoSchema = z.object({
    lessonId: z.string().min(1, 'Lesson ID is required'),
    courseId: z.string().min(1, 'Course ID is required'),
    title: z.string().min(1, 'Video title is required'),
    titleAr: z.string().min(1, 'Arabic video title is required'),
    description: z.string().optional(),
})

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get creator profile
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json({
                error: 'Creator profile not found'
            }, { status: 403 })
        }

        const body = await req.json()
        const validation = uploadVideoSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json({
                error: 'Invalid input data',
                details: validation.error.issues
            }, { status: 400 })
        }

        const { lessonId, courseId, title, titleAr, description } = validation.data

        // Verify creator owns this course
        const course = await prisma.course.findFirst({
            where: {
                id: courseId,
                creatorId: creator.id
            },
            include: {
                lessons: {
                    where: { id: lessonId }
                }
            }
        })

        if (!course) {
            return NextResponse.json({
                error: 'Course not found or access denied'
            }, { status: 404 })
        }

        if (course.lessons.length === 0) {
            return NextResponse.json({
                error: 'Lesson not found'
            }, { status: 404 })
        }

        const lesson = course.lessons[0]

        // Create Mux upload URL
        const uploadResponse = await MuxVideoService.createDirectUpload({
            title,
            description: description || lesson.description || '',
            courseId,
            lessonId,
            creatorId: creator.id
        })

        // Create video asset record
        const videoAsset = await prisma.videoAsset.create({
            data: {
                muxAssetId: uploadResponse.assetId || '',
                uploadId: uploadResponse.uploadId,
                status: 'UPLOADING',
                title,
                titleAr,
                description: description || lesson.description || '',
                originalFilename: '',
                creatorId: creator.id,
                courseId,
                lessonId
            }
        })

        // Update lesson with video asset reference
        await prisma.lesson.update({
            where: { id: lessonId },
            data: {
                videoUrl: `mux://${uploadResponse.uploadId}` // Temporary reference
            }
        })

        return NextResponse.json({
            success: true,
            uploadUrl: uploadResponse.uploadUrl,
            uploadId: uploadResponse.uploadId,
            videoAssetId: videoAsset.id,
            message: 'Upload URL created successfully. You can now upload your video file.'
        })

    } catch (error) {
        console.error('Video upload creation error:', error)
        return NextResponse.json({
            error: 'Failed to create upload URL'
        }, { status: 500 })
    }
}

// Get upload status
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        const { searchParams } = new URL(req.url)
        const uploadId = searchParams.get('uploadId')
        const videoAssetId = searchParams.get('videoAssetId')

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json({
                error: 'Creator profile not found'
            }, { status: 403 })
        }

        if (uploadId) {
            // Get upload status from Mux
            try {
                const uploadStatus = await MuxVideoService.getUploadStatus(uploadId)
                return NextResponse.json({
                    status: uploadStatus.status,
                    assetId: uploadStatus.assetId
                })
            } catch (error) {
                return NextResponse.json({
                    error: 'Failed to get upload status'
                }, { status: 500 })
            }
        }

        if (videoAssetId) {
            // Get video asset processing status
            const videoAsset = await prisma.videoAsset.findFirst({
                where: {
                    id: videoAssetId,
                    creatorId: creator.id
                }
            })

            if (!videoAsset) {
                return NextResponse.json({
                    error: 'Video asset not found'
                }, { status: 404 })
            }

            return NextResponse.json({
                status: videoAsset.status,
                playbackId: videoAsset.muxPlaybackId,
                duration: videoAsset.duration,
                aspectRatio: videoAsset.aspectRatio
            })
        }

        return NextResponse.json({
            error: 'Upload ID or Video Asset ID required'
        }, { status: 400 })

    } catch (error) {
        console.error('Upload status error:', error)
        return NextResponse.json({
            error: 'Failed to get upload status'
        }, { status: 500 })
    }
}
