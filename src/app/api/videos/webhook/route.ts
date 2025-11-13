import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MuxVideoService } from '@/lib/mux';
import { headers } from 'next/headers';

/**
 * Handle Mux webhook events
 * POST /api/videos/webhook
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const headersList = await headers();

        // Verify webhook signature
        const signature = headersList.get('mux-signature');
        const timestamp = headersList.get('mux-timestamp');

        if (!signature || !timestamp) {
            console.error('Missing Mux webhook signature or timestamp');
            return NextResponse.json(
                { error: 'Missing webhook signature' },
                { status: 400 }
            );
        }

        // Verify the webhook signature for security
        const isValid = MuxVideoService.verifyWebhookSignature(body, signature, timestamp);

        if (!isValid) {
            console.error('Invalid Mux webhook signature');
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            );
        }

        const event = JSON.parse(body);

        console.log('Mux webhook event:', event.type, event.data?.id);

        switch (event.type) {
            case 'video.asset.created':
                await handleAssetCreated(event.data);
                break;

            case 'video.asset.ready':
                await handleAssetReady(event.data);
                break;

            case 'video.asset.errored':
                await handleAssetErrored(event.data);
                break;

            case 'video.upload.asset_created':
                await handleUploadAssetCreated(event.data);
                break;

            case 'video.upload.cancelled':
            case 'video.upload.errored':
                await handleUploadErrored(event.data);
                break;

            default:
                console.log('Unhandled Mux webhook event:', event.type);
        }

        return NextResponse.json({ received: true });

    } catch (error) {
        console.error('Mux webhook processing failed:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}

async function handleAssetCreated(assetData: any) {
    try {
        const { id: muxAssetId, passthrough } = assetData;

        if (passthrough) {
            const metadata = JSON.parse(passthrough);

            // Find video asset by metadata
            const videoAsset = await prisma.videoAsset.findFirst({
                where: {
                    OR: [
                        { muxAssetId },
                        {
                            AND: [
                                { creatorId: metadata.creatorId },
                                { title: metadata.title },
                                { status: 'UPLOADING' },
                            ],
                        },
                    ],
                },
            });

            if (videoAsset) {
                await prisma.videoAsset.update({
                    where: { id: videoAsset.id },
                    data: {
                        muxAssetId,
                        status: 'PROCESSING',
                    },
                });
            }
        }
    } catch (error) {
        console.error('Failed to handle asset created:', error);
    }
}

async function handleAssetReady(assetData: any) {
    try {
        const { id: muxAssetId, playback_ids, duration, aspect_ratio, max_stored_resolution, max_stored_frame_rate } = assetData;

        const videoAsset = await prisma.videoAsset.findFirst({
            where: { muxAssetId },
        });

        if (videoAsset) {
            const playbackId = playback_ids?.[0]?.id;
            const thumbnailUrl = playbackId ?
                `https://image.mux.com/${playbackId}/thumbnail.jpg?time=5&width=640&height=360&fit_mode=crop` :
                null;

            await prisma.videoAsset.update({
                where: { id: videoAsset.id },
                data: {
                    status: 'READY',
                    muxPlaybackId: playbackId,
                    duration,
                    aspectRatio: aspect_ratio,
                    maxResolution: max_stored_resolution,
                    frameRate: max_stored_frame_rate,
                    thumbnailUrl,
                    metadata: {
                        ...videoAsset.metadata as object,
                        processedAt: new Date().toISOString(),
                        playbackIds: playback_ids,
                    },
                },
            });

            // Update lesson video URL if this is for a lesson
            if (videoAsset.lessonId && playbackId) {
                await prisma.lesson.update({
                    where: { id: videoAsset.lessonId },
                    data: {
                        videoUrl: `https://stream.mux.com/${playbackId}.m3u8`,
                        duration: Math.round(duration || 0),
                    },
                });
            }
        }
    } catch (error) {
        console.error('Failed to handle asset ready:', error);
    }
}

async function handleAssetErrored(assetData: any) {
    try {
        const { id: muxAssetId, errors } = assetData;

        const videoAsset = await prisma.videoAsset.findFirst({
            where: { muxAssetId },
        });

        if (videoAsset) {
            await prisma.videoAsset.update({
                where: { id: videoAsset.id },
                data: {
                    status: 'ERROR',
                    errors: {
                        muxErrors: errors,
                        erroredAt: new Date().toISOString(),
                    },
                },
            });
        }
    } catch (error) {
        console.error('Failed to handle asset error:', error);
    }
}

async function handleUploadAssetCreated(uploadData: any) {
    try {
        const { id: uploadId, asset_id } = uploadData;

        const videoAsset = await prisma.videoAsset.findFirst({
            where: { uploadId },
        });

        if (videoAsset) {
            await prisma.videoAsset.update({
                where: { id: videoAsset.id },
                data: {
                    muxAssetId: asset_id,
                    status: 'PROCESSING',
                },
            });
        }
    } catch (error) {
        console.error('Failed to handle upload asset created:', error);
    }
}

async function handleUploadErrored(uploadData: any) {
    try {
        const { id: uploadId, error } = uploadData;

        const videoAsset = await prisma.videoAsset.findFirst({
            where: { uploadId },
        });

        if (videoAsset) {
            await prisma.videoAsset.update({
                where: { id: videoAsset.id },
                data: {
                    status: 'ERROR',
                    errors: {
                        uploadError: error,
                        erroredAt: new Date().toISOString(),
                    },
                },
            });
        }
    } catch (error) {
        console.error('Failed to handle upload error:', error);
    }
}
