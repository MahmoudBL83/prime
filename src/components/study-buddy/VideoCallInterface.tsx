'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Video,
    VideoOff,
    Mic,
    MicOff,
    Phone,
    PhoneOff,
    Monitor,
    MonitorOff,
    Settings,
    MessageCircle,
    Users,
    Maximize2,
    Minimize2,
    Volume2,
    VolumeX,
    Send
} from 'lucide-react'
import { VideoCallService } from '@/services/VideoCallService'
import { toast } from 'react-hot-toast'

interface Participant {
    id: string
    name: string
    arabicName?: string
    profileImage?: string
    stream?: MediaStream
    isAudioEnabled: boolean
    isVideoEnabled: boolean
    isPeerConnected: boolean
}

interface VideoCallInterfaceProps {
    sessionId: string
    currentUserId: string
    participants: Participant[]
    onEndCall: () => void
    isInitiator?: boolean
}

export const VideoCallInterface: React.FC<VideoCallInterfaceProps> = ({
    sessionId,
    currentUserId,
    participants: initialParticipants,
    onEndCall,
    isInitiator = false
}) => {
    const [participants, setParticipants] = useState<Participant[]>(initialParticipants)
    const [isVideoEnabled, setIsVideoEnabled] = useState(true)
    const [isAudioEnabled, setIsAudioEnabled] = useState(true)
    const [isScreenSharing, setIsScreenSharing] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [showChat, setShowChat] = useState(false)
    const [isCallConnected, setIsCallConnected] = useState(false)
    const [callDuration, setCallDuration] = useState(0)
    const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: string; message: string; timestamp: Date }>>([])
    const [messageInput, setMessageInput] = useState('')

    const localVideoRef = useRef<HTMLVideoElement>(null)
    const remoteVideoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({})
    const videoCallService = useRef<VideoCallService | null>(null)
    const callStartTime = useRef<number | null>(null)
    const chatEndRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        initializeVideoCall()
        return () => {
            cleanup()
        }
    }, [])

    useEffect(() => {
        if (isCallConnected && callStartTime.current) {
            const interval = setInterval(() => {
                setCallDuration(Math.floor((Date.now() - callStartTime.current!) / 1000))
            }, 1000)
            return () => clearInterval(interval)
        }
    }, [isCallConnected])

    // Signaling Polling Logic
    useEffect(() => {
        if (!sessionId) return

        let lastSignalId = 0
        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`/api/study-buddy/video-call/signal?sessionId=${sessionId}&lastSignalId=${lastSignalId}`)
                if (response.ok) {
                    const data = await response.json()

                    if (data.signals && data.signals.length > 0) {
                        for (const signal of data.signals) {
                            lastSignalId = Math.max(lastSignalId, parseInt(signal.id))
                            await handleIncomingSignal(signal)
                        }
                    }
                }
            } catch (error) {
                console.error('Signaling poll error:', error)
            }
        }, 2000) // Poll every 2 seconds

        return () => clearInterval(pollInterval)
    }, [sessionId])

    const handleIncomingSignal = async (signal: any) => {
        if (!videoCallService.current) return

        const { type, data } = signal
        // data structure from API is { offer, answer, candidate } inside the 'data' JSON string we passed
        // but wait, the API returns { id, type, data: JSON.parse(signal.data) }

        // signal.data is already parsed JSON from the API route response in formattedSignals
        const payload = signal.data

        try {
            switch (type) {
                case 'offer':
                    if (payload.offer) {
                        await videoCallService.current.handleOffer(payload.offer)
                    }
                    break
                case 'answer':
                    if (payload.answer) {
                        await videoCallService.current.handleAnswer(payload.answer)
                    }
                    break
                case 'ice-candidate':
                    if (payload.candidate) {
                        await videoCallService.current.handleIceCandidate(payload.candidate)
                    }
                    break
            }
        } catch (error) {
            console.error('Error handling signal:', error)
        }
    }

    const initializeVideoCall = async () => {
        try {
            videoCallService.current = new VideoCallService()

            // Set up event handlers before starting call
            setupEventHandlers()

            // Start the call which initializes everything
            const localStream = await videoCallService.current.startCall(sessionId, isInitiator)

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = localStream
            }

            setIsCallConnected(true)
            callStartTime.current = Date.now()
            toast.success('Video call initialized successfully!')

        } catch (error) {
            console.error('Failed to initialize video call:', error)
            toast.error('Failed to start video call. Please check your camera and microphone permissions.')
        }
    }

    const setupEventHandlers = () => {
        if (!videoCallService.current) return

        // Handle incoming remote stream
        videoCallService.current.onRemoteStream((remoteStream) => {
            // Update the first available remote video element
            const remoteParticipant = participants.find(p => p.id !== currentUserId)
            if (remoteParticipant && remoteVideoRefs.current[remoteParticipant.id]) {
                remoteVideoRefs.current[remoteParticipant.id]!.srcObject = remoteStream
            }

            setParticipants(prev => prev.map(p =>
                p.id !== currentUserId ? { ...p, stream: remoteStream, isPeerConnected: true } : p
            ))
        })

        // Handle connection state changes
        videoCallService.current.onConnectionStateChange((state) => {
            console.log('Connection state:', state)

            if (state === 'connected') {
                toast.success('Successfully connected to study buddy!')
            } else if (state === 'disconnected' || state === 'failed') {
                toast.error('Connection lost. Attempting to reconnect...')
            }
        })

        // Handle data channel messages (for in-call chat)
        videoCallService.current.onDataChannelMessage((message) => {
            console.log('📨 Received chat message:', message)
            try {
                const data = JSON.parse(message)
                setChatMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    sender: data.senderId === currentUserId ? 'You' : data.senderName || 'User',
                    message: data.text,
                    timestamp: new Date()
                }])
            } catch (e) {
                console.error('Failed to parse chat message:', e)
            }
        })
    }

    const toggleVideo = async () => {
        try {
            if (videoCallService.current) {
                const isEnabled = videoCallService.current.toggleVideo()
                setIsVideoEnabled(isEnabled)
                toast.success(isEnabled ? 'Camera turned on' : 'Camera turned off')
            }
        } catch (error) {
            console.error('Failed to toggle video:', error)
            toast.error('Failed to toggle camera')
        }
    }

    const toggleAudio = async () => {
        try {
            if (videoCallService.current) {
                const isEnabled = videoCallService.current.toggleAudio()
                setIsAudioEnabled(isEnabled)
                toast.success(isEnabled ? 'Microphone turned on' : 'Microphone turned off')
            }
        } catch (error) {
            console.error('Failed to toggle audio:', error)
            toast.error('Failed to toggle microphone')
        }
    }

    const toggleScreenShare = async () => {
        try {
            if (!isScreenSharing && videoCallService.current) {
                const screenStream = await videoCallService.current.shareScreen()

                if (screenStream && localVideoRef.current) {
                    localVideoRef.current.srcObject = screenStream
                    setIsScreenSharing(true)
                    toast.success('Screen sharing started')

                    // Handle screen share end
                    screenStream.getVideoTracks()[0].onended = () => {
                        stopScreenShare()
                    }
                }
            } else {
                await stopScreenShare()
            }
        } catch (error) {
            console.error('Failed to toggle screen share:', error)
            toast.error('Failed to start screen sharing')
        }
    }

    const stopScreenShare = async () => {
        try {
            if (videoCallService.current && localVideoRef.current) {
                // Get the original camera stream back
                const localStream = videoCallService.current.getLocalStream()
                if (localStream) {
                    localVideoRef.current.srcObject = localStream
                }

                setIsScreenSharing(false)
                toast.success('Screen sharing stopped')
            }
        } catch (error) {
            console.error('Failed to stop screen share:', error)
            toast.error('Failed to stop screen sharing')
        }
    }

    const handleEndCall = async () => {
        try {
            await cleanup()

            // Notify other participants through API
            await fetch('/api/study-buddy/video-call/end', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId })
            })

            onEndCall()
            toast.success('Call ended successfully')
        } catch (error) {
            console.error('Failed to end call:', error)
            toast.error('Error ending call')
        }
    }

    const cleanup = async () => {
        // Use VideoCallService's endCall method which handles cleanup
        if (videoCallService.current) {
            videoCallService.current.endCall()
        }
    }

    // Callback ref for remote video elements
    const setRemoteVideoRef = useCallback((participantId: string) => {
        return (el: HTMLVideoElement | null) => {
            remoteVideoRefs.current[participantId] = el
        }
    }, [])

    const formatDuration = (seconds: number) => {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    }

    const sendChatMessage = () => {
        if (!messageInput.trim() || !videoCallService.current) return

        try {
            const messageData = JSON.stringify({
                senderId: currentUserId,
                senderName: 'You',
                text: messageInput,
                timestamp: new Date().toISOString()
            })

            videoCallService.current.sendMessage(messageData)

            // Add to local chat
            setChatMessages(prev => [...prev, {
                id: Date.now().toString(),
                sender: 'You',
                message: messageInput,
                timestamp: new Date()
            }])

            setMessageInput('')
            console.log('💬 Sent chat message:', messageInput)
        } catch (error) {
            console.error('Failed to send message:', error)
            toast.error('Failed to send message')
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendChatMessage()
        }
    }

    // Auto-scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [chatMessages])

    // Toggle fullscreen mode
    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await containerRef.current?.requestFullscreen()
                setIsFullscreen(true)
                console.log('🖥️ Entered fullscreen mode')
            } else {
                await document.exitFullscreen()
                setIsFullscreen(false)
                console.log('🖥️ Exited fullscreen mode')
            }
        } catch (error) {
            console.error('Fullscreen error:', error)
            toast.error('Failed to toggle fullscreen')
        }
    }

    // Listen for fullscreen changes (e.g., user pressing Esc)
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }

        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }, [])

    return (
        <div ref={containerRef} className="fixed inset-0 bg-background z-50 flex flex-col">
            {/* Header */}
            <div className="bg-card p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-foreground font-medium">Study Session</span>
                    </div>
                    <div className="text-muted-foreground text-sm">
                        Duration: {formatDuration(callDuration)}
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground text-sm">
                        {participants.filter(p => p.isPeerConnected).length + 1} participants
                    </span>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={toggleFullscreen}
                        className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-gray-700 rounded-lg"
                        title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                    >
                        {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                    </motion.button>
                </div>
            </div>

            {/* Video Grid */}
            <div className="flex-1 relative overflow-hidden">
                <div className={`grid gap-2 p-4 h-full ${participants.length === 1 ? 'grid-cols-2' :
                        participants.length <= 4 ? 'grid-cols-2 grid-rows-2' :
                            'grid-cols-3 grid-rows-2'
                    }`}>
                    {/* Local Video */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative bg-gray-700 rounded-lg overflow-hidden aspect-video"
                    >
                        <video
                            ref={localVideoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover mirror-video"
                        />
                        <div className="absolute bottom-2 left-2 bg-background bg-opacity-50 text-foreground text-xs px-2 py-1 rounded">
                            You {!isVideoEnabled && '(Camera Off)'} {!isAudioEnabled && '(Muted)'}
                        </div>
                        {!isVideoEnabled && (
                            <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                                <div className="text-center">
                                    <VideoOff className="mx-auto mb-2 text-muted-foreground" size={32} />
                                    <span className="text-muted-foreground text-sm">Camera is off</span>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Remote Videos */}
                    {participants.map((participant, index) => (
                        <motion.div
                            key={participant.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="relative bg-gray-700 rounded-lg overflow-hidden aspect-video"
                        >
                            <video
                                ref={setRemoteVideoRef(participant.id)}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-2 left-2 bg-background bg-opacity-50 text-foreground text-xs px-2 py-1 rounded">
                                {participant.arabicName || participant.name}
                                {!participant.isVideoEnabled && ' (Camera Off)'}
                                {!participant.isAudioEnabled && ' (Muted)'}
                            </div>

                            {!participant.isPeerConnected && (
                                <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2" />
                                        <span className="text-muted-foreground text-sm">Connecting...</span>
                                    </div>
                                </div>
                            )}

                            {participant.isPeerConnected && !participant.isVideoEnabled && (
                                <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                            {participant.profileImage ? (
                                                <img
                                                    src={participant.profileImage}
                                                    alt={participant.name}
                                                    className="w-full h-full rounded-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-foreground text-lg font-semibold">
                                                    {participant.name.charAt(0)}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-muted-foreground text-sm">Camera is off</span>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* Chat Overlay */}
                <AnimatePresence>
                    {showChat && (
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            className="absolute top-0 right-0 w-80 h-full bg-card border-l border-border p-4 flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-foreground font-semibold">Chat</h3>
                                <button
                                    onClick={() => setShowChat(false)}
                                    className="text-muted-foreground hover:text-foreground text-2xl"
                                >
                                    ×
                                </button>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto mb-4 space-y-2">
                                {chatMessages.length === 0 ? (
                                    <div className="text-muted-foreground text-sm text-center py-8">
                                        No messages yet. Start the conversation!
                                    </div>
                                ) : (
                                    chatMessages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`p-3 rounded-lg ${msg.sender === 'You'
                                                    ? 'bg-blue-600 ml-auto'
                                                    : 'bg-gray-700'
                                                } max-w-[85%]`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-semibold text-foreground">
                                                    {msg.sender}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {msg.timestamp.toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-foreground break-words">
                                                {msg.message}
                                            </p>
                                        </div>
                                    ))
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Input */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Type a message..."
                                    className="flex-1 px-3 py-2 bg-gray-700 text-foreground rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                                />
                                <button
                                    onClick={sendChatMessage}
                                    disabled={!messageInput.trim()}
                                    className="px-4 py-2 bg-blue-600 text-foreground rounded hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="bg-card p-4">
                <div className="flex items-center justify-center space-x-4">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleAudio}
                        className={`p-3 rounded-full transition-colors ${isAudioEnabled
                                ? 'bg-gray-600 hover:bg-background0 text-foreground'
                                : 'bg-red-500 hover:bg-red-600 text-foreground'
                            }`}
                    >
                        {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleVideo}
                        className={`p-3 rounded-full transition-colors ${isVideoEnabled
                                ? 'bg-gray-600 hover:bg-background0 text-foreground'
                                : 'bg-red-500 hover:bg-red-600 text-foreground'
                            }`}
                    >
                        {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleScreenShare}
                        className={`p-3 rounded-full transition-colors ${isScreenSharing
                                ? 'bg-blue-500 hover:bg-blue-600 text-foreground'
                                : 'bg-gray-600 hover:bg-background0 text-foreground'
                            }`}
                    >
                        {isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowChat(!showChat)}
                        className="p-3 rounded-full bg-gray-600 hover:bg-background0 text-foreground transition-colors"
                    >
                        <MessageCircle size={20} />
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleEndCall}
                        className="p-3 rounded-full bg-red-500 hover:bg-red-600 text-foreground transition-colors"
                    >
                        <PhoneOff size={20} />
                    </motion.button>
                </div>
            </div>

            <style jsx>{`
                .mirror-video {
                    transform: scaleX(-1);
                }
            `}</style>
        </div>
    )
}

export default VideoCallInterface