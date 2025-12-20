'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import VideoCallInterface from '@/components/study-buddy/VideoCallInterface'
import { motion } from 'framer-motion'
import { Video, Phone, UserX, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

interface Participant {
  id: string
  name: string
  arabicName?: string | null
  profileImage?: string | null
  isAudioEnabled?: boolean
  isVideoEnabled?: boolean
  isPeerConnected?: boolean
  stream?: MediaStream
}

export default function VideoCallPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session, status } = useSession()

  const sessionId = searchParams.get('sessionId')
  const [loading, setLoading] = useState(true)
  const [callSession, setCallSession] = useState<any>(null)
  const [participants, setParticipants] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }

    if (status === 'authenticated' && sessionId) {
      fetchCallSession()
    }
  }, [status, sessionId])

  const fetchCallSession = async () => {
    try {
      const response = await fetch(`/api/study-buddy/video-call/session?sessionId=${sessionId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch call session')
      }

      const data = await response.json()
      setCallSession(data.session)

      // Set participants
      const participantsList: any[] = []
      if (data.session.initiator) {
        participantsList.push({
          id: data.session.initiator.id,
          name: data.session.initiator.name,
          arabicName: data.session.initiator.arabicName || undefined,
          profileImage: data.session.initiator.profileImage || undefined,
          isAudioEnabled: true,
          isVideoEnabled: true,
          isPeerConnected: false
        })
      }
      if (data.session.participant) {
        participantsList.push({
          id: data.session.participant.id,
          name: data.session.participant.name,
          arabicName: data.session.participant.arabicName || undefined,
          profileImage: data.session.participant.profileImage || undefined,
          isAudioEnabled: true,
          isVideoEnabled: true,
          isPeerConnected: false
        })
      }

      setParticipants(participantsList)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching call session:', error)
      setError('Failed to load video call session')
      setLoading(false)
      toast.error('Failed to load video call')
    }
  }

  const handleEndCall = async () => {
    try {
      await fetch('/api/study-buddy/video-call/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })

      toast.success('Call ended')
      router.push('/study-buddy')
    } catch (error) {
      console.error('Error ending call:', error)
      toast.error('Failed to end call')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-[#0a84ff] animate-spin mx-auto mb-4" />
          <p className="text-xl text-gray-400">Loading video call...</p>
        </div>
      </div>
    )
  }

  if (error || !callSession || !session?.user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="bg-[#1f1f1f] border-gray-800 p-8 text-center max-w-md">
          <UserX className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">
            {error || 'Video Call Not Found'}
          </h2>
          <p className="text-gray-400 mb-6">
            The video call session could not be loaded or has ended.
          </p>
          <Button
            onClick={() => router.push('/study-buddy')}
            className="bg-[#0a84ff] hover:bg-[#0077ed] text-white border-0"
          >
            Back to Study Buddy
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <VideoCallInterface
        sessionId={sessionId!}
        currentUserId={session.user.id}
        participants={participants as any}
        isInitiator={callSession.initiatorId === session.user.id}
        onEndCall={handleEndCall}
      />
    </div>
  )
}
