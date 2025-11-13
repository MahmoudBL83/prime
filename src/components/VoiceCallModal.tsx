'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Mic, MicOff, PhoneOff, Volume2, VolumeX } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

interface VoiceCallModalProps {
  isOpen: boolean
  onClose: () => void
  sessionId: string
  sessionToken: string
  isHost: boolean
  otherUserName: string
  otherUserImage?: string | null
  isArabic?: boolean
}

export default function VoiceCallModal({
  isOpen,
  onClose,
  sessionId,
  sessionToken,
  isHost,
  otherUserName,
  otherUserImage,
  isArabic = false,
}: VoiceCallModalProps) {
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [callStatus, setCallStatus] = useState<'connecting' | 'ringing' | 'connected' | 'ended'>('connecting')
  const [duration, setDuration] = useState(0)

  const localAudioRef = useRef<HTMLAudioElement>(null)
  const remoteAudioRef = useRef<HTMLAudioElement>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isOpen) {
      initializeCall()
    } else {
      cleanup()
    }

    return () => cleanup()
  }, [isOpen])

  const initializeCall = async () => {
    try {
      // Get audio only
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true,
      })

      localStreamRef.current = stream

      // Create peer connection
      const configuration: RTCConfiguration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      }

      const peerConnection = new RTCPeerConnection(configuration)
      peerConnectionRef.current = peerConnection

      // Add local stream tracks to peer connection
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream)
      })

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0]
          setCallStatus('connected')
          startDurationCounter()
        }
      }

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          // TODO: Send ice candidate to other peer via signaling server
          console.log('New ICE candidate:', event.candidate)
        }
      }

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState)
        if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
          handleEndCall()
        }
      }

      if (isHost) {
        // Create and send offer
        const offer = await peerConnection.createOffer()
        await peerConnection.setLocalDescription(offer)
        console.log('Offer created:', offer)
        setCallStatus('ringing')
      } else {
        setCallStatus('ringing')
      }
    } catch (error) {
      console.error('Error initializing call:', error)
      toast.error(isArabic ? 'فشل بدء المكالمة' : 'Failed to start call')
      onClose()
    }
  }

  const startDurationCounter = () => {
    durationIntervalRef.current = setInterval(() => {
      setDuration((prev) => prev + 1)
    }, 1000)
  }

  const cleanup = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
    }

    setDuration(0)
    setCallStatus('connecting')
  }

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }

  const toggleSpeaker = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = isSpeakerOn
      setIsSpeakerOn(!isSpeakerOn)
    }
  }

  const handleEndCall = async () => {
    try {
      await fetch(`/api/calls/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, duration }),
      })
    } catch (error) {
      console.error('Error ending call:', error)
    }

    cleanup()
    onClose()
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center"
      >
        {/* Hidden audio elements */}
        <audio ref={localAudioRef} autoPlay muted playsInline />
        <audio ref={remoteAudioRef} autoPlay playsInline />

        <div className="w-full max-w-md px-8">
          {/* User Avatar */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center mb-12"
          >
            {otherUserImage ? (
              <img
                src={otherUserImage}
                alt={otherUserName}
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-2xl mb-4"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-2xl mb-4">
                {otherUserName[0]}
              </div>
            )}
            <h2 className="text-white text-3xl font-bold mb-2">{otherUserName}</h2>
            
            {/* Call Status */}
            <div className="text-center">
              {callStatus === 'connected' ? (
                <div className="bg-white/20 backdrop-blur-sm text-white px-6 py-2 rounded-full text-lg font-semibold">
                  {formatDuration(duration)}
                </div>
              ) : (
                <p className="text-white/80 text-lg">
                  {callStatus === 'connecting' && (isArabic ? 'جاري الاتصال...' : 'Connecting...')}
                  {callStatus === 'ringing' && (isArabic ? 'رنين...' : 'Ringing...')}
                </p>
              )}
            </div>

            {/* Audio Wave Animation (when connected) */}
            {callStatus === 'connected' && !isMuted && (
              <div className="flex items-center gap-1 mt-4">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-white rounded-full"
                    animate={{
                      height: [10, 30, 10],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.1,
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6">
            {/* Speaker Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleSpeaker}
              className={`p-5 rounded-full transition-all ${
                !isSpeakerOn
                  ? 'bg-red-500/90 hover:bg-red-600'
                  : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
              } text-white shadow-lg`}
            >
              {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </motion.button>

            {/* End Call Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleEndCall}
              className="p-7 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all shadow-2xl"
            >
              <PhoneOff className="w-8 h-8" />
            </motion.button>

            {/* Mute Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleMute}
              className={`p-5 rounded-full transition-all ${
                isMuted
                  ? 'bg-red-500/90 hover:bg-red-600'
                  : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
              } text-white shadow-lg`}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={handleEndCall}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
