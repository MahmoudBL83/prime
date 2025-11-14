import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get headers
        const uploadId = request.headers.get('X-Upload-ID')
        const videoAssetId = request.headers.get('X-Video-Asset-ID')
        const chunkIndex = request.headers.get('X-Chunk-Index')
        const totalChunks = request.headers.get('X-Total-Chunks')

        if (!uploadId || !videoAssetId || chunkIndex === null || !totalChunks) {
            return NextResponse.json(
                { error: 'Missing required headers' },
                { status: 400 }
            )
        }

        const chunkNum = parseInt(chunkIndex)
        const totalChunksNum = parseInt(totalChunks)

        // Verify video asset exists and belongs to user
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

        // Get chunk data
        const formData = await request.formData()
        const chunk = formData.get('chunk') as File

        if (!chunk) {
            return NextResponse.json(
                { error: 'No chunk data provided' },
                { status: 400 }
            )
        }

        // Create upload directory if it doesn't exist
        const uploadDir = path.join(process.cwd(), 'uploads', 'videos', 'temp', uploadId)
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true })
        }

        // Save chunk to disk
        const chunkPath = path.join(uploadDir, `chunk_${chunkNum}`)
        const buffer = Buffer.from(await chunk.arrayBuffer())
        await writeFile(chunkPath, buffer)

        // Update metadata
        const currentMetadata = videoAsset.metadata as any || {}
        const chunks = currentMetadata.chunks || { total: totalChunksNum, uploaded: 0 }
        chunks.uploaded = chunkNum + 1

        await prisma.videoAsset.update({
            where: { id: videoAssetId },
            data: {
                metadata: {
                    ...currentMetadata,
                    chunks,
                    lastChunkAt: new Date().toISOString()
                }
            }
        })

        // Calculate progress
        const progress = Math.round((chunks.uploaded / totalChunksNum) * 100)

        return NextResponse.json({
            success: true,
            chunkIndex: chunkNum,
            totalChunks: totalChunksNum,
            progress,
            uploaded: chunks.uploaded,
            message: `Chunk ${chunkNum + 1}/${totalChunksNum} uploaded`
        })
    } catch (error) {
        console.error('Error uploading chunk:', error)
        return NextResponse.json(
            { error: 'Failed to upload chunk' },
            { status: 500 }
        )
    }
}

// Increase body size limit for chunks
export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb'
        }
    }
}
