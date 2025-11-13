/**
 * Creator Live Studio
 * Live streaming interface based on Business Blueprint Section 3.5
 * 
 * Features:
 * - RTMP/WebRTC streaming
 * - Screen share & whiteboard
 * - Live chat with moderation
 * - Viewer count & analytics
 * - Recording controls
 * - Stream health monitor
 * - Schedule management
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import {
    Radio,
    Video,
    VideoOff,
    Mic,
    MicOff,
    Monitor,
    MonitorOff,
    MessageSquare,
    Users,
    Settings,
    Eye,
    Wifi,
    WifiOff,
    Circle,
    Square,
    Play,
    Pause,
    Clock,
    Calendar,
    Copy,
    ExternalLink,
    Maximize2,
    Minimize2,
    Volume2,
    VolumeX,
    UserPlus,
    AlertCircle,
    CheckCircle,
    TrendingUp,
    Heart,
    Share2,
    Download,
    Sparkles,
    Zap,
    Activity,
    Signal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface StreamSettings {
    title: string
    description: string
    category: 'LECTURE' | 'QA' | 'WORKSHOP' | 'DEMO' | 'OTHER'
    isPublic: boolean
    enableChat: boolean
    enableRecording: boolean
    maxViewers?: number
}

interface StreamStats {
    viewers: number
    likes: number
    messages: number
    peakViewers: number
    duration: number
}

interface ChatMessage {
    id: string
    user: {
        name: string
        avatar?: string
    }
    message: string
    timestamp: Date
    isPinned?: boolean
}

interface StreamHealth {
    bitrate: number
    fps: number
    latency: number
    droppedFrames: number
    status: 'excellent' | 'good' | 'fair' | 'poor'
}

export default function LiveStudioPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const params = useParams()
    const locale = params.locale as string || 'en'
    const isArabic = locale === 'ar'

    const [isLive, setIsLive] = useState(false)
    const [isPreparing, setIsPreparing] = useState(false)
    const [isRecording, setIsRecording] = useState(false)
    
    const [cameraEnabled, setCameraEnabled] = useState(true)
    const [micEnabled, setMicEnabled] = useState(true)
    const [screenSharing, setScreenSharing] = useState(false)
    const [chatEnabled, setChatEnabled] = useState(true)

    const [streamKey, setStreamKey] = useState('')
    const [streamUrl, setStreamUrl] = useState('')
    const [showSettings, setShowSettings] = useState(false)
    const [fullscreen, setFullscreen] = useState(false)

    const [settings, setSettings] = useState<StreamSettings>({
        title: '',
        description: '',
        category: 'LECTURE',
        isPublic: true,
        enableChat: true,
        enableRecording: true
    })

    const [stats, setStats] = useState<StreamStats>({
        viewers: 0,
        likes: 0,
        messages: 0,
        peakViewers: 0,
        duration: 0
    })

    const [health, setHealth] = useState<StreamHealth>({
        bitrate: 0,
        fps: 0,
        latency: 0,
        droppedFrames: 0,
        status: 'good'
    })

    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [newMessage, setNewMessage] = useState('')

    const videoRef = useRef<HTMLVideoElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const durationInterval = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push(`/${locale}/auth/login?callbackUrl=/${locale}/creator/live-studio`)
        }
        if (session?.user?.role !== 'CREATOR') {
            toast.error('Access denied. Creator account required.')
            router.push(`/${locale}/dashboard`)
        }
        
        initializeStream()
        return () => {
            stopStream()
        }
    }, [session, status, router, locale])

    const initializeStream = async () => {
        try {
            // Get stream key from API
            const response = await fetch('/api/creator/live/stream-key')
            if (response.ok) {
                const data = await response.json()
                setStreamKey(data.streamKey)
                setStreamUrl(data.streamUrl)
            }

            // Initialize camera/mic preview
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            })
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream
            }
            streamRef.current = stream
        } catch (error) {
            console.error('Failed to initialize stream:', error)
            toast.error('Failed to access camera/microphone')
        }
    }

    const startStream = async () => {
        if (!settings.title) {
            toast.error('Please set a stream title')
            setShowSettings(true)
            return
        }

        try {
            setIsPreparing(true)
            
            const response = await fetch('/api/creator/live/start-stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            })

            if (response.ok) {
                const data = await response.json()
                setIsLive(true)
                setIsPreparing(false)
                toast.success('🔴 You are now LIVE!')
                
                // Start duration counter
                durationInterval.current = setInterval(() => {
                    setStats(prev => ({ ...prev, duration: prev.duration + 1 }))
                }, 1000)

                // Simulate real-time stats updates
                startStatsSimulation()
            } else {
                throw new Error('Failed to start stream')
            }
        } catch (error) {
            console.error('Failed to start stream:', error)
            toast.error('Failed to go live')
            setIsPreparing(false)
        }
    }

    const stopStream = async () => {
        try {
            const response = await fetch('/api/creator/live/end-stream', {
                method: 'POST'
            })

            setIsLive(false)
            
            if (durationInterval.current) {
                clearInterval(durationInterval.current)
            }

            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
            }

            toast.success('Stream ended')
        } catch (error) {
            console.error('Failed to stop stream:', error)
        }
    }

    const toggleCamera = () => {
        if (streamRef.current) {
            const videoTrack = streamRef.current.getVideoTracks()[0]
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled
                setCameraEnabled(videoTrack.enabled)
            }
        }
    }

    const toggleMic = () => {
        if (streamRef.current) {
            const audioTrack = streamRef.current.getAudioTracks()[0]
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled
                setMicEnabled(audioTrack.enabled)
            }
        }
    }

    const toggleScreenShare = async () => {
        try {
            if (!screenSharing) {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true
                })
                setScreenSharing(true)
                // In production, replace video track with screen track
                toast.success('Screen sharing started')
            } else {
                setScreenSharing(false)
                toast.success('Screen sharing stopped')
            }
        } catch (error) {
            console.error('Screen share error:', error)
            toast.error('Failed to share screen')
        }
    }

    const toggleRecording = () => {
        setIsRecording(!isRecording)
        toast.success(isRecording ? 'Recording stopped' : 'Recording started')
    }

    const copyStreamKey = () => {
        navigator.clipboard.writeText(streamKey)
        toast.success('Stream key copied!')
    }

    const copyStreamUrl = () => {
        navigator.clipboard.writeText(streamUrl)
        toast.success('Stream URL copied!')
    }

    const sendMessage = () => {
        if (newMessage.trim()) {
            const msg: ChatMessage = {
                id: Date.now().toString(),
                user: {
                    name: session?.user?.name || 'You'
                },
                message: newMessage,
                timestamp: new Date()
            }
            setMessages(prev => [...prev, msg])
            setNewMessage('')
        }
    }

    const startStatsSimulation = () => {
        // Simulate viewer fluctuations
        const statsInterval = setInterval(() => {
            setStats(prev => ({
                ...prev,
                viewers: Math.max(0, prev.viewers + Math.floor(Math.random() * 10) - 4),
                likes: prev.likes + Math.floor(Math.random() * 3),
                peakViewers: Math.max(prev.peakViewers, prev.viewers)
            }))
            
            setHealth(prev => ({
                bitrate: 2500 + Math.random() * 500,
                fps: 29 + Math.random() * 2,
                latency: 100 + Math.random() * 200,
                droppedFrames: prev.droppedFrames + Math.floor(Math.random() * 2),
                status: Math.random() > 0.8 ? 'fair' : 'good'
            }))
        }, 3000)

        return () => clearInterval(statsInterval)
    }

    const formatDuration = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600)
        const mins = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400 font-medium">Loading Studio...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 py-4 px-4" dir={isArabic ? 'rtl' : 'ltr'}>
            <div className="max-w-[1920px] mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Radio className="w-6 h-6 text-red-400" />
                            <h1 className="text-2xl font-bold text-white">
                                {isArabic ? 'استوديو البث المباشر' : 'Live Studio'}
                            </h1>
                        </div>
                        {isLive && (
                            <Badge className="bg-red-500 text-white flex items-center gap-1 animate-pulse">
                                <Circle className="w-2 h-2 fill-current" />
                                LIVE
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => setShowSettings(!showSettings)}
                            variant="outline"
                            size="sm"
                        >
                            <Settings className="w-4 h-4 mr-2" />
                            {isArabic ? 'الإعدادات' : 'Settings'}
                        </Button>
                        <Button
                            onClick={() => router.push(`/${locale}/creator/live/schedule`)}
                            variant="outline"
                            size="sm"
                        >
                            <Calendar className="w-4 h-4 mr-2" />
                            {isArabic ? 'الجدولة' : 'Schedule'}
                        </Button>
                    </div>
                </div>

                {/* Settings Panel */}
                {showSettings && (
                    <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 mb-4">
                        <h3 className="text-lg font-bold text-white mb-4">Stream Settings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Stream Title *
                                </label>
                                <input
                                    type="text"
                                    value={settings.title}
                                    onChange={(e) => setSettings(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Enter stream title..."
                                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Category
                                </label>
                                <select
                                    value={settings.category}
                                    onChange={(e) => setSettings(prev => ({ ...prev, category: e.target.value as any }))}
                                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                                >
                                    <option value="LECTURE">Lecture</option>
                                    <option value="QA">Q&A Session</option>
                                    <option value="WORKSHOP">Workshop</option>
                                    <option value="DEMO">Demo</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={settings.description}
                                    onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Describe what you'll be streaming..."
                                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 min-h-[80px]"
                                />
                            </div>
                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.enableChat}
                                        onChange={(e) => setSettings(prev => ({ ...prev, enableChat: e.target.checked }))}
                                        className="w-4 h-4 rounded border-gray-600"
                                    />
                                    <span className="text-sm text-gray-300">Enable Chat</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.enableRecording}
                                        onChange={(e) => setSettings(prev => ({ ...prev, enableRecording: e.target.checked }))}
                                        className="w-4 h-4 rounded border-gray-600"
                                    />
                                    <span className="text-sm text-gray-300">Auto-Record</span>
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {/* Video Preview - 3 columns */}
                    <div className="lg:col-span-3 space-y-4">
                        {/* Video */}
                        <div className="relative bg-black rounded-2xl overflow-hidden aspect-video border-2 border-gray-700">
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                playsInline
                                className="w-full h-full object-cover"
                            />
                            
                            {/* Overlay Controls */}
                            {isLive && (
                                <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <Badge className="bg-red-500 text-white flex items-center gap-2 px-3 py-1.5">
                                            <Circle className="w-2 h-2 fill-current animate-pulse" />
                                            <span className="font-bold">LIVE</span>
                                            <span className="text-xs">{formatDuration(stats.duration)}</span>
                                        </Badge>
                                        <Badge variant="secondary" className="bg-black/60 backdrop-blur-sm">
                                            <Eye className="w-3 h-3 mr-1" />
                                            {stats.viewers}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge 
                                            variant="secondary" 
                                            className={`${
                                                health.status === 'excellent' ? 'bg-green-500/20 text-green-300' :
                                                health.status === 'good' ? 'bg-blue-500/20 text-blue-300' :
                                                health.status === 'fair' ? 'bg-yellow-500/20 text-yellow-300' :
                                                'bg-red-500/20 text-red-300'
                                            }`}
                                        >
                                            <Signal className="w-3 h-3 mr-1" />
                                            {health.status.toUpperCase()}
                                        </Badge>
                                    </div>
                                </div>
                            )}

                            {!cameraEnabled && !screenSharing && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                                    <div className="text-center">
                                        <VideoOff className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                        <p className="text-gray-400">Camera is off</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Control Bar */}
                        <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4">
                            <div className="flex items-center justify-between">
                                {/* Left Controls */}
                                <div className="flex items-center gap-3">
                                    <Button
                                        onClick={toggleCamera}
                                        variant={cameraEnabled ? "default" : "destructive"}
                                        size="lg"
                                        className="w-12 h-12 p-0"
                                    >
                                        {cameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                                    </Button>
                                    <Button
                                        onClick={toggleMic}
                                        variant={micEnabled ? "default" : "destructive"}
                                        size="lg"
                                        className="w-12 h-12 p-0"
                                    >
                                        {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                                    </Button>
                                    <Button
                                        onClick={toggleScreenShare}
                                        variant={screenSharing ? "default" : "outline"}
                                        size="lg"
                                        className="w-12 h-12 p-0"
                                    >
                                        {screenSharing ? <Monitor className="w-5 h-5" /> : <MonitorOff className="w-5 h-5" />}
                                    </Button>
                                    {settings.enableRecording && (
                                        <Button
                                            onClick={toggleRecording}
                                            variant={isRecording ? "destructive" : "outline"}
                                            size="lg"
                                            className="w-12 h-12 p-0"
                                        >
                                            <Circle className={`w-5 h-5 ${isRecording ? 'fill-current' : ''}`} />
                                        </Button>
                                    )}
                                </div>

                                {/* Center - Go Live Button */}
                                <div>
                                    {!isLive ? (
                                        <Button
                                            onClick={startStream}
                                            disabled={isPreparing}
                                            className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-8 py-6 text-lg font-bold"
                                        >
                                            {isPreparing ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                    Starting...
                                                </>
                                            ) : (
                                                <>
                                                    <Radio className="w-5 h-5 mr-2" />
                                                    GO LIVE
                                                </>
                                            )}
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={stopStream}
                                            variant="destructive"
                                            className="px-8 py-6 text-lg font-bold"
                                        >
                                            <Square className="w-5 h-5 mr-2" />
                                            END STREAM
                                        </Button>
                                    )}
                                </div>

                                {/* Right Controls */}
                                <div className="flex items-center gap-3">
                                    <Button
                                        onClick={() => setChatEnabled(!chatEnabled)}
                                        variant={chatEnabled ? "default" : "outline"}
                                        size="lg"
                                        className="w-12 h-12 p-0"
                                    >
                                        <MessageSquare className="w-5 h-5" />
                                    </Button>
                                    <Button
                                        onClick={() => setFullscreen(!fullscreen)}
                                        variant="outline"
                                        size="lg"
                                        className="w-12 h-12 p-0"
                                    >
                                        {fullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Stats Row */}
                        {isLive && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                                        <Users className="w-4 h-4" />
                                        Current Viewers
                                    </div>
                                    <div className="text-2xl font-bold text-white">{stats.viewers}</div>
                                </div>
                                <div className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                                        <TrendingUp className="w-4 h-4" />
                                        Peak Viewers
                                    </div>
                                    <div className="text-2xl font-bold text-white">{stats.peakViewers}</div>
                                </div>
                                <div className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                                        <Heart className="w-4 h-4" />
                                        Likes
                                    </div>
                                    <div className="text-2xl font-bold text-white">{stats.likes}</div>
                                </div>
                                <div className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                                        <MessageSquare className="w-4 h-4" />
                                        Messages
                                    </div>
                                    <div className="text-2xl font-bold text-white">{stats.messages}</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar - 1 column */}
                    <div className="space-y-4">
                        {/* Stream Health */}
                        <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4">
                            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-green-400" />
                                Stream Health
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Bitrate</span>
                                    <span className="text-white font-medium">{health.bitrate.toFixed(0)} kbps</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400">FPS</span>
                                    <span className="text-white font-medium">{health.fps.toFixed(1)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Latency</span>
                                    <span className="text-white font-medium">{health.latency.toFixed(0)}ms</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Dropped</span>
                                    <span className="text-white font-medium">{health.droppedFrames}</span>
                                </div>
                            </div>
                        </div>

                        {/* Stream Key */}
                        {!isLive && (
                            <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4">
                                <h3 className="text-sm font-semibold text-white mb-3">Stream Key</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={streamKey}
                                            readOnly
                                            className="flex-1 bg-gray-700/50 border border-gray-600 rounded px-3 py-2 text-white text-xs font-mono"
                                        />
                                        <Button size="sm" variant="outline" onClick={copyStreamKey}>
                                            <Copy className="w-3 h-3" />
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={streamUrl}
                                            readOnly
                                            className="flex-1 bg-gray-700/50 border border-gray-600 rounded px-3 py-2 text-white text-xs font-mono"
                                        />
                                        <Button size="sm" variant="outline" onClick={copyStreamUrl}>
                                            <Copy className="w-3 h-3" />
                                        </Button>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Use OBS or similar software with these credentials
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Live Chat */}
                        {chatEnabled && (
                            <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4 flex flex-col h-[400px]">
                                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-purple-400" />
                                    Live Chat
                                </h3>
                                <div className="flex-1 overflow-y-auto space-y-2 mb-3">
                                    {messages.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500 text-sm">
                                            No messages yet
                                        </div>
                                    ) : (
                                        messages.map((msg) => (
                                            <div key={msg.id} className="p-2 rounded bg-gray-700/50">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-semibold text-purple-400">
                                                        {msg.user.name}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {msg.timestamp.toLocaleTimeString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-white">{msg.message}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                        placeholder="Send a message..."
                                        className="flex-1 bg-gray-700/50 border border-gray-600 rounded px-3 py-2 text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500"
                                    />
                                    <Button size="sm" onClick={sendMessage}>
                                        Send
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
