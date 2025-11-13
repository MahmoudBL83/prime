'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    Video, 
    Phone, 
    Calendar, 
    Clock, 
    Users, 
    X,
    Settings,
    CheckCircle,
    AlertCircle
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import VideoCallInterface from './VideoCallInterface'

interface StudyBuddy {
    id: string
    name: string
    arabicName?: string
    profileImage?: string
    isOnline: boolean
    lastSeen?: Date
}

interface VideoCallInitiatorProps {
    studyBuddy: StudyBuddy
    currentUserId: string
    onClose: () => void
    studySessionId?: string
}

export const VideoCallInitiator: React.FC<VideoCallInitiatorProps> = ({
    studyBuddy,
    currentUserId,
    onClose,
    studySessionId
}) => {
    const [callState, setCallState] = useState<'idle' | 'calling' | 'ringing' | 'connected' | 'declined'>('idle')
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [callType, setCallType] = useState<'instant' | 'scheduled'>('instant')
    const [scheduledTime, setScheduledTime] = useState('')
    const [duration, setDuration] = useState(60) // Default 60 minutes
    const [topic, setTopic] = useState('')

    const initiateCall = async () => {
        try {
            setCallState('calling')
            
            console.log('🔵 Initiating video call with:', {
                targetUserId: studyBuddy.id,
                callType,
                scheduledTime,
                duration,
                topic: topic || `Study session with ${studyBuddy.arabicName || studyBuddy.name}`
            })
            
            const response = await fetch('/api/study-buddy/video-call/initiate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    targetUserId: studyBuddy.id,
                    callType,
                    scheduledTime: callType === 'scheduled' ? scheduledTime : null,
                    duration,
                    topic: topic || `Study session with ${studyBuddy.arabicName || studyBuddy.name}`,
                    studySessionId
                })
            })

            console.log('📡 API Response status:', response.status, response.statusText)

            if (!response.ok) {
                let errorData
                try {
                    errorData = await response.json()
                    console.error('❌ Call initiation failed:', {
                        status: response.status,
                        statusText: response.statusText,
                        errorData
                    })
                } catch (parseError) {
                    console.error('❌ Failed to parse error response:', parseError)
                    errorData = { error: `Server error: ${response.status} ${response.statusText}` }
                }
                throw new Error(errorData.error || `Failed to initiate call (${response.status})`)
            }

            const data = await response.json()
            console.log('✅ Call initiated successfully:', data)
            
            setSessionId(data.sessionId)
            setCallState('ringing')

            // Simulate waiting for response (in real app, this would be handled by websocket)
            setTimeout(() => {
                // Simulate acceptance for demo
                setCallState('connected')
                toast.success(`${studyBuddy.arabicName || studyBuddy.name} accepted the call!`)
            }, 3000)

        } catch (error) {
            console.error('🚨 Failed to initiate call:', error)
            const errorMessage = error instanceof Error ? error.message : 'Failed to start video call'
            toast.error(errorMessage)
            setCallState('idle')
        }
    }

    const cancelCall = async () => {
        if (sessionId) {
            try {
                await fetch('/api/study-buddy/video-call/cancel', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ sessionId })
                })
            } catch (error) {
                console.error('Failed to cancel call:', error)
            }
        }
        
        setCallState('idle')
        setSessionId(null)
    }

    const handleEndCall = () => {
        setCallState('idle')
        setSessionId(null)
        onClose()
    }

    if (callState === 'connected' && sessionId) {
        return (
            <VideoCallInterface
                sessionId={sessionId}
                currentUserId={currentUserId}
                participants={[{
                    id: studyBuddy.id,
                    name: studyBuddy.name,
                    arabicName: studyBuddy.arabicName,
                    profileImage: studyBuddy.profileImage,
                    isAudioEnabled: true,
                    isVideoEnabled: true,
                    isPeerConnected: false
                }]}
                onEndCall={handleEndCall}
                isInitiator={true}
            />
        )
    }

    return (
        <div className="fixed inset-0 bg-background bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-background dark:bg-card rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-foreground dark:text-foreground">
                        Video Call
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-gray-200"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Study Buddy Info */}
                <div className="flex items-center space-x-3 mb-6">
                    <div className="relative">
                        {studyBuddy.profileImage ? (
                            <img
                                src={studyBuddy.profileImage}
                                alt={studyBuddy.name}
                                className="w-12 h-12 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-foreground font-semibold">
                                    {studyBuddy.name.charAt(0)}
                                </span>
                            </div>
                        )}
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                            studyBuddy.isOnline ? 'bg-green-400' : 'bg-gray-400'
                        }`} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground dark:text-foreground">
                            {studyBuddy.arabicName || studyBuddy.name}
                        </h3>
                        <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                            {studyBuddy.isOnline ? 'Online' : 'Last seen recently'}
                        </p>
                    </div>
                </div>

                {callState === 'idle' && (
                    <div className="space-y-4">
                        {/* Call Type Selection */}
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setCallType('instant')}
                                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                                    callType === 'instant'
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                        : 'border-border dark:border-gray-600 text-foreground dark:text-muted-foreground'
                                }`}
                            >
                                <Phone className="w-5 h-5 mx-auto mb-1" />
                                <span className="text-sm font-medium">Instant Call</span>
                            </button>
                            <button
                                onClick={() => setCallType('scheduled')}
                                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                                    callType === 'scheduled'
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                        : 'border-border dark:border-gray-600 text-foreground dark:text-muted-foreground'
                                }`}
                            >
                                <Calendar className="w-5 h-5 mx-auto mb-1" />
                                <span className="text-sm font-medium">Schedule</span>
                            </button>
                        </div>

                        {/* Session Settings */}
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-foreground dark:text-muted-foreground mb-1">
                                    Study Topic
                                </label>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="What will you study together?"
                                    className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background dark:bg-gray-700 text-foreground dark:text-foreground"
                                />
                            </div>

                            <div className="flex space-x-3">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-foreground dark:text-muted-foreground mb-1">
                                        Duration (minutes)
                                    </label>
                                    <select
                                        value={duration}
                                        onChange={(e) => setDuration(parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background dark:bg-gray-700 text-foreground dark:text-foreground"
                                    >
                                        <option value={30}>30 min</option>
                                        <option value={60}>1 hour</option>
                                        <option value={90}>1.5 hours</option>
                                        <option value={120}>2 hours</option>
                                    </select>
                                </div>

                                {callType === 'scheduled' && (
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-foreground dark:text-muted-foreground mb-1">
                                            Start Time
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={scheduledTime}
                                            onChange={(e) => setScheduledTime(e.target.value)}
                                            min={new Date().toISOString().slice(0, 16)}
                                            className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background dark:bg-gray-700 text-foreground dark:text-foreground"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-3 pt-4">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 px-4 bg-muted dark:bg-gray-700 text-foreground dark:text-muted-foreground rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={initiateCall}
                                disabled={callType === 'scheduled' && !scheduledTime}
                                className="flex-1 py-3 px-4 bg-blue-600 text-foreground rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                            >
                                <Video className="w-5 h-5" />
                                <span>
                                    {callType === 'instant' ? 'Start Call' : 'Schedule Call'}
                                </span>
                            </button>
                        </div>
                    </div>
                )}

                {callState === 'calling' && (
                    <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground dark:text-foreground mb-2">
                            Initiating call...
                        </h3>
                        <p className="text-muted-foreground dark:text-muted-foreground mb-6">
                            Setting up the video session
                        </p>
                        <button
                            onClick={cancelCall}
                            className="px-6 py-2 bg-red-600 text-foreground rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                )}

                {callState === 'ringing' && (
                    <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mb-4">
                            <Phone className="w-8 h-8 text-yellow-600 animate-bounce" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground dark:text-foreground mb-2">
                            Calling {studyBuddy.arabicName || studyBuddy.name}...
                        </h3>
                        <p className="text-muted-foreground dark:text-muted-foreground mb-6">
                            Waiting for them to answer
                        </p>
                        <button
                            onClick={cancelCall}
                            className="px-6 py-2 bg-red-600 text-foreground rounded-lg hover:bg-red-700 transition-colors"
                        >
                            End Call
                        </button>
                    </div>
                )}

                {callState === 'declined' && (
                    <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground dark:text-foreground mb-2">
                            Call Declined
                        </h3>
                        <p className="text-muted-foreground dark:text-muted-foreground mb-6">
                            {studyBuddy.arabicName || studyBuddy.name} is not available right now
                        </p>
                        <div className="flex space-x-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2 bg-muted dark:bg-gray-700 text-foreground dark:text-muted-foreground rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => setCallState('idle')}
                                className="flex-1 px-4 py-2 bg-blue-600 text-foreground rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    )
}

export default VideoCallInitiator