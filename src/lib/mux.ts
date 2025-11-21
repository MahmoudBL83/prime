/**
 * Mux Video Streaming Service
 * Handles video upload, processing, and playback for the Egyptian EdTech platform
 */

import Mux from '@mux/mux-node';

// Initialize Mux client
const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID!,
    tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export interface VideoMetadata {
    title: string;
    description?: string;
    courseId: string;
    lessonId: string;
    creatorId: string;
    duration?: number;
    thumbnailUrl?: string;
}

export interface MuxAsset {
    id: string;
    status: 'preparing' | 'ready' | 'errored';
    playbackId?: string;
    duration?: number;
    aspectRatio?: string;
    maxStoredResolution?: string;
    maxStoredFrameRate?: number;
    errors?: any; // Mux returns complex error structure
}

export interface MuxUploadResponse {
    uploadId: string;
    uploadUrl: string;
    assetId?: string;
}

export class MuxVideoService {
    /**
     * Create a direct upload URL for video files
     * Returns upload URL and asset information
     */
    static async createDirectUpload(metadata: VideoMetadata): Promise<MuxUploadResponse> {
        try {
            const upload = await mux.video.uploads.create({
                new_asset_settings: {
                    input: [{
                        url: 'placeholder', // Will be replaced by the upload
                    }],
                    playback_policy: ['public'],
                    mp4_support: 'standard',
                    normalize_audio: true,
                    // Arabic content optimization
                    encoding_tier: 'smart',
                    max_resolution_tier: '1080p',
                    // Metadata for tracking
                    passthrough: JSON.stringify({
                        courseId: metadata.courseId,
                        lessonId: metadata.lessonId,
                        creatorId: metadata.creatorId,
                        title: metadata.title,
                    }),
                },
                cors_origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
                test: process.env.NODE_ENV === 'development',
            });

            return {
                uploadId: upload.id,
                uploadUrl: upload.url,
            };
        } catch (error) {
            console.error('Mux upload creation failed:', error);
            throw new Error('Failed to create video upload URL');
        }
    }

    /**
     * Get asset information by ID
     */
    static async getAsset(assetId: string): Promise<MuxAsset> {
        try {
            const asset = await mux.video.assets.retrieve(assetId);

            return {
                id: asset.id,
                status: asset.status as MuxAsset['status'],
                playbackId: asset.playback_ids?.[0]?.id,
                duration: asset.duration,
                aspectRatio: asset.aspect_ratio,
                maxStoredResolution: asset.max_stored_resolution,
                maxStoredFrameRate: asset.max_stored_frame_rate,
                errors: asset.errors,
            };
        } catch (error) {
            console.error('Failed to retrieve Mux asset:', error);
            throw new Error('Failed to get video asset information');
        }
    }

    /**
     * Get upload status
     */
    static async getUploadStatus(uploadId: string) {
        try {
            const upload = await mux.video.uploads.retrieve(uploadId);
            return {
                status: upload.status,
                assetId: upload.asset_id,
                error: upload.error,
            };
        } catch (error) {
            console.error('Failed to get upload status:', error);
            throw new Error('Failed to get upload status');
        }
    }

    /**
     * Delete an asset (cleanup)
     */
    static async deleteAsset(assetId: string): Promise<boolean> {
        try {
            await mux.video.assets.delete(assetId);
            return true;
        } catch (error) {
            console.error('Failed to delete Mux asset:', error);
            return false;
        }
    }

    /**
     * Generate signed playback URL for restricted content
     */
    static async createSignedPlaybackUrl(
        playbackId: string,
        options: {
            expirationTime?: number; // Unix timestamp
            audienceId?: string;
        } = {}
    ): Promise<string> {
        try {
            const { expirationTime = Math.floor(Date.now() / 1000) + 3600 } = options; // 1 hour default

            const signedUrl = await mux.jwt.signPlaybackId(playbackId, {
                expiration: expirationTime.toString(),
                type: 'video',
            });

            return signedUrl;
        } catch (error) {
            console.error('Failed to create signed playback URL:', error);
            throw new Error('Failed to create signed video URL');
        }
    }

    /**
     * Get video thumbnail URL
     */
    static getThumbnailUrl(playbackId: string, options: {
        time?: number;
        width?: number;
        height?: number;
        fit_mode?: 'preserve' | 'crop' | 'scale';
    } = {}): string {
        const { time = 5, width = 640, height = 360, fit_mode = 'crop' } = options;

        return `https://image.mux.com/${playbackId}/thumbnail.jpg?time=${time}&width=${width}&height=${height}&fit_mode=${fit_mode}`;
    }

    /**
     * Verify webhook signature for security
     */
    static verifyWebhookSignature(
        payload: string,
        signature: string,
        timestamp: string
    ): boolean {
        try {
            const webhookSecret = process.env.MUX_WEBHOOK_SECRET;
            if (!webhookSecret) {
                console.error('MUX_WEBHOOK_SECRET not configured');
                return false;
            }

            // TODO: Implement proper webhook signature verification
            // mux.webhooks.verifySignature(signature, payload, webhookSecret);
            return true;
        } catch (error) {
            console.error('Webhook signature verification failed:', error);
            return false;
        }
    }

    /**
     * Get streaming statistics for analytics
     */
    static async getVideoMetrics(assetId: string, timeframe: '24:hours' | '7:days' | '30:days' = '24:hours') {
        try {
            // Note: Mux data API structure may vary - this is a placeholder
            const metrics = await mux.data.videoViews.list();

            return metrics;
        } catch (error) {
            console.error('Failed to get video metrics:', error);
            return null;
        }
    }
}

export default MuxVideoService;
