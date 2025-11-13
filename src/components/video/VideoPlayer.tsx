'use client';

import { useState, useRef, useEffect } from 'react';
import { 
    Play, Pause, Volume2, VolumeX, Maximize, Minimize,
    Settings, SkipBack, SkipForward, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoPlayerProps {
    lessonId: string;
    videoUrl: string;
    title: string;
    onProgress?: (position: number, watchTime: number) => void;
    onComplete?: () => void;
    autoSave?: boolean; // Auto-save progress every 10 seconds
    initialPosition?: number; // Resume from this position
}

export default function VideoPlayer({
    lessonId,
    videoUrl,
    title,
    onProgress,
    onComplete,
    autoSave = true,
    initialPosition = 0,
}: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const progressBarRef = useRef<HTMLDivElement>(null);
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(initialPosition);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isBuffering, setIsBuffering] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [totalWatchTime, setTotalWatchTime] = useState(0);
    
    const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);
    const lastSaveTime = useRef(0);
    const watchTimeInterval = useRef<NodeJS.Timeout | null>(null);

    // Load saved progress on mount
    useEffect(() => {
        loadProgress();
    }, [lessonId]);

    // Set initial position when video is loaded
    useEffect(() => {
        if (videoRef.current && initialPosition > 0) {
            videoRef.current.currentTime = initialPosition;
        }
    }, [initialPosition, videoRef.current?.readyState]);

    // Auto-save progress every 10 seconds
    useEffect(() => {
        if (!autoSave || !isPlaying) return;

        const interval = setInterval(() => {
            saveProgress();
        }, 10000);

        return () => clearInterval(interval);
    }, [autoSave, isPlaying, currentTime, totalWatchTime]);

    // Track watch time
    useEffect(() => {
        if (isPlaying) {
            watchTimeInterval.current = setInterval(() => {
                setTotalWatchTime(prev => prev + 1);
            }, 1000);
        } else {
            if (watchTimeInterval.current) {
                clearInterval(watchTimeInterval.current);
            }
        }

        return () => {
            if (watchTimeInterval.current) {
                clearInterval(watchTimeInterval.current);
            }
        };
    }, [isPlaying]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (!videoRef.current) return;

            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    seek(-10);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    seek(10);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    changeVolume(0.1);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    changeVolume(-0.1);
                    break;
                case 'f':
                    e.preventDefault();
                    toggleFullscreen();
                    break;
                case 'm':
                    e.preventDefault();
                    toggleMute();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, []);

    // Hide controls after inactivity
    useEffect(() => {
        if (showControls) {
            if (hideControlsTimeout.current) {
                clearTimeout(hideControlsTimeout.current);
            }
            hideControlsTimeout.current = setTimeout(() => {
                if (isPlaying) {
                    setShowControls(false);
                }
            }, 3000);
        }

        return () => {
            if (hideControlsTimeout.current) {
                clearTimeout(hideControlsTimeout.current);
            }
        };
    }, [showControls, isPlaying]);

    const loadProgress = async () => {
        try {
            const response = await fetch(`/api/lessons/${lessonId}/progress`);
            if (response.ok) {
                const data = await response.json();
                if (data.lastPosition && videoRef.current) {
                    videoRef.current.currentTime = data.lastPosition;
                    setCurrentTime(data.lastPosition);
                }
                if (data.watchTime) {
                    setTotalWatchTime(data.watchTime);
                }
            }
        } catch (error) {
            console.error('Error loading progress:', error);
        }
    };

    const saveProgress = async () => {
        if (!videoRef.current) return;

        const now = Date.now();
        if (now - lastSaveTime.current < 5000) return; // Debounce: save max once per 5 seconds

        try {
            lastSaveTime.current = now;
            const position = Math.floor(videoRef.current.currentTime);
            
            await fetch(`/api/lessons/${lessonId}/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lastPosition: position,
                    watchTime: totalWatchTime,
                    completed: false,
                }),
            });

            onProgress?.(position, totalWatchTime);
        } catch (error) {
            console.error('Error saving progress:', error);
        }
    };

    const togglePlay = () => {
        if (!videoRef.current) return;

        if (isPlaying) {
            videoRef.current.pause();
            saveProgress(); // Save when pausing
        } else {
            videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const seek = (seconds: number) => {
        if (!videoRef.current) return;
        videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    };

    const changeVolume = (delta: number) => {
        if (!videoRef.current) return;
        const newVolume = Math.max(0, Math.min(1, volume + delta));
        setVolume(newVolume);
        videoRef.current.volume = newVolume;
        if (newVolume > 0) setIsMuted(false);
    };

    const toggleMute = () => {
        if (!videoRef.current) return;
        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const toggleFullscreen = () => {
        if (!containerRef.current) return;

        if (!isFullscreen) {
            if (containerRef.current.requestFullscreen) {
                containerRef.current.requestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
        setIsFullscreen(!isFullscreen);
    };

    const changePlaybackSpeed = (speed: number) => {
        if (!videoRef.current) return;
        videoRef.current.playbackRate = speed;
        setPlaybackSpeed(speed);
        setShowSpeedMenu(false);
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!progressBarRef.current || !videoRef.current) return;

        const rect = progressBarRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        const newTime = percentage * duration;
        
        videoRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        
        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div
            ref={containerRef}
            className="relative w-full bg-background rounded-lg overflow-hidden group"
            onMouseMove={() => setShowControls(true)}
            onMouseLeave={() => isPlaying && setShowControls(false)}
        >
            {/* Video Element */}
            <video
                ref={videoRef}
                src={videoUrl}
                className="w-full aspect-video"
                onLoadedMetadata={(e) => {
                    setDuration(e.currentTarget.duration);
                }}
                onTimeUpdate={(e) => {
                    setCurrentTime(e.currentTarget.currentTime);
                }}
                onEnded={() => {
                    setIsPlaying(false);
                    saveProgress();
                    onComplete?.();
                }}
                onWaiting={() => setIsBuffering(true)}
                onCanPlay={() => setIsBuffering(false)}
                onClick={togglePlay}
            />

            {/* Buffering Indicator */}
            <AnimatePresence>
                {isBuffering && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center bg-background/50"
                    >
                        <Loader2 className="w-12 h-12 text-foreground animate-spin" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Controls Overlay */}
            <AnimatePresence>
                {showControls && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none"
                    >
                        {/* Top Bar - Title */}
                        <div className="absolute top-0 left-0 right-0 p-4 pointer-events-auto">
                            <h3 className="text-foreground text-lg font-semibold drop-shadow-lg">
                                {title}
                            </h3>
                        </div>

                        {/* Bottom Controls */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-auto">
                            {/* Progress Bar */}
                            <div
                                ref={progressBarRef}
                                className="w-full h-1.5 bg-gray-600 rounded-full cursor-pointer mb-4 hover:h-2 transition-all"
                                onClick={handleProgressClick}
                            >
                                <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full relative"
                                    style={{ width: `${(currentTime / duration) * 100}%` }}
                                >
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-background rounded-full shadow-lg" />
                                </div>
                            </div>

                            {/* Control Buttons */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {/* Play/Pause */}
                                    <button
                                        onClick={togglePlay}
                                        className="text-foreground hover:text-purple-400 transition-colors"
                                    >
                                        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                                    </button>

                                    {/* Skip Back */}
                                    <button
                                        onClick={() => seek(-10)}
                                        className="text-foreground hover:text-purple-400 transition-colors"
                                    >
                                        <SkipBack className="w-5 h-5" />
                                    </button>

                                    {/* Skip Forward */}
                                    <button
                                        onClick={() => seek(10)}
                                        className="text-foreground hover:text-purple-400 transition-colors"
                                    >
                                        <SkipForward className="w-5 h-5" />
                                    </button>

                                    {/* Volume */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={toggleMute}
                                            className="text-foreground hover:text-purple-400 transition-colors"
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
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                setVolume(val);
                                                if (videoRef.current) videoRef.current.volume = val;
                                                if (val > 0) setIsMuted(false);
                                            }}
                                            className="w-20 accent-purple-500"
                                        />
                                    </div>

                                    {/* Time */}
                                    <span className="text-foreground text-sm">
                                        {formatTime(currentTime)} / {formatTime(duration)}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4">
                                    {/* Playback Speed */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                                            className="text-foreground hover:text-purple-400 transition-colors flex items-center gap-1"
                                        >
                                            <Settings className="w-5 h-5" />
                                            <span className="text-sm">{playbackSpeed}x</span>
                                        </button>

                                        <AnimatePresence>
                                            {showSpeedMenu && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                    className="absolute bottom-full right-0 mb-2 bg-background rounded-lg p-2 shadow-xl"
                                                >
                                                    {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
                                                        <button
                                                            key={speed}
                                                            onClick={() => changePlaybackSpeed(speed)}
                                                            className={`block w-full text-left px-4 py-2 text-sm rounded hover:bg-card transition-colors ${
                                                                playbackSpeed === speed
                                                                    ? 'text-purple-400 font-semibold'
                                                                    : 'text-foreground'
                                                            }`}
                                                        >
                                                            {speed}x
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Fullscreen */}
                                    <button
                                        onClick={toggleFullscreen}
                                        className="text-foreground hover:text-purple-400 transition-colors"
                                    >
                                        {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
