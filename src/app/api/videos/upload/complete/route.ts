import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { readFile, writeFile, unlink, readdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { uploadId, videoAssetId } = body

        if (!uploadId || !videoAssetId) {
            return NextResponse.json(
                { error: 'Missing required fields: uploadId, videoAssetId' },
                { status: 400 }
            )
        }

        // Verify video asset
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

        const videoAsset = await prisma.videoAsset.findFirst({
            where: {
                id: videoAssetId,
                uploadId: uploadId,
                creatorId: creator.id,
                status: 'UPLOADING'
            }
        })

        if (!videoAsset) {
            return NextResponse.json(
                { error: 'Video asset not found or upload not in progress' },
                { status: 404 }
            )
        }

        const metadata = videoAsset.metadata as any || {}
        const chunks = metadata.chunks || {}

        // Verify all chunks are uploaded
        if (chunks.uploaded < chunks.total) {
            return NextResponse.json(
                { 
                    error: 'Not all chunks uploaded',
                    uploaded: chunks.uploaded,
                    total: chunks.total
                },
                { status: 400 }
            )
        }

        // Combine chunks into final video file
        const uploadDir = path.join(process.cwd(), 'uploads', 'videos', 'temp', uploadId)
        const finalVideoDir = path.join(process.cwd(), 'uploads', 'videos', videoAssetId)
        const finalVideoPath = path.join(finalVideoDir, `${videoAssetId}.mp4`)

        if (!existsSync(finalVideoDir)) {
            await mkdir(finalVideoDir, { recursive: true })
        }

        // Read all chunks and combine
        const chunkFiles = await readdir(uploadDir)
        const sortedChunks = chunkFiles
            .filter(f => f.startsWith('chunk_'))
            .sort((a, b) => {
                const aNum = parseInt(a.split('_')[1])
                const bNum = parseInt(b.split('_')[1])
                return aNum - bNum
            })

        // Combine chunks
        const chunks_data = []
        for (const chunkFile of sortedChunks) {
            const chunkPath = path.join(uploadDir, chunkFile)
            const chunkData = await readFile(chunkPath)
            chunks_data.push(chunkData)
        }

        const finalBuffer = Buffer.concat(chunks_data)
        await writeFile(finalVideoPath, finalBuffer)

        // Clean up temp chunks
        for (const chunkFile of sortedChunks) {
            const chunkPath = path.join(uploadDir, chunkFile)
            await unlink(chunkPath)
        }

        // Generate mock thumbnail (in production, use FFmpeg)
        const thumbnailUrl = `/uploads/videos/${videoAssetId}/thumbnail.jpg`

        // Update video asset status to PROCESSING
        const updatedAsset = await prisma.videoAsset.update({
            where: { id: videoAssetId },
            data: {
                status: 'PROCESSING',
                thumbnailUrl,
                metadata: {
                    ...metadata,
                    uploadCompleted: new Date().toISOString(),
                    filePath: finalVideoPath,
                    processingStarted: new Date().toISOString()
                }
            }
        })

        // TODO: Trigger actual video processing
        // - Extract duration, resolution, frame rate
        // - Generate thumbnail
        // - Create HLS variants (360p, 480p, 720p, 1080p)
        // - Update status to READY when done

        // For now, simulate processing and mark as READY
        setTimeout(async () => {
            try {
                await prisma.videoAsset.update({
                    where: { id: videoAssetId },
                    data: {
                        status: 'READY',
                        duration: 300, // Mock 5 minutes
                        aspectRatio: '16:9',
                        maxResolution: '1080p',
                        frameRate: 30,
                        metadata: {
                            ...metadata,
                            processingCompleted: new Date().toISOString()
                        }
                    }
                })

                // Create default quality variant
                await prisma.videoQuality.create({
                    data: {
                        videoAssetId,
                        quality: '1080p',
                        resolution: '1920x1080',
                        bitrate: 5000,
                        url: `/uploads/videos/${videoAssetId}/${videoAssetId}.mp4`,
                        codec: 'h264'
                    }
                })

                console.log(`Video ${videoAssetId} processing completed`)
            } catch (error) {
                console.error('Error completing video processing:', error)
            }
        }, 5000) // Simulate 5 second processing

        return NextResponse.json({
            success: true,
            message: 'Upload completed, processing started',
            videoAsset: {
                id: updatedAsset.id,
                title: updatedAsset.title,
                status: updatedAsset.status,
                thumbnailUrl: updatedAsset.thumbnailUrl
            }
        })
    } catch (error) {
        console.error('Error completing upload:', error)
        return NextResponse.json(
            { error: 'Failed to complete upload' },
            { status: 500 }
        )
    }
}

async function mkdir(dirPath: string, options: { recursive: boolean }) {
    const { mkdir: mkdirOriginal } = await import('fs/promises')
    return mkdirOriginal(dirPath, options)
}
