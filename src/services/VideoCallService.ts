import { toast } from 'react-hot-toast'

interface VideoCallConfig {
  iceServers: RTCIceServer[]
  constraints: MediaStreamConstraints
}

interface CallSession {
  sessionId: string
  isInitiator: boolean
  participants: {
    local: string
    remote: string
  }
  status: 'connecting' | 'connected' | 'disconnected' | 'failed'
}

export class VideoCallService {
  private peerConnection: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private remoteStream: MediaStream | null = null
  private dataChannel: RTCDataChannel | null = null
  private isInitiator = false
  private sessionId: string | null = null
  
  private onRemoteStreamCallback?: (stream: MediaStream) => void
  private onConnectionStateChangeCallback?: (state: RTCPeerConnectionState) => void
  private onDataChannelMessageCallback?: (message: string) => void

  private static readonly DEFAULT_CONFIG: VideoCallConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ],
    constraints: {
      video: {
        width: { min: 640, ideal: 1280, max: 1920 },
        height: { min: 480, ideal: 720, max: 1080 },
        frameRate: { min: 16, ideal: 30, max: 30 }
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    }
  }

  constructor(config?: Partial<VideoCallConfig>) {
    const finalConfig = { ...VideoCallService.DEFAULT_CONFIG, ...config }
    this.initializePeerConnection(finalConfig.iceServers)
  }

  private initializePeerConnection(iceServers: RTCIceServer[]) {
    try {
      this.peerConnection = new RTCPeerConnection({ iceServers })

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.sessionId) {
          this.sendSignalingMessage({
            type: 'ice-candidate',
            candidate: event.candidate,
            sessionId: this.sessionId
          })
        }
      }

      // Handle remote stream
      this.peerConnection.ontrack = (event) => {
        console.log('Received remote stream')
        this.remoteStream = event.streams[0]
        if (this.onRemoteStreamCallback) {
          this.onRemoteStreamCallback(this.remoteStream)
        }
      }

      // Handle connection state changes
      this.peerConnection.onconnectionstatechange = () => {
        const state = this.peerConnection?.connectionState
        console.log('Connection state changed:', state)
        if (this.onConnectionStateChangeCallback && state) {
          this.onConnectionStateChangeCallback(state)
        }
      }

      // Handle data channel
      this.peerConnection.ondatachannel = (event) => {
        const channel = event.channel
        channel.onmessage = (event) => {
          if (this.onDataChannelMessageCallback) {
            this.onDataChannelMessageCallback(event.data)
          }
        }
      }

    } catch (error) {
      console.error('Failed to initialize peer connection:', error)
      throw new Error('WebRTC not supported')
    }
  }

  async startCall(sessionId: string, isInitiator: boolean): Promise<MediaStream> {
    try {
      this.sessionId = sessionId
      this.isInitiator = isInitiator

      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia(
        VideoCallService.DEFAULT_CONFIG.constraints
      )

      // Add local stream to peer connection
      if (this.peerConnection && this.localStream) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection!.addTrack(track, this.localStream!)
        })
      }

      // Create data channel for text messaging during call
      if (this.isInitiator && this.peerConnection) {
        this.dataChannel = this.peerConnection.createDataChannel('messages', {
          ordered: true
        })
        
        this.dataChannel.onopen = () => {
          console.log('Data channel opened')
        }

        this.dataChannel.onmessage = (event) => {
          if (this.onDataChannelMessageCallback) {
            this.onDataChannelMessageCallback(event.data)
          }
        }
      }

      // If initiator, create offer
      if (this.isInitiator) {
        await this.createOffer()
      }

      return this.localStream

    } catch (error) {
      console.error('Failed to start call:', error)
      toast.error('Failed to access camera/microphone')
      throw error
    }
  }

  private async createOffer() {
    try {
      if (!this.peerConnection) return

      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      })

      await this.peerConnection.setLocalDescription(offer)

      this.sendSignalingMessage({
        type: 'offer',
        offer: offer,
        sessionId: this.sessionId!
      })

    } catch (error) {
      console.error('Failed to create offer:', error)
      throw error
    }
  }

  async handleOffer(offer: RTCSessionDescriptionInit) {
    try {
      if (!this.peerConnection) return

      await this.peerConnection.setRemoteDescription(offer)
      
      const answer = await this.peerConnection.createAnswer()
      await this.peerConnection.setLocalDescription(answer)

      this.sendSignalingMessage({
        type: 'answer',
        answer: answer,
        sessionId: this.sessionId!
      })

    } catch (error) {
      console.error('Failed to handle offer:', error)
      throw error
    }
  }

  async handleAnswer(answer: RTCSessionDescriptionInit) {
    try {
      if (!this.peerConnection) return
      await this.peerConnection.setRemoteDescription(answer)
    } catch (error) {
      console.error('Failed to handle answer:', error)
      throw error
    }
  }

  async handleIceCandidate(candidate: RTCIceCandidateInit) {
    try {
      if (!this.peerConnection) return
      await this.peerConnection.addIceCandidate(candidate)
    } catch (error) {
      console.error('Failed to handle ICE candidate:', error)
    }
  }

  sendMessage(message: string) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(message)
    }
  }

  toggleAudio() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        return audioTrack.enabled
      }
    }
    return false
  }

  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        return videoTrack.enabled
      }
    }
    return false
  }

  async shareScreen(): Promise<MediaStream | null> {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      })

      // Replace video track with screen share
      if (this.peerConnection && this.localStream) {
        const videoTrack = this.localStream.getVideoTracks()[0]
        const screenTrack = screenStream.getVideoTracks()[0]
        
        const sender = this.peerConnection.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        )
        
        if (sender) {
          await sender.replaceTrack(screenTrack)
        }

        // Stop screen sharing when user stops it
        screenTrack.onended = async () => {
          if (this.localStream && sender) {
            const originalVideoTrack = this.localStream.getVideoTracks()[0]
            await sender.replaceTrack(originalVideoTrack)
          }
        }
      }

      return screenStream

    } catch (error) {
      console.error('Failed to share screen:', error)
      toast.error('Failed to share screen')
      return null
    }
  }

  endCall() {
    // Close data channel
    if (this.dataChannel) {
      this.dataChannel.close()
      this.dataChannel = null
    }

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
      this.localStream = null
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }

    this.remoteStream = null
    this.sessionId = null
  }

  // Signaling methods - to be implemented with your websocket/messaging system
  private sendSignalingMessage(message: any) {
    // This should be implemented to send messages through your signaling server
    // For now, we'll use the study buddy messaging system
    this.sendThroughMessaging(message)
  }

  private async sendThroughMessaging(message: any) {
    try {
      await fetch('/api/study-buddy/video-call/signal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message)
      })
    } catch (error) {
      console.error('Failed to send signaling message:', error)
    }
  }

  // Event handlers
  onRemoteStream(callback: (stream: MediaStream) => void) {
    this.onRemoteStreamCallback = callback
  }

  onConnectionStateChange(callback: (state: RTCPeerConnectionState) => void) {
    this.onConnectionStateChangeCallback = callback
  }

  onDataChannelMessage(callback: (message: string) => void) {
    this.onDataChannelMessageCallback = callback
  }

  // Getters
  getLocalStream(): MediaStream | null {
    return this.localStream
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream
  }

  getConnectionState(): RTCPeerConnectionState | null {
    return this.peerConnection?.connectionState || null
  }

  isAudioEnabled(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0]
      return audioTrack?.enabled || false
    }
    return false
  }

  isVideoEnabled(): boolean {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0]
      return videoTrack?.enabled || false
    }
    return false
  }
}
