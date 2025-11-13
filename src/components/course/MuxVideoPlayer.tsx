/**
 * Mux Video Player Component for Egyptian EdTech Platform
 * Advanced video player with Mux integration and Egyptian market optimizations
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import MuxPlayer from '@mux/mux-player-react';
import { useSession } from 'next-auth/react';
import { useHotkeys } from 'react-hotkeys-hook';
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    Settings,
    Maximize,
    Minimize,
    SkipBack,
    SkipForward,
    RotateCcw,
    Loader2,
    AlertCircle
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider
} from '@/components/ui/tooltip';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { formatDuration, calculateProgress, isVideoCompleted } from '@/lib/video-utils';
import { cn } from '@/lib/utils';

interface MuxVideoPlayerProps {
    playbackId: string;
    title: string;
    titleAr?: string;
    videoAssetId: string;
    courseId?: string;
    lessonId?: string;
    autoplay?: boolean;
    startTime?: number;
    onProgress?: (progress: VideoProgress) => void;
    onComplete?: () => void;
    onError?: (error: string) => void;
    className?: string;
}

interface VideoProgress {
    currentTime: number;
    duration: number;
    progress: number;
    completed: boolean;
}

interface PlayerState {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    isMuted: boolean;
    isFullscreen: boolean;
    isLoading: boolean;
    error: string | null;
    quality: string;
    playbackRate: number;
    buffered: number;
}

const QUALITY_OPTIONS = [
    { label: 'تلقائي', value: 'auto' },
    { label: '360p', value: '360p' },
    { label: '480p', value: '480p' },
    { label: '720p', value: '720p' },
    { label: '1080p', value: '1080p' },
];

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function MuxVideoPlayer({
    playbackId,
    title,
    titleAr,
    videoAssetId,
    courseId,
    lessonId,
    autoplay = false,
    startTime = 0,
    onProgress,
    onComplete,
    onError,
    className
}: MuxVideoPlayerProps) {
    const { data: session } = useSession();
    const playerRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const progressSaveInterval = useRef<NodeJS.Timeout | null>(null);
    const lastProgressUpdate = useRef<number>(0);

    const [playerState, setPlayerState] = useState<PlayerState>({
        isPlaying: false,
        currentTime: startTime,
        duration: 0,
        volume: 1,
        isMuted: false,
        isFullscreen: false,
        isLoading: true,
        error: null,
        quality: 'auto',
        playbackRate: 1,
        buffered: 0,
    });

    const [showControls, setShowControls] = useState(true);
    const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);

    // Auto-hide controls after 3 seconds of inactivity
    const resetControlsTimeout = useCallback(() => {
        if (controlsTimeout) clearTimeout(controlsTimeout);
        setShowControls(true);

        if (playerState.isPlaying) {
            const timeout = setTimeout(() => setShowControls(false), 3000);
            setControlsTimeout(timeout);
        }
    }, [controlsTimeout, playerState.isPlaying]);

    // Keyboard shortcuts (Arabic support)
    useHotkeys('space', (e) => {
        e.preventDefault();
        handlePlayPause();
    });

    useHotkeys('ArrowLeft', () => handleSeek(-10));
    useHotkeys('ArrowRight', () => handleSeek(10));
    useHotkeys('ArrowUp', () => handleVolumeChange(Math.min(1, playerState.volume + 0.1)));
    useHotkeys('ArrowDown', () => handleVolumeChange(Math.max(0, playerState.volume - 0.1)));
    useHotkeys('m', () => handleMute());
    useHotkeys('f', () => handleFullscreen());

    // Save progress to backend
    const saveProgress = useCallback(async (currentTime: number, duration: number) => {
        if (!session?.user?.id || !duration) return;

        const progress = calculateProgress(currentTime, duration);
        const completed = isVideoCompleted(currentTime, duration);

        try {
            await fetch('/api/videos/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    videoAssetId,
                    currentTime,
                    duration,
                    progress,
                    completed,
                    courseId,
                    lessonId,
                }),
            });

            // Call external progress callback
            onProgress?.({
                currentTime,
                duration,
                progress,
                completed,
            });

            // Call completion callback if video completed
            if (completed && !lastProgressUpdate.current) {
                onComplete?.();
            }

            lastProgressUpdate.current = progress;
        } catch (error) {
            console.error('Failed to save video progress:', error);
        }
    }, [session, videoAssetId, courseId, lessonId, onProgress, onComplete]);

    // Track analytics events
    const trackEvent = useCallback(async (event: string, data?: any) => {
        if (!session?.user?.id) return;

        try {
            await fetch('/api/videos/analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    videoAssetId,
                    event,
                    currentTime: playerState.currentTime,
                    duration: playerState.duration,
                    quality: playerState.quality,
                    playbackRate: playerState.playbackRate,
                    volume: playerState.volume,
                    ...data,
                }),
            });
        } catch (error) {
            console.error('Failed to track video event:', error);
        }
    }, [session, videoAssetId, playerState]);

    // Player event handlers
    const handlePlayPause = useCallback(() => {
        const player = playerRef.current;
        if (!player) return;

        if (playerState.isPlaying) {
            player.pause();
            trackEvent('pause');
        } else {
            player.play();
            trackEvent('play');
        }
    }, [playerState.isPlaying, trackEvent]);

    const handleSeek = useCallback((seconds: number) => {
        const player = playerRef.current;
        if (!player) return;

        const newTime = Math.max(0, Math.min(playerState.duration, playerState.currentTime + seconds));
        player.currentTime = newTime;
        trackEvent('seek', { from: playerState.currentTime, to: newTime });
    }, [playerState.currentTime, playerState.duration, trackEvent]);

    const handleVolumeChange = useCallback((newVolume: number) => {
        const player = playerRef.current;
        if (!player) return;

        player.volume = newVolume;
        setPlayerState(prev => ({ ...prev, volume: newVolume, isMuted: newVolume === 0 }));
    }, []);

    const handleMute = useCallback(() => {
        const player = playerRef.current;
        if (!player) return;

        const newMuted = !playerState.isMuted;
        player.muted = newMuted;
        setPlayerState(prev => ({ ...prev, isMuted: newMuted }));
    }, [playerState.isMuted]);

    const handleFullscreen = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;

        if (!document.fullscreenElement) {
            container.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }, []);

    const handleQualityChange = useCallback((quality: string) => {
        setPlayerState(prev => ({ ...prev, quality }));
        trackEvent('quality_change', { quality });
    }, [trackEvent]);

    const handlePlaybackRateChange = useCallback((rate: number) => {
        const player = playerRef.current;
        if (!player) return;

        player.playbackRate = rate;
        setPlayerState(prev => ({ ...prev, playbackRate: rate }));
        trackEvent('playback_rate_change', { rate });
    }, [trackEvent]);

    // Set up progress saving interval
    useEffect(() => {
        if (playerState.isPlaying) {
            progressSaveInterval.current = setInterval(() => {
                saveProgress(playerState.currentTime, playerState.duration);
            }, 5000); // Save every 5 seconds
        } else if (progressSaveInterval.current) {
            clearInterval(progressSaveInterval.current);
        }

        return () => {
            if (progressSaveInterval.current) {
                clearInterval(progressSaveInterval.current);
            }
        };
    }, [playerState.isPlaying, playerState.currentTime, playerState.duration, saveProgress]);

    // Mouse movement handler for control visibility
    useEffect(() => {
        const handleMouseMove = () => resetControlsTimeout();
        const container = containerRef.current;

        if (container) {
            container.addEventListener('mousemove', handleMouseMove);
            return () => container.removeEventListener('mousemove', handleMouseMove);
        }
    }, [resetControlsTimeout]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (controlsTimeout) clearTimeout(controlsTimeout);
            if (progressSaveInterval.current) clearInterval(progressSaveInterval.current);
        };
    }, [controlsTimeout]);

    const progressPercentage = playerState.duration ?
        (playerState.currentTime / playerState.duration) * 100 : 0;

    const bufferedPercentage = playerState.duration ?
        (playerState.buffered / playerState.duration) * 100 : 0;

    if (playerState.error) {
        return (
            <div className={cn("relative w-full aspect-video bg-background rounded-lg flex items-center justify-center", className)}>
                <div className="text-center text-foreground p-6">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                    <h3 className="text-lg font-semibold mb-2">خطأ في تشغيل الفيديو</h3>
                    <p className="text-muted-foreground mb-4">{playerState.error}</p>
                    <Button
                        onClick={() => window.location.reload()}
                        variant="outline"
                        className="text-foreground border-white hover:bg-background hover:text-foreground"
                    >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        إعادة المحاولة
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div
                ref={containerRef}
                className={cn("relative w-full aspect-video bg-background rounded-lg overflow-hidden group", className)}
                onMouseEnter={() => setShowControls(true)}
                onMouseLeave={resetControlsTimeout}
            >
                {/* Mux Player */}
                <MuxPlayer
                    ref={playerRef}
                    playbackId={playbackId}
                    autoPlay={autoplay}
                    startTime={startTime}
                    className="w-full h-full"
                    onPlay={() => {
                        setPlayerState(prev => ({ ...prev, isPlaying: true, isLoading: false }));
                        trackEvent('play');
                        resetControlsTimeout();
                    }}
                    onPause={() => {
                        setPlayerState(prev => ({ ...prev, isPlaying: false }));
                        trackEvent('pause');
                    }}
                    onTimeUpdate={(e: any) => {
                        const currentTime = e.target.currentTime;
                        const duration = e.target.duration;
                        const buffered = e.target.buffered.length > 0 ? e.target.buffered.end(0) : 0;

                        setPlayerState(prev => ({
                            ...prev,
                            currentTime,
                            duration: duration || prev.duration,
                            buffered
                        }));
                    }}
                    onLoadedMetadata={(e: any) => {
                        setPlayerState(prev => ({
                            ...prev,
                            duration: e.target.duration,
                            isLoading: false
                        }));
                    }}
                    onWaiting={() => {
                        setPlayerState(prev => ({ ...prev, isLoading: true }));
                    }}
                    onCanPlay={() => {
                        setPlayerState(prev => ({ ...prev, isLoading: false }));
                    }}
                    onError={(e: any) => {
                        const errorMessage = 'فشل في تحميل الفيديو. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.';
                        setPlayerState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
                        onError?.(errorMessage);
                    }}
                    onEnded={() => {
                        trackEvent('complete');
                        saveProgress(playerState.duration, playerState.duration);
                        onComplete?.();
                    }}
                    onVolumeChange={(e: any) => {
                        setPlayerState(prev => ({
                            ...prev,
                            volume: e.target.volume,
                            isMuted: e.target.muted
                        }));
                    }}
                />

                {/* Loading Overlay */}
                {playerState.isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background bg-opacity-50 z-10">
                        <Loader2 className="w-8 h-8 text-foreground animate-spin" />
                    </div>
                )}

                {/* Custom Controls Overlay */}
                <div
                    className={cn(
                        "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 z-20",
                        showControls ? "opacity-100" : "opacity-0 pointer-events-none"
                    )}
                >
                    {/* Center Play/Pause Button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Button
                            size="lg"
                            variant="ghost"
                            onClick={handlePlayPause}
                            className="w-16 h-16 rounded-full bg-background/50 hover:bg-background/70 text-foreground border-2 border-white/30"
                        >
                            {playerState.isPlaying ?
                                <Pause className="w-8 h-8" /> :
                                <Play className="w-8 h-8 ml-1" />
                            }
                        </Button>
                    </div>

                    {/* Bottom Controls */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                        {/* Progress Bar */}
                        <div className="mb-4">
                            <div className="relative w-full h-2 bg-white/20 rounded-full overflow-hidden">
                                {/* Buffered Progress */}
                                <div
                                    className="absolute top-0 left-0 h-full bg-white/30 transition-all duration-200"
                                    style={{ width: `${bufferedPercentage}%` }}
                                />
                                {/* Current Progress */}
                                <div
                                    className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-200"
                                    style={{ width: `${progressPercentage}%` }}
                                />
                                {/* Interactive overlay */}
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={progressPercentage}
                                    onChange={(e) => {
                                        const player = playerRef.current;
                                        if (player && playerState.duration) {
                                            const newTime = (parseFloat(e.target.value) / 100) * playerState.duration;
                                            player.currentTime = newTime;
                                            trackEvent('seek', { from: playerState.currentTime, to: newTime });
                                        }
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Control Buttons */}
                        <div className="flex items-center justify-between text-foreground">
                            <div className="flex items-center space-x-4 rtl:space-x-reverse">
                                {/* Play/Pause */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button size="sm" variant="ghost" onClick={handlePlayPause}>
                                            {playerState.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{playerState.isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}</p>
                                    </TooltipContent>
                                </Tooltip>

                                {/* Skip Backward */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button size="sm" variant="ghost" onClick={() => handleSeek(-10)}>
                                            <SkipBack className="w-5 h-5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>الرجوع 10 ثواني</p>
                                    </TooltipContent>
                                </Tooltip>

                                {/* Skip Forward */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button size="sm" variant="ghost" onClick={() => handleSeek(10)}>
                                            <SkipForward className="w-5 h-5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>التقدم 10 ثواني</p>
                                    </TooltipContent>
                                </Tooltip>

                                {/* Volume */}
                                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button size="sm" variant="ghost" onClick={handleMute}>
                                                {playerState.isMuted || playerState.volume === 0 ?
                                                    <VolumeX className="w-5 h-5" /> :
                                                    <Volume2 className="w-5 h-5" />
                                                }
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{playerState.isMuted ? 'إلغاء الكتم' : 'كتم الصوت'}</p>
                                        </TooltipContent>
                                    </Tooltip>

                                    <div className="w-20">
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.01"
                                            value={playerState.isMuted ? 0 : playerState.volume}
                                            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                                            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                                        />
                                    </div>
                                </div>

                                {/* Time Display */}
                                <span className="text-sm font-mono">
                                    {formatDuration(playerState.currentTime)} / {formatDuration(playerState.duration)}
                                </span>
                            </div>

                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                {/* Playback Rate */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button size="sm" variant="ghost" className="text-xs">
                                            {playerState.playbackRate}x
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {PLAYBACK_RATES.map(rate => (
                                            <DropdownMenuItem
                                                key={rate}
                                                onClick={() => handlePlaybackRateChange(rate)}
                                                className={rate === playerState.playbackRate ? 'bg-accent' : ''}
                                            >
                                                {rate}x
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Quality Settings */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button size="sm" variant="ghost">
                                                    <Settings className="w-5 h-5" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>إعدادات الجودة</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {QUALITY_OPTIONS.map(option => (
                                            <DropdownMenuItem
                                                key={option.value}
                                                onClick={() => handleQualityChange(option.value)}
                                                className={option.value === playerState.quality ? 'bg-accent' : ''}
                                            >
                                                {option.label}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Fullscreen */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button size="sm" variant="ghost" onClick={handleFullscreen}>
                                            {playerState.isFullscreen ?
                                                <Minimize className="w-5 h-5" /> :
                                                <Maximize className="w-5 h-5" />
                                            }
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{playerState.isFullscreen ? 'إنهاء ملء الشاشة' : 'ملء الشاشة'}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Custom Styles for sliders */}
                <style jsx>{`
          .slider::-webkit-slider-thumb {
            appearance: none;
            width: 12px;
            height: 12px;
            background: white;
            cursor: pointer;
            border-radius: 50%;
          }
          
          .slider::-moz-range-thumb {
            width: 12px;
            height: 12px;
            background: white;
            cursor: pointer;
            border-radius: 50%;
            border: none;
          }
        `}</style>
            </div>
        </TooltipProvider>
    );
}
