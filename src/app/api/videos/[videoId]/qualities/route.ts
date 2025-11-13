import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface Params {
    params: Promise<{
        videoId: string
    }>
}

export async function GET(request: Request, { params }: Params) {
    try {
        const { videoId } = await params

        // Get all quality variants for this video
        const qualities = await prisma.videoQuality.findMany({
            where: { videoAssetId: videoId },
            select: {
                id: true,
                quality: true,
                resolution: true,
                bitrate: true,
                fileSize: true,
                url: true,
                codec: true,
                createdAt: true
            },
            orderBy: {
                bitrate: 'desc'
            }
        })

        return NextResponse.json({
            qualities,
            count: qualities.length
        })
    } catch (error) {
        console.error('Error fetching video qualities:', error)
        return NextResponse.json(
            { error: 'Failed to fetch qualities' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request, { params }: Params) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { videoId } = await params
        const body = await request.json()

        const {
            quality,
            resolution,
            bitrate,
            fileSize,
            url,
            codec
        } = body

        // Validate required fields
        if (!quality || !resolution || !bitrate || !url) {
            return NextResponse.json(
                { error: 'Missing required fields: quality, resolution, bitrate, url' },
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

        // Check if quality already exists
        const existingQuality = await prisma.videoQuality.findUnique({
            where: {
                videoAssetId_quality: {
                    videoAssetId: videoId,
                    quality
                }
            }
        })

        if (existingQuality) {
            return NextResponse.json(
                { error: `Quality variant ${quality} already exists` },
                { status: 400 }
            )
        }

        // Create quality variant
        const qualityVariant = await prisma.videoQuality.create({
            data: {
                videoAssetId: videoId,
                quality,
                resolution,
                bitrate,
                fileSize,
                url,
                codec: codec || 'h264'
            }
        })

        // Update video's max resolution if this is higher
        const qualityOrder = ['360p', '480p', '720p', '1080p', '1440p', '4k']
        const currentMaxIndex = qualityOrder.indexOf(videoAsset.maxResolution || '720p')
        const newQualityIndex = qualityOrder.indexOf(quality)

        if (newQualityIndex > currentMaxIndex) {
            await prisma.videoAsset.update({
                where: { id: videoId },
                data: { maxResolution: quality }
            })
        }

        return NextResponse.json({
            success: true,
            message: 'Quality variant added successfully',
            quality: qualityVariant
        })
    } catch (error) {
        console.error('Error adding quality variant:', error)
        return NextResponse.json(
            { error: 'Failed to add quality variant' },
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
        const { searchParams } = new URL(request.url)
        const qualityId = searchParams.get('qualityId')

        if (!qualityId) {
            return NextResponse.json(
                { error: 'Missing qualityId parameter' },
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

        // Check if this is the only quality
        const qualityCount = await prisma.videoQuality.count({
            where: { videoAssetId: videoId }
        })

        if (qualityCount <= 1) {
            return NextResponse.json(
                { error: 'Cannot delete the only quality variant' },
                { status: 400 }
            )
        }

        // Delete quality
        await prisma.videoQuality.delete({
            where: { id: qualityId }
        })

        // TODO: Delete actual video file from storage

        return NextResponse.json({
            success: true,
            message: 'Quality variant deleted successfully'
        })
    } catch (error) {
        console.error('Error deleting quality variant:', error)
        return NextResponse.json(
            { error: 'Failed to delete quality variant' },
            { status: 500 }
        )
    }
}
