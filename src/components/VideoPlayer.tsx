/**
 * Professional Video Player Component
 * 
 * Features:
 * - HLS adaptive streaming
 * - Custom controls (play, pause, seek, volume, speed, quality)
 * - Progress auto-save every 5 seconds
 * - Resume from last position
 * - Picture-in-Picture mode
 * - Fullscreen support
 * - Keyboard shortcuts
 * - Loading states and buffering
 * - Mobile-optimized
 */

'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Hls from 'hls.js'
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    Minimize,
    Settings,
    PictureInPicture,
    SkipForward,
    SkipBack,
    Loader
} from 'lucide-react'

interface VideoPlayerProps {
    videoId: string
    videoUrl: string
    title?: string
    poster?: string
    autoPlay?: boolean
    onProgress?: (progress: number, currentTime: number) => void
    onComplete?: () => void
    onError?: (error: Error) => void
    className?: string
    lessonId?: string
    courseId?: string
}

export default function VideoPlayer({
    videoId,
    videoUrl,
    title,
    poster,
    autoPlay = false,
    onProgress,
    onComplete,
    onError,
    className = '',
    lessonId,
    courseId
}: VideoPlayerProps) {
    const { data: session } = useSession()
    const videoRef = useRef<HTMLVideoElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const hlsRef = useRef<Hls | null>(null)
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

    // Player state
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [buffered, setBuffered] = useState(0)
    const [volume, setVolume] = useState(1)
    const [isMuted, setIsMuted] = useState(false)
    const [playbackRate, setPlaybackRate] = useState(1)
    const [quality, setQuality] = useState<string>('auto')
    const [availableQualities, setAvailableQualities] = useState<string[]>([])
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [showControls, setShowControls] = useState(true)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [lastSavedProgress, setLastSavedProgress] = useState(0)

    // Initialize HLS or native video
    useEffect(() => {
        const video = videoRef.current
        if (!video || !videoUrl) return

        // Check if HLS is supported
        if (videoUrl.includes('.m3u8')) {
            if (Hls.isSupported()) {
                const hls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: false,
                    backBufferLength: 90
                })

                hlsRef.current = hls
                hls.loadSource(videoUrl)
                hls.attachMedia(video)

                hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
                    setIsLoading(false)
                    
                    // Get available quality levels
                    const qualities = data.levels.map((level: any) => {
                        return `${level.height}p`
                    })
                    setAvailableQualities(['auto', ...qualities])

                    if (autoPlay) {
                        video.play().catch(e => console.error('Autoplay failed:', e))
                    }
                })

                hls.on(Hls.Events.ERROR, (_event, data) => {
                    if (data.fatal) {
                        setError('Failed to load video')
                        setIsLoading(false)
                        onError?.(new Error(data.type))
                    }
                })

                return () => {
                    hls.destroy()
                }
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                // Native HLS support (Safari)
                video.src = videoUrl
                setIsLoading(false)
            } else {
                setError('HLS not supported')
                setIsLoading(false)
            }
        } else {
            // Regular video file
            video.src = videoUrl
            setIsLoading(false)
        }
    }, [videoUrl, autoPlay, onError])

    // Load saved progress
    useEffect(() => {
        const loadProgress = async () => {
            if (!session?.user || !videoId) return

            try {
                const response = await fetch(`/api/videos/${videoId}/progress`)
                if (response.ok) {
                    const data = await response.json()
                    if (data.lastPosition && videoRef.current) {
                        videoRef.current.currentTime = data.lastPosition
                        setCurrentTime(data.lastPosition)
                    }
                }
            } catch (error) {
                console.error('Failed to load progress:', error)
            }
        }

        loadProgress()
    }, [session, videoId])

    // Auto-save progress every 5 seconds
    useEffect(() => {
        if (!session?.user || !videoId || !isPlaying) return

        progressIntervalRef.current = setInterval(() => {
            saveProgress()
        }, 5000)

        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current)
            }
        }
    }, [session, videoId, isPlaying, currentTime, duration])

    const saveProgress = async () => {
        if (!session?.user || !videoId || duration === 0) return

        const progress = (currentTime / duration) * 100

        // Only save if progress changed significantly (>1%)
        if (Math.abs(progress - lastSavedProgress) < 1) return

        try {
            await fetch(`/api/videos/${videoId}/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lastPosition: currentTime,
                    progress,
                    duration,
                    lessonId,
                    courseId
                })
            })

            setLastSavedProgress(progress)
            onProgress?.(progress, currentTime)

            // Mark as complete if watched >95%
            if (progress >= 95) {
                onComplete?.()
            }
        } catch (error) {
            console.error('Failed to save progress:', error)
        }
    }

    // Video event handlers
    const handleTimeUpdate = () => {
        const video = videoRef.current
        if (!video) return

        setCurrentTime(video.currentTime)
        setDuration(video.duration)

        // Update buffered progress
        if (video.buffered.length > 0) {
            const bufferedEnd = video.buffered.end(video.buffered.length - 1)
            setBuffered((bufferedEnd / video.duration) * 100)
        }
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    
    const handleLoadedMetadata = () => {
        setIsLoading(false)
        if (videoRef.current) {
            setDuration(videoRef.current.duration)
        }
    }

    const handleWaiting = () => setIsLoading(true)
    const handleCanPlay = () => setIsLoading(false)

    // Control handlers
    const togglePlay = () => {
        const video = videoRef.current
        if (!video) return

        if (isPlaying) {
            video.pause()
        } else {
            video.play()
        }
    }

    const handleSeek = (time: number) => {
        const video = videoRef.current
        if (!video) return

        video.currentTime = time
        setCurrentTime(time)
    }

    const handleVolumeChange = (newVolume: number) => {
        const video = videoRef.current
        if (!video) return

        video.volume = newVolume
        setVolume(newVolume)
        setIsMuted(newVolume === 0)
    }

    const toggleMute = () => {
        const video = videoRef.current
        if (!video) return

        if (isMuted) {
            video.volume = volume || 0.5
            setIsMuted(false)
        } else {
            video.volume = 0
            setIsMuted(true)
        }
    }

    const changePlaybackRate = (rate: number) => {
        const video = videoRef.current
        if (!video) return

        video.playbackRate = rate
        setPlaybackRate(rate)
    }

    const changeQuality = (qualityLevel: string) => {
        const hls = hlsRef.current
        if (!hls) return

        if (qualityLevel === 'auto') {
            hls.currentLevel = -1 // Auto quality
        } else {
            const levelIndex = hls.levels.findIndex((level: any) => {
                return `${level.height}p` === qualityLevel
            })
            if (levelIndex !== -1) {
                hls.currentLevel = levelIndex
            }
        }

        setQuality(qualityLevel)
    }

    const skip = (seconds: number) => {
        const video = videoRef.current
        if (!video) return

        video.currentTime = Math.max(0, Math.min(duration, currentTime + seconds))
    }

    const toggleFullscreen = () => {
        const container = containerRef.current
        if (!container) return

        if (!document.fullscreenElement) {
            container.requestFullscreen()
            setIsFullscreen(true)
        } else {
            document.exitFullscreen()
            setIsFullscreen(false)
        }
    }

    const togglePictureInPicture = async () => {
        const video = videoRef.current
        if (!video || !document.pictureInPictureEnabled) return

        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture()
            } else {
                await video.requestPictureInPicture()
            }
        } catch (error) {
            console.error('PiP error:', error)
        }
    }

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return
            }

            switch (e.key.toLowerCase()) {
                case ' ':
                case 'k':
                    e.preventDefault()
                    togglePlay()
                    break
                case 'f':
                    e.preventDefault()
                    toggleFullscreen()
                    break
                case 'm':
                    e.preventDefault()
                    toggleMute()
                    break
                case 'arrowleft':
                    e.preventDefault()
                    skip(-10)
                    break
                case 'arrowright':
                    e.preventDefault()
                    skip(10)
                    break
                case 'j':
                    e.preventDefault()
                    skip(-10)
                    break
                case 'l':
                    e.preventDefault()
                    skip(10)
                    break
            }
        }

        window.addEventListener('keydown', handleKeyPress)
        return () => window.removeEventListener('keydown', handleKeyPress)
    }, [isPlaying, currentTime, duration])

    // Format time display
    const formatTime = (seconds: number) => {
        if (isNaN(seconds)) return '0:00'
        
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = Math.floor(seconds % 60)

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div
            ref={containerRef}
            className={`relative bg-background rounded-lg overflow-hidden group ${className}`}
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
            onMouseMove={() => setShowControls(true)}
        >
            {/* Video Element */}
            <video
                ref={videoRef}
                className="w-full h-full"
                poster={poster}
                playsInline
                onTimeUpdate={handleTimeUpdate}
                onPlay={handlePlay}
                onPause={handlePause}
                onLoadedMetadata={handleLoadedMetadata}
                onWaiting={handleWaiting}
                onCanPlay={handleCanPlay}
                onError={(e) => {
                    setError('Failed to load video')
                    onError?.(new Error('Video load error'))
                }}
            />

            {/* Loading Spinner */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                    <Loader className="w-12 h-12 text-foreground animate-spin" />
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                    <div className="text-center">
                        <p className="text-red-400 text-lg mb-2">⚠️ {error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="text-foreground bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
                        >
                            Reload
                        </button>
                    </div>
                </div>
            )}

            {/* Custom Controls */}
            {showControls && !error && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 transition-opacity duration-300">
                    {/* Progress Bar */}
                    <div className="mb-3">
                        <div className="relative h-1 bg-gray-700 rounded-full cursor-pointer group/progress"
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect()
                                const percent = (e.clientX - rect.left) / rect.width
                                handleSeek(percent * duration)
                            }}
                        >
                            {/* Buffered */}
                            <div
                                className="absolute h-full bg-gray-600 rounded-full"
                                style={{ width: `${buffered}%` }}
                            />
                            {/* Progress */}
                            <div
                                className="absolute h-full bg-red-600 rounded-full"
                                style={{ width: `${(currentTime / duration) * 100}%` }}
                            />
                            {/* Hover indicator */}
                            <div className="absolute inset-0 h-full group-hover/progress:h-2 transition-all rounded-full" />
                        </div>
                    </div>

                    {/* Controls Row */}
                    <div className="flex items-center justify-between text-foreground">
                        <div className="flex items-center gap-2">
                            {/* Skip Back */}
                            <button
                                onClick={() => skip(-10)}
                                className="p-2 hover:bg-white/10 rounded-full transition"
                                title="Skip back 10s (J)"
                            >
                                <SkipBack className="w-5 h-5" />
                            </button>

                            {/* Play/Pause */}
                            <button
                                onClick={togglePlay}
                                className="p-3 hover:bg-white/10 rounded-full transition"
                                title="Play/Pause (Space)"
                            >
                                {isPlaying ? (
                                    <Pause className="w-6 h-6" fill="white" />
                                ) : (
                                    <Play className="w-6 h-6" fill="white" />
                                )}
                            </button>

                            {/* Skip Forward */}
                            <button
                                onClick={() => skip(10)}
                                className="p-2 hover:bg-white/10 rounded-full transition"
                                title="Skip forward 10s (L)"
                            >
                                <SkipForward className="w-5 h-5" />
                            </button>

                            {/* Volume */}
                            <div className="flex items-center gap-2 group/volume">
                                <button
                                    onClick={toggleMute}
                                    className="p-2 hover:bg-white/10 rounded-full transition"
                                    title="Mute (M)"
                                >
                                    {isMuted || volume === 0 ? (
                                        <VolumeX className="w-5 h-5" />
                                    ) : (
                                        <Volume2 className="w-5 h-5" />
                                    )}
                                </button>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={isMuted ? 0 : volume}
                                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                                    className="w-0 group-hover/volume:w-20 transition-all"
                                />
                            </div>

                            {/* Time */}
                            <span className="text-sm">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Playback Speed */}
                            <select
                                value={playbackRate}
                                onChange={(e) => changePlaybackRate(parseFloat(e.target.value))}
                                className="bg-white/10 hover:bg-white/20 rounded px-2 py-1 text-sm cursor-pointer"
                            >
                                <option value="0.5">0.5x</option>
                                <option value="0.75">0.75x</option>
                                <option value="1">1x</option>
                                <option value="1.25">1.25x</option>
                                <option value="1.5">1.5x</option>
                                <option value="2">2x</option>
                            </select>

                            {/* Quality */}
                            {availableQualities.length > 0 && (
                                <select
                                    value={quality}
                                    onChange={(e) => changeQuality(e.target.value)}
                                    className="bg-white/10 hover:bg-white/20 rounded px-2 py-1 text-sm cursor-pointer"
                                >
                                    {availableQualities.map(q => (
                                        <option key={q} value={q}>{q}</option>
                                    ))}
                                </select>
                            )}

                            {/* Picture-in-Picture */}
                            {document.pictureInPictureEnabled && (
                                <button
                                    onClick={togglePictureInPicture}
                                    className="p-2 hover:bg-white/10 rounded-full transition"
                                    title="Picture-in-Picture"
                                >
                                    <PictureInPicture className="w-5 h-5" />
                                </button>
                            )}

                            {/* Fullscreen */}
                            <button
                                onClick={toggleFullscreen}
                                className="p-2 hover:bg-white/10 rounded-full transition"
                                title="Fullscreen (F)"
                            >
                                {isFullscreen ? (
                                    <Minimize className="w-5 h-5" />
                                ) : (
                                    <Maximize className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Center Play Button (when paused) */}
            {!isPlaying && !isLoading && !error && (
                <button
                    onClick={togglePlay}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-md p-6 rounded-full transition"
                >
                    <Play className="w-12 h-12 text-foreground" fill="white" />
                </button>
            )}
        </div>
    )
}
