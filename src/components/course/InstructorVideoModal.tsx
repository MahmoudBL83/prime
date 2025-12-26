'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface InstructorVideoModalProps {
    isOpen: boolean
    onClose: () => void
    course: {
        id: string
        title: string
        titleAr: string
        instructor: string
        instructorArabicName?: string
        thumbnail?: string
    }
    userSubscriptionStatus?: 'NONE' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
    lang?: 'en' | 'de'
}

export function InstructorVideoModal({
    isOpen,
    onClose,
    course,
    userSubscriptionStatus,
    lang = 'en'
}: InstructorVideoModalProps) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)
    const modalRef = useRef<HTMLDivElement>(null)

    // Close modal when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen, onClose])

    // Handle video events
    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        const handleTimeUpdate = () => setCurrentTime(video.currentTime)
        const handleDurationChange = () => setDuration(video.duration)
        const handlePlay = () => setIsPlaying(true)
        const handlePause = () => setIsPlaying(false)
        const handleEnded = () => setIsPlaying(false)

        video.addEventListener('timeupdate', handleTimeUpdate)
        video.addEventListener('durationchange', handleDurationChange)
        video.addEventListener('play', handlePlay)
        video.addEventListener('pause', handlePause)
        video.addEventListener('ended', handleEnded)

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate)
            video.removeEventListener('durationchange', handleDurationChange)
            video.removeEventListener('play', handlePlay)
            video.removeEventListener('pause', handlePause)
            video.removeEventListener('ended', handleEnded)
        }
    }, [])

    const togglePlay = () => {
        const video = videoRef.current
        if (!video) return

        if (isPlaying) {
            video.pause()
        } else {
            video.play()
        }
    }

    const toggleMute = () => {
        const video = videoRef.current
        if (!video) return

        video.muted = !isMuted
        setIsMuted(!isMuted)
    }

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const video = videoRef.current
        if (!video) return

        const newTime = parseFloat(e.target.value)
        video.currentTime = newTime
        setCurrentTime(newTime)
    }

    const toggleFullscreen = () => {
        const video = videoRef.current
        if (!video) return

        if (!isFullscreen) {
            if (video.requestFullscreen) {
                video.requestFullscreen()
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen()
            }
        }
        setIsFullscreen(!isFullscreen)
    }

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    const getCTAText = () => {
        if (userSubscriptionStatus === 'ACTIVE') {
            return lang === 'de' ? 'Lernen starten' : 'Start Learning'
        }
        return lang === 'de' ? 'Abonnieren' : 'Subscribe to Access'
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-background bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div
                ref={modalRef}
                className="relative bg-background rounded-lg overflow-hidden max-w-4xl w-full max-h-[90vh]"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 bg-background bg-opacity-50 text-foreground p-2 rounded-full hover:bg-opacity-70 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Video Container */}
                <div className="relative aspect-video bg-background">
                    {/* Placeholder for now - in real implementation, this would be actual video */}
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                        <div className="text-center text-foreground">
                            <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl font-bold">
                                    {(course.instructorArabicName || course.instructor).charAt(0)}
                                </span>
                            </div>
                            <h3 className="text-xl font-semibold mb-2">
                                {course.instructorArabicName || course.instructor}
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                {lang === 'de' ? 'Dozenten-Einführung' : 'Instructor Introduction'}
                            </p>
                            <div className="w-16 h-16 bg-background bg-opacity-20 rounded-full flex items-center justify-center mx-auto cursor-pointer hover:bg-opacity-30 transition-colors"
                                onClick={togglePlay}>
                                <Play className="w-6 h-6 text-foreground ml-1" />
                            </div>
                        </div>
                    </div>

                    {/* Video Element (hidden for demo) */}
                    <video
                        ref={videoRef}
                        className="hidden w-full h-full object-cover"
                        muted={isMuted}
                        playsInline
                    >
                        {/* Video source would go here */}
                    </video>

                    {/* Video Controls Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={togglePlay}
                                className="text-foreground hover:text-muted-foreground transition-colors"
                            >
                                {isPlaying ? (
                                    <Pause className="w-6 h-6" />
                                ) : (
                                    <Play className="w-6 h-6" />
                                )}
                            </button>

                            <div className="flex-1 flex items-center space-x-2">
                                <span className="text-foreground text-sm">{formatTime(currentTime)}</span>
                                <input
                                    type="range"
                                    min="0"
                                    max={duration}
                                    value={currentTime}
                                    onChange={handleSeek}
                                    className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="text-foreground text-sm">{formatTime(duration)}</span>
                            </div>

                            <button
                                onClick={toggleMute}
                                className="text-foreground hover:text-muted-foreground transition-colors"
                            >
                                {isMuted ? (
                                    <VolumeX className="w-5 h-5" />
                                ) : (
                                    <Volume2 className="w-5 h-5" />
                                )}
                            </button>

                            <button
                                onClick={toggleFullscreen}
                                className="text-foreground hover:text-muted-foreground transition-colors"
                            >
                                <Maximize className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Course Info and CTA */}
                <div className="p-6 bg-background dark:bg-background">
                    <h2 className="text-2xl font-bold mb-2 text-foreground dark:text-foreground">
                        {course.title}
                    </h2>
                    <p className="text-muted-foreground dark:text-muted-foreground mb-4">
                        {lang === 'de'
                            ? `Kursleiter: ${course.instructor}`
                            : `Instructor: ${course.instructor}`
                        }
                    </p>
                    <p className="text-muted-foreground dark:text-muted-foreground text-sm mb-6">
                        {lang === 'de'
                            ? 'Dies ist ein Einführungsvideo des Dozenten. Für vollständigen Kurszugang abonnieren Sie bitte.'
                            : 'This is an introduction video from the instructor. For full course access, please subscribe.'
                        }
                    </p>
                    <Button className="w-full" size="lg">
                        {getCTAText()}
                    </Button>
                </div>
            </div>
        </div>
    )
}
