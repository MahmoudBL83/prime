'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Users } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

interface VideoCallModalProps {
  isOpen: boolean
  onClose: () => void
  sessionId: string
  sessionToken: string
  isHost: boolean
  otherUserName: string
  otherUserImage?: string | null
  isArabic?: boolean
}

export default function VideoCallModal({
  isOpen,
  onClose,
  sessionId,
  sessionToken,
  isHost,
  otherUserName,
  otherUserImage,
  isArabic = false,
}: VideoCallModalProps) {
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [callStatus, setCallStatus] = useState<'connecting' | 'ringing' | 'connected' | 'ended'>('connecting')
  const [duration, setDuration] = useState(0)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
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
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

      localStreamRef.current = stream

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

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
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0]
          setCallStatus('connected')
          startDurationCounter()
        }
      }

      // Handle ICE candidates (in production, send these to the other peer via signaling server)
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
        // TODO: Send offer to other peer via signaling server
        console.log('Offer created:', offer)
        setCallStatus('ringing')
      } else {
        // Wait for offer from host
        setCallStatus('ringing')
        // TODO: Listen for offer from signaling server and create answer
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

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoOff(!videoTrack.enabled)
      }
    }
  }

  const handleEndCall = async () => {
    try {
      // Update call session status
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
        className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      >
        {/* Remote Video (Full Screen) */}
        <div className="w-full h-full relative">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Status Overlay */}
          {callStatus !== 'connected' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
              <div className="mb-4">
                {otherUserImage ? (
                  <img
                    src={otherUserImage}
                    alt={otherUserName}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold border-4 border-white">
                    {otherUserName[0]}
                  </div>
                )}
              </div>
              <h2 className="text-white text-2xl font-semibold mb-2">{otherUserName}</h2>
              <p className="text-gray-300">
                {callStatus === 'connecting' && (isArabic ? 'جاري الاتصال...' : 'Connecting...')}
                {callStatus === 'ringing' && (isArabic ? 'رنين...' : 'Ringing...')}
              </p>
            </div>
          )}

          {/* Local Video (Picture-in-Picture) */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute top-4 right-4 w-48 h-32 rounded-xl overflow-hidden shadow-2xl border-2 border-white"
          >
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {isVideoOff && (
              <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                <VideoOff className="w-12 h-12 text-white" />
              </div>
            )}
          </motion.div>

          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {callStatus === 'connected' && (
                  <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {formatDuration(duration)}
                  </div>
                )}
              </div>
              <button
                onClick={handleEndCall}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/70 to-transparent">
            <div className="flex items-center justify-center gap-4">
              {/* Mute Button */}
              <button
                onClick={toggleMute}
                className={`p-4 rounded-full transition-all ${
                  isMuted
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-white/20 hover:bg-white/30'
                } text-white`}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>

              {/* End Call Button */}
              <button
                onClick={handleEndCall}
                className="p-6 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all transform hover:scale-105 shadow-lg"
              >
                <PhoneOff className="w-8 h-8" />
              </button>

              {/* Video Toggle Button */}
              <button
                onClick={toggleVideo}
                className={`p-4 rounded-full transition-all ${
                  isVideoOff
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-white/20 hover:bg-white/30'
                } text-white`}
              >
                {isVideoOff ? <VideoOff className="w-6 h-6" /> : <VideoIcon className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
