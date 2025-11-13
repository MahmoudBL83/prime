/**
 * Video utility functions and constants for the Egyptian EdTech platform
 */

export const VIDEO_CONSTANTS = {
    // Supported formats for uploads
    SUPPORTED_FORMATS: [
        'video/mp4',
        'video/quicktime',
        'video/x-msvideo', // AVI
        'video/webm',
        'video/x-ms-wmv',
        'video/x-flv',
    ],

    // Maximum file size (500MB for free tier consideration)
    MAX_FILE_SIZE: 500 * 1024 * 1024,

    // Video quality presets optimized for Egyptian internet conditions
    QUALITY_PRESETS: {
        auto: 'auto',
        low: '360p',
        medium: '480p',
        high: '720p',
        hd: '1080p',
    },

    // Default player settings
    DEFAULT_PLAYER_CONFIG: {
        autoplay: false,
        muted: false,
        loop: false,
        controls: true,
        responsive: true,
        fluid: true,
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
    },

    // Arabic-specific settings
    ARABIC_PLAYER_CONFIG: {
        language: 'ar',
        textDirection: 'rtl',
        keyboardShortcuts: {
            // Arabic keyboard shortcuts
            space: 'togglePlay',
            arrowLeft: 'seekBackward',
            arrowRight: 'seekForward',
            arrowUp: 'volumeUp',
            arrowDown: 'volumeDown',
        },
    },
};

export interface VideoProgress {
    videoId: string;
    userId: string;
    currentTime: number;
    duration: number;
    completed: boolean;
    lastWatched: Date;
}

export interface VideoQuality {
    label: string;
    value: string;
    bitrate?: number;
    resolution?: string;
}

/**
 * Format video duration from seconds to readable time
 */
export function formatDuration(seconds: number): string {
    if (!seconds || seconds < 0) return '00:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculate video progress percentage
 */
export function calculateProgress(currentTime: number, duration: number): number {
    if (!duration || duration <= 0) return 0;
    return Math.min(100, Math.max(0, (currentTime / duration) * 100));
}

/**
 * Determine if video is considered "completed"
 * Using 85% threshold to account for credits/end screens
 */
export function isVideoCompleted(currentTime: number, duration: number): boolean {
    if (!duration || duration <= 0) return false;
    return calculateProgress(currentTime, duration) >= 85;
}

/**
 * Generate video thumbnail URL with optimizations for Egyptian market
 */
export function getOptimizedThumbnail(
    playbackId: string,
    options: {
        width?: number;
        height?: number;
        quality?: 'low' | 'medium' | 'high';
        time?: number;
    } = {}
): string {
    const { width = 640, height = 360, quality = 'medium', time = 5 } = options;

    // Optimize for slower connections
    const qualityMap = {
        low: { w: 320, h: 180 },
        medium: { w: 640, h: 360 },
        high: { w: 1280, h: 720 },
    };

    const { w, h } = qualityMap[quality];

    return `https://image.mux.com/${playbackId}/thumbnail.jpg?time=${time}&width=${w}&height=${h}&fit_mode=crop`;
}

/**
 * Get appropriate video quality based on connection speed
 */
export function getRecommendedQuality(connectionSpeed?: string): string {
    // Fallback to auto if no connection info
    if (!connectionSpeed) return VIDEO_CONSTANTS.QUALITY_PRESETS.auto;

    // Simple heuristic for Egyptian market conditions
    const speed = connectionSpeed.toLowerCase();

    if (speed.includes('slow-2g') || speed.includes('2g')) {
        return VIDEO_CONSTANTS.QUALITY_PRESETS.low;
    }

    if (speed.includes('3g')) {
        return VIDEO_CONSTANTS.QUALITY_PRESETS.medium;
    }

    if (speed.includes('4g') || speed.includes('wifi')) {
        return VIDEO_CONSTANTS.QUALITY_PRESETS.high;
    }

    return VIDEO_CONSTANTS.QUALITY_PRESETS.auto;
}

/**
 * Validate video file before upload
 */
export function validateVideoFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (!VIDEO_CONSTANTS.SUPPORTED_FORMATS.includes(file.type)) {
        return {
            valid: false,
            error: `نوع الملف غير مدعوم. الأنواع المدعومة: ${VIDEO_CONSTANTS.SUPPORTED_FORMATS.join(', ')}`,
        };
    }

    // Check file size
    if (file.size > VIDEO_CONSTANTS.MAX_FILE_SIZE) {
        const maxSizeMB = VIDEO_CONSTANTS.MAX_FILE_SIZE / (1024 * 1024);
        return {
            valid: false,
            error: `حجم الملف كبير جداً. الحد الأقصى ${maxSizeMB}MB`,
        };
    }

    return { valid: true };
}

/**
 * Extract video metadata from file
 */
export function extractVideoMetadata(file: File): Promise<{
    duration?: number;
    width?: number;
    height?: number;
    size: number;
    type: string;
}> {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';

        video.onloadedmetadata = () => {
            resolve({
                duration: video.duration,
                width: video.videoWidth,
                height: video.videoHeight,
                size: file.size,
                type: file.type,
            });
        };

        video.onerror = () => {
            resolve({
                size: file.size,
                type: file.type,
            });
        };

        video.src = URL.createObjectURL(file);
    });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    if (bytes === 0) return '0 بايت';

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = (bytes / Math.pow(1024, i)).toFixed(1);

    return `${size} ${sizes[i]}`;
}

export default {
    VIDEO_CONSTANTS,
    formatDuration,
    calculateProgress,
    isVideoCompleted,
    getOptimizedThumbnail,
    getRecommendedQuality,
    validateVideoFile,
    extractVideoMetadata,
    formatFileSize,
};
