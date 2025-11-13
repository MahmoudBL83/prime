import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import fs from 'fs/promises'
import path from 'path'

interface Params {
    params: Promise<{
        videoId: string
    }>
}

export async function POST(request: Request, { params }: Params) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { videoId } = await params

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

        // Verify video ownership
        const videoAsset = await prisma.videoAsset.findFirst({
            where: {
                id: videoId,
                creatorId: creator.id
            }
        })

        if (!videoAsset) {
            return NextResponse.json(
                { error: 'Video not found or access denied' },
                { status: 404 }
            )
        }

        const formData = await request.formData()
        const file = formData.get('thumbnail') as File
        const generateFromFrame = formData.get('generateFromFrame') === 'true'
        const frameTimestamp = formData.get('timestamp') as string

        // Option 1: Generate thumbnail from video frame
        if (generateFromFrame) {
            // TODO: Use FFmpeg to extract frame at specified timestamp
            // ffmpeg -i video.mp4 -ss {timestamp} -vframes 1 -q:v 2 thumbnail.jpg
            
            const mockThumbnailUrl = `/uploads/videos/${videoId}/thumbnail_generated.jpg`
            
            await prisma.videoAsset.update({
                where: { id: videoId },
                data: { thumbnailUrl: mockThumbnailUrl }
            })

            return NextResponse.json({
                success: true,
                message: 'Thumbnail generated from video frame',
                thumbnailUrl: mockThumbnailUrl,
                note: 'This is a mock implementation. Real FFmpeg processing needed.'
            })
        }

        // Option 2: Upload custom thumbnail
        if (!file) {
            return NextResponse.json(
                { error: 'No thumbnail file provided' },
                { status: 400 }
            )
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if (!validTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed' },
                { status: 400 }
            )
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 5MB' },
                { status: 400 }
            )
        }

        // Create upload directory
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'videos', videoId)
        await fs.mkdir(uploadDir, { recursive: true })

        // Get file extension
        const ext = file.name.split('.').pop() || 'jpg'
        const filename = `thumbnail_${Date.now()}.${ext}`
        const filePath = path.join(uploadDir, filename)

        // Save file
        const buffer = Buffer.from(await file.arrayBuffer())
        await fs.writeFile(filePath, buffer)

        // Update video asset with new thumbnail URL
        const thumbnailUrl = `/uploads/videos/${videoId}/${filename}`
        
        await prisma.videoAsset.update({
            where: { id: videoId },
            data: { thumbnailUrl }
        })

        // TODO: In production:
        // 1. Resize/optimize image (Sharp library)
        // 2. Upload to cloud storage (S3/Cloudinary)
        // 3. Generate multiple sizes (small, medium, large)
        // 4. Delete old thumbnail if exists

        return NextResponse.json({
            success: true,
            message: 'Thumbnail uploaded successfully',
            thumbnailUrl,
            fileSize: file.size,
            dimensions: {
                note: 'In production, use Sharp to get actual dimensions and resize'
            }
        })
    } catch (error) {
        console.error('Error uploading thumbnail:', error)
        return NextResponse.json(
            { error: 'Failed to upload thumbnail' },
            { status: 500 }
        )
    }
}

export async function DELETE(request: Request, { params }: Params) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { videoId } = await params

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

        // Verify video ownership
        const videoAsset = await prisma.videoAsset.findFirst({
            where: {
                id: videoId,
                creatorId: creator.id
            }
        })

        if (!videoAsset) {
            return NextResponse.json(
                { error: 'Video not found or access denied' },
                { status: 404 }
            )
        }

        // Remove thumbnail URL from database
        await prisma.videoAsset.update({
            where: { id: videoId },
            data: { thumbnailUrl: null }
        })

        // TODO: Delete actual file from storage if it exists

        return NextResponse.json({
            success: true,
            message: 'Thumbnail removed successfully'
        })
    } catch (error) {
        console.error('Error removing thumbnail:', error)
        return NextResponse.json(
            { error: 'Failed to remove thumbnail' },
            { status: 500 }
        )
    }
}

// Config to allow larger file uploads
export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb'
        }
    }
}
