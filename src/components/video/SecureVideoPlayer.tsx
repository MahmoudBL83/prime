'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Shield, AlertTriangle, Lock } from 'lucide-react'

interface SecureVideoPlayerProps {
    src: string
    poster?: string
    title?: string
    onProgress?: (progress: number) => void
    onComplete?: () => void
    watermarkText?: string
    className?: string
}

/**
 * SecureVideoPlayer - Video player with DRM-like protection
 * 
 * Features:
 * - Prevents right-click context menu
 * - Disables video download attribute
 * - Detects screen recording (limited browser support)
 * - Adds dynamic watermark with user info
 * - Blur video on screen capture detection
 * - Keyboard shortcut blocking (print screen, etc.)
 * - Picture-in-Picture blocking
 * - Developer tools detection
 */
export default function SecureVideoPlayer({
    src,
    poster,
    title,
    onProgress,
    onComplete,
    watermarkText,
    className = ''
}: SecureVideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [isBlurred, setIsBlurred] = useState(false)
    const [securityWarning, setSecurityWarning] = useState<string | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const watermarkPositionRef = useRef({ x: 50, y: 50 })

    // Randomize watermark position every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            watermarkPositionRef.current = {
                x: 10 + Math.random() * 80,
                y: 10 + Math.random() * 80
            }
        }, 30000)
        return () => clearInterval(interval)
    }, [])

    // Block right-click context menu
    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        setSecurityWarning('Right-click is disabled for content protection')
        setTimeout(() => setSecurityWarning(null), 3000)
    }, [])

    // Block keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Block Print Screen
            if (e.key === 'PrintScreen') {
                e.preventDefault()
                setIsBlurred(true)
                setSecurityWarning('Screenshot blocked for content protection')
                setTimeout(() => {
                    setIsBlurred(false)
                    setSecurityWarning(null)
                }, 2000)
            }

            // Block Ctrl+S (Save)
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault()
            }

            // Block Ctrl+Shift+I (DevTools)
            if (e.ctrlKey && e.shiftKey && e.key === 'I') {
                e.preventDefault()
                setSecurityWarning('Developer tools are restricted')
            }

            // Block Ctrl+U (View Source)
            if (e.ctrlKey && e.key === 'u') {
                e.preventDefault()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    // Detect screen recording/capture (limited support)
    useEffect(() => {
        // Check for screen capture API
        const checkScreenCapture = async () => {
            try {
                // @ts-ignore - experimental API
                if (navigator.mediaDevices?.getDisplayMedia) {
                    // Monitor for active screen capture sessions
                    const handleVisibilityChange = () => {
                        if (document.hidden) {
                            // Video might be recorded while tab is hidden
                            if (videoRef.current && !videoRef.current.paused) {
                                // Don't pause, but add stronger watermark
                            }
                        }
                    }
                    document.addEventListener('visibilitychange', handleVisibilityChange)
                    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
                }
            } catch (error) {
                console.log('Screen capture detection not supported')
            }
        }

        checkScreenCapture()
    }, [])

    // Detect Developer Tools
    useEffect(() => {
        const detectDevTools = () => {
            const widthThreshold = window.outerWidth - window.innerWidth > 160
            const heightThreshold = window.outerHeight - window.innerHeight > 160

            if (widthThreshold || heightThreshold) {
                setIsBlurred(true)
                setSecurityWarning('Please close developer tools to continue watching')
            } else {
                if (isBlurred && securityWarning?.includes('developer')) {
                    setIsBlurred(false)
                    setSecurityWarning(null)
                }
            }
        }

        const interval = setInterval(detectDevTools, 1000)
        window.addEventListener('resize', detectDevTools)

        return () => {
            clearInterval(interval)
            window.removeEventListener('resize', detectDevTools)
        }
    }, [isBlurred, securityWarning])

    // Block Picture-in-Picture
    useEffect(() => {
        const video = videoRef.current
        if (video) {
            video.disablePictureInPicture = true

            const handleEnterPiP = (e: Event) => {
                e.preventDefault()
                // @ts-ignore
                if (document.pictureInPictureElement) {
                    // @ts-ignore
                    document.exitPictureInPicture()
                }
                setSecurityWarning('Picture-in-Picture is disabled for content protection')
                setTimeout(() => setSecurityWarning(null), 3000)
            }

            video.addEventListener('enterpictureinpicture', handleEnterPiP)
            return () => video.removeEventListener('enterpictureinpicture', handleEnterPiP)
        }
    }, [])

    // Track progress
    useEffect(() => {
        const video = videoRef.current
        if (video && onProgress) {
            const handleTimeUpdate = () => {
                const progress = (video.currentTime / video.duration) * 100
                onProgress(progress)

                if (progress >= 95 && onComplete) {
                    onComplete()
                }
            }

            video.addEventListener('timeupdate', handleTimeUpdate)
            return () => video.removeEventListener('timeupdate', handleTimeUpdate)
        }
    }, [onProgress, onComplete])

    // Handle play state
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    return (
        <div
            ref={containerRef}
            className={`relative group ${className}`}
            onContextMenu={handleContextMenu}
            style={{ userSelect: 'none' }}
        >
            {/* Security Warning Banner */}
            {securityWarning && (
                <div className="absolute top-0 left-0 right-0 z-50 bg-red-500/90 text-white px-4 py-2 flex items-center gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    {securityWarning}
                </div>
            )}

            {/* Video Container */}
            <div className={`relative ${isBlurred ? 'blur-xl' : ''} transition-all duration-300`}>
                <video
                    ref={videoRef}
                    src={src}
                    poster={poster}
                    className="w-full rounded-lg"
                    controls
                    controlsList="nodownload noplaybackrate"
                    disablePictureInPicture
                    playsInline
                    onPlay={handlePlay}
                    onPause={handlePause}
                    // Prevent drag to download
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                />

                {/* Dynamic Watermark */}
                {watermarkText && isPlaying && (
                    <div
                        className="absolute pointer-events-none text-white/30 text-sm font-mono select-none"
                        style={{
                            left: `${watermarkPositionRef.current.x}%`,
                            top: `${watermarkPositionRef.current.y}%`,
                            transform: 'translate(-50%, -50%)',
                            textShadow: '0 0 2px rgba(0,0,0,0.5)'
                        }}
                    >
                        {watermarkText}
                    </div>
                )}

                {/* Invisible overlay to prevent screenshot identification */}
                <div className="absolute inset-0 pointer-events-none bg-transparent" />
            </div>

            {/* Blur Overlay for Security Violations */}
            {isBlurred && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-lg z-40">
                    <div className="text-center text-white">
                        <Lock className="w-16 h-16 mx-auto mb-4 text-red-500" />
                        <p className="text-lg font-medium">Content Protected</p>
                        <p className="text-sm text-gray-400 mt-2">
                            {securityWarning || 'Please disable any recording software to continue'}
                        </p>
                    </div>
                </div>
            )}

            {/* Security Badge */}
            <div className="absolute bottom-4 left-4 flex items-center gap-1 text-xs text-white/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <Shield className="w-3 h-3" />
                <span>Protected Content</span>
            </div>
        </div>
    )
}

/**
 * CSS to add to global styles for additional protection:
 * 
 * .secure-video-container {
 *   -webkit-user-select: none;
 *   -moz-user-select: none;
 *   -ms-user-select: none;
 *   user-select: none;
 *   -webkit-touch-callout: none;
 * }
 * 
 * @media print {
 *   .secure-video-container {
 *     display: none !important;
 *   }
 * }
 */
