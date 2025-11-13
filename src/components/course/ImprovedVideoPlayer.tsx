'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    Minimize,
    Settings,
    SkipBack,
    SkipForward
} from 'lucide-react'

interface VideoSource {
    quality: string
    url: string
    label: string
}

interface VideoPlayerProps {
    videoSources: VideoSource[]
    courseId: string
    lessonId: string
    onProgressUpdate?: (progress: number, currentTime: number) => void
    onComplete?: () => void
}

export default function ImprovedVideoPlayer({
    videoSources,
    courseId,
    lessonId,
    onProgressUpdate,
    onComplete
}: VideoPlayerProps) {
    const { data: session } = useSession()
    const videoRef = useRef<HTMLVideoElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [volume, setVolume] = useState(1)
    const [isMuted, setIsMuted] = useState(false)
    const [playbackSpeed, setPlaybackSpeed] = useState(1)
    const [selectedQuality, setSelectedQuality] = useState(videoSources[0]?.quality || '')
    const [showControls, setShowControls] = useState(true)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [buffered, setBuffered] = useState(0)
    const [showSettings, setShowSettings] = useState(false)

    const currentVideoSource = videoSources.find(source => source.quality === selectedQuality) || videoSources[0]

    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        const handleLoadedMetadata = () => {
            setDuration(video.duration)
            setIsLoading(false)
        }

        const handleTimeUpdate = () => {
            setCurrentTime(video.currentTime)
            onProgressUpdate?.(video.currentTime, video.duration)
        }

        const handleProgress = () => {
            if (video.buffered.length > 0) {
                setBuffered(video.buffered.end(0))
            }
        }

        const handleEnded = () => {
            setIsPlaying(false)
            onComplete?.()
        }

        const handleLoadStart = () => setIsLoading(true)
        const handleCanPlay = () => setIsLoading(false)

        video.addEventListener('loadedmetadata', handleLoadedMetadata)
        video.addEventListener('timeupdate', handleTimeUpdate)
        video.addEventListener('progress', handleProgress)
        video.addEventListener('ended', handleEnded)
        video.addEventListener('loadstart', handleLoadStart)
        video.addEventListener('canplay', handleCanPlay)

        return () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata)
            video.removeEventListener('timeupdate', handleTimeUpdate)
            video.removeEventListener('progress', handleProgress)
            video.removeEventListener('ended', handleEnded)
            video.removeEventListener('loadstart', handleLoadStart)
            video.removeEventListener('canplay', handleCanPlay)
        }
    }, [onProgressUpdate, onComplete])

    // Auto-hide controls
    useEffect(() => {
        let timeout: NodeJS.Timeout

        const resetTimeout = () => {
            clearTimeout(timeout)
            setShowControls(true)
            timeout = setTimeout(() => {
                if (isPlaying) {
                    setShowControls(false)
                }
            }, 3000)
        }

        if (isPlaying) {
            resetTimeout()
        } else {
            setShowControls(true)
        }

        return () => clearTimeout(timeout)
    }, [isPlaying])

    const togglePlay = () => {
        const video = videoRef.current
        if (!video) return

        if (isPlaying) {
            video.pause()
        } else {
            video.play()
        }
        setIsPlaying(!isPlaying)
    }

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const video = videoRef.current
        if (!video) return

        const newTime = (parseFloat(e.target.value) / 100) * duration
        video.currentTime = newTime
        setCurrentTime(newTime)
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
            video.volume = volume
            setIsMuted(false)
        } else {
            video.volume = 0
            setIsMuted(true)
        }
    }

    const toggleFullscreen = () => {
        const container = containerRef.current
        if (!container) return

        if (!isFullscreen) {
            if (container.requestFullscreen) {
                container.requestFullscreen()
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen()
            }
        }
        setIsFullscreen(!isFullscreen)
    }

    const skip = (seconds: number) => {
        const video = videoRef.current
        if (!video) return

        video.currentTime = Math.max(0, Math.min(duration, currentTime + seconds))
    }

    const changePlaybackSpeed = (speed: number) => {
        const video = videoRef.current
        if (!video) return

        video.playbackRate = speed
        setPlaybackSpeed(speed)
        setShowSettings(false)
    }

    const formatTime = (time: number) => {
        const hours = Math.floor(time / 3600)
        const minutes = Math.floor((time % 3600) / 60)
        const seconds = Math.floor(time % 60)

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        }
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0
    const bufferedPercentage = duration > 0 ? (buffered / duration) * 100 : 0

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full bg-background group"
            onMouseMove={() => setShowControls(true)}
            onMouseLeave={() => isPlaying && setShowControls(false)}
        >
            {/* Video Element */}
            <video
                ref={videoRef}
                className="w-full h-full object-contain"
                src={currentVideoSource?.url}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onClick={togglePlay}
            />

            {/* Loading Overlay */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                    <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {/* Play Button Overlay (when paused) */}
            {!isPlaying && !isLoading && (
                <button
                    onClick={togglePlay}
                    className="absolute inset-0 flex items-center justify-center bg-background/20 hover:bg-background/30 transition-colors"
                >
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                        <Play className="w-8 h-8 text-foreground ml-1" />
                    </div>
                </button>
            )}

            {/* Controls */}
            <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'
                }`}>
                {/* Progress Bar */}
                <div className="px-4 pb-2">
                    <div className="relative h-2 bg-white/20 rounded-full cursor-pointer group/progress">
                        {/* Buffered Progress */}
                        <div
                            className="absolute top-0 left-0 h-full bg-white/30 rounded-full"
                            style={{ width: `${bufferedPercentage}%` }}
                        />
                        {/* Current Progress */}
                        <div
                            className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                            style={{ width: `${progressPercentage}%` }}
                        />
                        {/* Progress Handle */}
                        <div
                            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity"
                            style={{ left: `calc(${progressPercentage}% - 8px)` }}
                        />
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={progressPercentage}
                            onChange={handleSeek}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between px-4 pb-4">
                    <div className="flex items-center gap-4">
                        {/* Play/Pause */}
                        <button
                            onClick={togglePlay}
                            className="text-foreground hover:text-blue-400 transition-colors"
                        >
                            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                        </button>

                        {/* Skip Buttons */}
                        <button
                            onClick={() => skip(-10)}
                            className="text-foreground hover:text-blue-400 transition-colors"
                        >
                            <SkipBack className="w-5 h-5" />
                        </button>

                        <button
                            onClick={() => skip(10)}
                            className="text-foreground hover:text-blue-400 transition-colors"
                        >
                            <SkipForward className="w-5 h-5" />
                        </button>

                        {/* Volume */}
                        <div className="flex items-center gap-2 group/volume">
                            <button
                                onClick={toggleMute}
                                className="text-foreground hover:text-blue-400 transition-colors"
                            >
                                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                            </button>
                            <div className="w-0 group-hover/volume:w-20 overflow-hidden transition-all duration-200">
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={isMuted ? 0 : volume}
                                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                                    className="w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Time Display */}
                        <div className="text-foreground text-sm font-mono">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Settings */}
                        <div className="relative">
                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className="text-foreground hover:text-blue-400 transition-colors"
                            >
                                <Settings className="w-5 h-5" />
                            </button>

                            {showSettings && (
                                <div className="absolute bottom-8 right-0 bg-background/90 rounded-lg p-2 min-w-32">
                                    <div className="text-foreground text-sm mb-2">Speed</div>
                                    {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(speed => (
                                        <button
                                            key={speed}
                                            onClick={() => changePlaybackSpeed(speed)}
                                            className={`block w-full text-left px-2 py-1 text-sm hover:bg-white/20 rounded ${playbackSpeed === speed ? 'text-blue-400' : 'text-foreground'
                                                }`}
                                        >
                                            {speed}x
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Fullscreen */}
                        <button
                            onClick={toggleFullscreen}
                            className="text-foreground hover:text-blue-400 transition-colors"
                        >
                            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
