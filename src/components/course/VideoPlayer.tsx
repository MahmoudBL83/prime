'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface VideoSource {
    quality: string
    url: string
    label: string
}

interface Subtitle {
    language: string
    label: string
    url: string
    isDefault?: boolean
}

interface VideoPlayerProps {
    videoSources: VideoSource[]
    subtitles?: Subtitle[]
    poster?: string
    courseId: string
    lessonId: string
    onProgressUpdate?: (progress: number, currentTime: number) => void
    onComplete?: () => void
}

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

export default function VideoPlayer({
    videoSources,
    subtitles = [],
    poster,
    courseId,
    lessonId,
    onProgressUpdate,
    onComplete
}: VideoPlayerProps) {
    const { data: session } = useSession()
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [volume, setVolume] = useState(1)
    const [isMuted, setIsMuted] = useState(false)
    const [playbackSpeed, setPlaybackSpeed] = useState(1)
    const [selectedQuality, setSelectedQuality] = useState(videoSources[0]?.quality || '')
    const [selectedSubtitle, setSelectedSubtitle] = useState<string>('')
    const [showControls, setShowControls] = useState(true)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [progressSaved, setProgressSaved] = useState(false)

    // Auto-save progress every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            if (session && videoRef.current && !progressSaved) {
                saveProgress()
            }
        }, 5000)

        return () => clearInterval(interval)
    }, [currentTime, session, progressSaved])

    // Save progress when component unmounts or user navigates away
    useEffect(() => {
        return () => {
            if (session && videoRef.current) {
                saveProgress()
            }
        }
    }, [session])

    const saveProgress = async () => {
        if (!session || !videoRef.current) return

        try {
            const progress = (currentTime / duration) * 100
            await fetch(`/api/courses/${courseId}/progress`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    lessonId,
                    currentTime,
                    progress,
                }),
            })

            onProgressUpdate?.(progress, currentTime)
            setProgressSaved(true)
            setTimeout(() => setProgressSaved(false), 2000)
        } catch (error) {
            console.error('Failed to save progress:', error)
        }
    }

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause()
            } else {
                videoRef.current.play()
            }
            setIsPlaying(!isPlaying)
        }
    }

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime)
        }
    }

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration)
            setIsLoading(false)
        }
    }

    const handleVolumeChange = (newVolume: number) => {
        if (videoRef.current) {
            videoRef.current.volume = newVolume
            setVolume(newVolume)
            setIsMuted(newVolume === 0)
        }
    }

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted
            setIsMuted(!isMuted)
        }
    }

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = parseFloat(e.target.value)
        if (videoRef.current) {
            videoRef.current.currentTime = newTime
            setCurrentTime(newTime)
        }
    }

    const handleQualityChange = (quality: string) => {
        const currentTime = videoRef.current?.currentTime || 0
        const wasPlaying = isPlaying

        setSelectedQuality(quality)

        // Restore playback position and state after quality change
        setTimeout(() => {
            if (videoRef.current) {
                videoRef.current.currentTime = currentTime
                if (wasPlaying) {
                    videoRef.current.play()
                    setIsPlaying(true)
                }
            }
        }, 100)
    }

    const handleSubtitleChange = (language: string) => {
        setSelectedSubtitle(language)
        if (videoRef.current) {
            const tracks = videoRef.current.textTracks
            for (let i = 0; i < tracks.length; i++) {
                tracks[i].mode = tracks[i].language === language ? 'showing' : 'hidden'
            }
        }
    }

    const handlePlaybackSpeedChange = (speed: number) => {
        if (videoRef.current) {
            videoRef.current.playbackRate = speed
            setPlaybackSpeed(speed)
        }
    }

    const toggleFullscreen = () => {
        if (!document.fullscreenElement && videoRef.current) {
            videoRef.current.requestFullscreen()
            setIsFullscreen(true)
        } else {
            document.exitFullscreen()
            setIsFullscreen(false)
        }
    }

    const togglePictureInPicture = async () => {
        if (videoRef.current) {
            try {
                if (document.pictureInPictureElement) {
                    await document.exitPictureInPicture()
                } else {
                    await videoRef.current.requestPictureInPicture()
                }
            } catch (error) {
                console.error('Picture-in-picture failed:', error)
            }
        }
    }

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    const currentVideoSource = videoSources.find(source => source.quality === selectedQuality)

    // Show/hide controls on mouse movement
    useEffect(() => {
        let timeout: NodeJS.Timeout
        const handleMouseMove = () => {
            setShowControls(true)
            clearTimeout(timeout)
            timeout = setTimeout(() => {
                if (isPlaying) {
                    setShowControls(false)
                }
            }, 3000)
        }

        const videoContainer = videoRef.current?.parentElement
        if (videoContainer) {
            videoContainer.addEventListener('mousemove', handleMouseMove)
            return () => {
                videoContainer.removeEventListener('mousemove', handleMouseMove)
                clearTimeout(timeout)
            }
        }
    }, [isPlaying])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (!videoRef.current) return

            switch (e.key.toLowerCase()) {
                case ' ':
                case 'k':
                    e.preventDefault()
                    togglePlay()
                    break
                case 'arrowright':
                    e.preventDefault()
                    videoRef.current.currentTime += 10
                    break
                case 'arrowleft':
                    e.preventDefault()
                    videoRef.current.currentTime -= 10
                    break
                case 'arrowup':
                    e.preventDefault()
                    handleVolumeChange(Math.min(1, volume + 0.1))
                    break
                case 'arrowdown':
                    e.preventDefault()
                    handleVolumeChange(Math.max(0, volume - 0.1))
                    break
                case 'm':
                    e.preventDefault()
                    toggleMute()
                    break
                case 'f':
                    e.preventDefault()
                    toggleFullscreen()
                    break
            }
        }

        document.addEventListener('keydown', handleKeyPress)
        return () => document.removeEventListener('keydown', handleKeyPress)
    }, [volume, isPlaying])

    // Check if video is completed
    useEffect(() => {
        if (duration > 0 && currentTime >= duration - 1) {
            onComplete?.()
        }
    }, [currentTime, duration, onComplete])

    return (
        <div className="relative bg-background rounded-lg overflow-hidden group">
            {/* Video Element */}
            <video
                ref={videoRef}
                className="w-full h-auto max-h-[70vh]"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onWaiting={() => setIsLoading(true)}
                onCanPlay={() => setIsLoading(false)}
                poster={poster}
            >
                {currentVideoSource && (
                    <source src={currentVideoSource.url} type="video/mp4" />
                )}
                {subtitles.map((subtitle) => (
                    <track
                        key={subtitle.language}
                        kind="subtitles"
                        src={subtitle.url}
                        srcLang={subtitle.language}
                        label={subtitle.label}
                        default={subtitle.isDefault}
                    />
                ))}
                Your browser does not support the video tag.
            </video>

            {/* Loading Overlay */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background bg-opacity-50">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
            )}

            {/* Controls Overlay */}
            <div
                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'
                    }`}
            >
                {/* Progress Bar */}
                <div className="mb-4">
                    <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-foreground mt-1">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        {/* Play/Pause */}
                        <button
                            onClick={togglePlay}
                            className="text-foreground hover:text-muted-foreground transition-colors"
                        >
                            {isPlaying ? (
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                            )}
                        </button>

                        {/* Volume Control */}
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={toggleMute}
                                className="text-foreground hover:text-muted-foreground transition-colors"
                            >
                                {isMuted || volume === 0 ? (
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM11.828 6.757a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={volume}
                                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                                className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        {/* Time Display */}
                        <div className="text-foreground text-sm">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Quality Selector */}
                        {videoSources.length > 1 && (
                            <select
                                value={selectedQuality}
                                onChange={(e) => handleQualityChange(e.target.value)}
                                className="bg-background text-foreground text-sm px-2 py-1 rounded border border-gray-600"
                            >
                                {videoSources.map((source) => (
                                    <option key={source.quality} value={source.quality}>
                                        {source.label}
                                    </option>
                                ))}
                            </select>
                        )}

                        {/* Subtitle Selector */}
                        {subtitles.length > 0 && (
                            <select
                                value={selectedSubtitle}
                                onChange={(e) => handleSubtitleChange(e.target.value)}
                                className="bg-background text-foreground text-sm px-2 py-1 rounded border border-gray-600"
                            >
                                <option value="">No Subtitles</option>
                                {subtitles.map((subtitle) => (
                                    <option key={subtitle.language} value={subtitle.language}>
                                        {subtitle.label}
                                    </option>
                                ))}
                            </select>
                        )}

                        {/* Playback Speed */}
                        <select
                            value={playbackSpeed}
                            onChange={(e) => handlePlaybackSpeedChange(parseFloat(e.target.value))}
                            className="bg-background text-foreground text-sm px-2 py-1 rounded border border-gray-600"
                        >
                            {PLAYBACK_SPEEDS.map((speed) => (
                                <option key={speed} value={speed}>
                                    {speed}x
                                </option>
                            ))}
                        </select>

                        {/* Picture in Picture */}
                        <button
                            onClick={togglePictureInPicture}
                            className="text-foreground hover:text-muted-foreground transition-colors"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 4a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm12 0h2a2 2 0 012 2v8a2 2 0 01-2 2h-2v-2h2V4h-2V4z" />
                            </svg>
                        </button>

                        {/* Fullscreen */}
                        <button
                            onClick={toggleFullscreen}
                            className="text-foreground hover:text-muted-foreground transition-colors"
                        >
                            {isFullscreen ? (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 110-2h4a1 1 0 011 1v4a1 1 0 11-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 110 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 110-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-2 0V5.414L5.707 7.707a1 1 0 01-1.414-1.414L6.586 4H4a1 1 0 01-1-1zm0 9a1 1 0 011-1h1.586l-2.293-2.293a1 1 0 111.414-1.414L6.586 11H4a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1v-1.586l2.293 2.293a1 1 0 11-1.414 1.414L5.414 15H8a1 1 0 001-1v-4zm12-9a1 1 0 01-1 1h-1.586l2.293 2.293a1 1 0 11-1.414 1.414L13.414 9H16a1 1 0 001-1V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v1.586l-2.293-2.293a1 1 0 111.414-1.414L13.586 5H12a1 1 0 01-1-1V4z" clipRule="evenodd" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Progress Saved Indicator */}
            {progressSaved && (
                <div className="absolute top-4 right-4 bg-green-600 text-foreground px-3 py-1 rounded-full text-sm">
                    Progress saved
                </div>
            )}

            {/* Center Play Button */}
            {!isPlaying && !isLoading && (
                <button
                    onClick={togglePlay}
                    className="absolute inset-0 flex items-center justify-center w-full h-full group-hover:opacity-100 transition-opacity"
                >
                    <div className="bg-background bg-opacity-50 rounded-full p-4">
                        <svg className="w-16 h-16 text-foreground" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                    </div>
                </button>
            )}

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
    )
}
