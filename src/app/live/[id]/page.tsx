'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  Video,
  Users,
  MessageSquare,
  HelpCircle,
  ThumbsUp,
  Send,
  Radio,
  Clock,
  Eye,
  Share2,
  Maximize,
  Volume2,
  VolumeX,
  Settings,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VideoCallService } from '@/services/VideoCallService';

interface LiveSession {
  id: string;
  title: string;
  description?: string;
  scheduledAt: string;
  duration: number;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';
  streamUrl?: string;
  viewCount: number;
  channel: {
    id: string;
    name: string;
    profileImage?: string;
  };
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userImage?: string;
  message: string;
  timestamp: Date;
}

interface QAQuestion {
  id: string;
  userId: string;
  userName: string;
  question: string;
  timestamp: Date;
  upvotes: number;
  hasUpvoted: boolean;
  answered: boolean;
}

export default function LiveViewerPage() {
  const params = useParams();
  const sessionId = params?.id as string;
  const { data: session } = useSession();

  const [loading, setLoading] = useState(true);
  const [liveSession, setLiveSession] = useState<LiveSession | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [connectionState, setConnectionState] = useState<string>('disconnected');

  // Chat & Q&A
  const [activeTab, setActiveTab] = useState<'chat' | 'qa'>('chat');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [qaQuestions, setQAQuestions] = useState<QAQuestion[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newQuestion, setNewQuestion] = useState('');

  // Stats
  const [viewers, setViewers] = useState(0);
  const [watchTime, setWatchTime] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoCallServiceRef = useRef<VideoCallService | null>(null);

  // Initialize WebRTC service
  useEffect(() => {
    videoCallServiceRef.current = new VideoCallService({
      constraints: {
        audio: true,
        video: false // Viewer only receives, doesn't send video
      }
    });

    // Handle remote stream from host
    videoCallServiceRef.current.onRemoteStream((stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        toast.success('Connected to stream!');
      }
    });

    // Handle connection state changes
    videoCallServiceRef.current.onConnectionStateChange((state) => {
      setConnectionState(state);
      if (state === 'connected') {
        toast.success('Stream connected');
      } else if (state === 'disconnected' || state === 'failed') {
        toast.error('Stream disconnected');
      }
    });

    return () => {
      videoCallServiceRef.current?.endCall();
    };
  }, []);

  useEffect(() => {
    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  useEffect(() => {
    // Auto-scroll chat to bottom
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isJoined && liveSession?.status === 'LIVE') {
      interval = setInterval(() => {
        setWatchTime(prev => prev + 1);
        // Fetch updated stats
        fetchStats();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isJoined, liveSession?.status]);

  const loadSession = async () => {
    try {
      const res = await fetch(`/api/live-sessions/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setLiveSession(data.session);

        if (data.session.status === 'LIVE') {
          setViewers(data.session.viewCount || 0);
        }
      } else {
        toast.error('Session not found');
      }
    } catch (error) {
      console.error('Error loading session:', error);
      toast.error('Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/live-sessions/${sessionId}/stats`);
      if (res.ok) {
        const data = await res.json();
        setViewers(data.currentViewers || 0);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const joinSession = async () => {
    if (!session?.user) {
      toast.error('Please sign in to join');
      return;
    }

    try {
      const res = await fetch(`/api/live-sessions/${sessionId}/join`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        setIsJoined(true);
        toast.success('Joined session!');

        // Add welcome message
        setChatMessages(prev => [...prev, {
          id: Date.now().toString(),
          userId: 'system',
          userName: 'System',
          message: `${session.user.name} joined the stream`,
          timestamp: new Date(),
        }]);

        // Initialize WebRTC connection
        try {
          if (videoCallServiceRef.current && data.offer) {
            // Host is already streaming, handle their offer
            await videoCallServiceRef.current.handleOffer(data.offer);
          } else if (videoCallServiceRef.current) {
            // Start as viewer (receive-only mode)
            await videoCallServiceRef.current.startCall(sessionId, false);
          }
        } catch (webrtcError) {
          console.error('WebRTC initialization error:', webrtcError);
          // Fallback: still allow joining for chat functionality
          toast.error('Video stream unavailable, but you can still chat');
        }
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to join session');
      }
    } catch (error) {
      console.error('Error joining session:', error);
      toast.error('Failed to join session');
    }
  };



  const leaveSession = async () => {
    try {
      await fetch(`/api/live-sessions/${sessionId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchTime }),
      });

      setIsJoined(false);
    } catch (error) {
      console.error('Error leaving session:', error);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !session?.user) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      userId: session.user.id,
      userName: session.user.name || 'Anonymous',
      userImage: session.user.image,
      message: newMessage,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, message]);
    setNewMessage('');

    // TODO: Send via WebSocket
  };

  const askQuestion = () => {
    if (!newQuestion.trim() || !session?.user) return;

    const question: QAQuestion = {
      id: Date.now().toString(),
      userId: session.user.id,
      userName: session.user.name || 'Anonymous',
      question: newQuestion,
      timestamp: new Date(),
      upvotes: 0,
      hasUpvoted: false,
      answered: false,
    };

    setQAQuestions(prev => [...prev, question]);
    setNewQuestion('');
    toast.success('Question submitted');

    // TODO: Send to server
  };

  const upvoteQuestion = (questionId: string) => {
    setQAQuestions(prev =>
      prev.map(q => {
        if (q.id === questionId) {
          return {
            ...q,
            upvotes: q.hasUpvoted ? q.upvotes - 1 : q.upvotes + 1,
            hasUpvoted: !q.hasUpvoted,
          };
        }
        return q;
      })
    );
  };

  const toggleFullscreen = () => {
    if (!fullscreen) {
      containerRef.current?.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const shareStream = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (!liveSession) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center text-white">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2">Session not found</h2>
          <p className="text-gray-400">This live session may have been cancelled or removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-6 min-h-screen">
          {/* Video Area */}
          <div className="lg:col-span-2 flex flex-col">
            {/* Video Player */}
            <div className="relative bg-black aspect-video lg:mt-6 lg:rounded-lg overflow-hidden">
              {liveSession.status === 'LIVE' && isJoined ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={muted}
                    className="w-full h-full object-contain"
                  />

                  {/* Live Badge */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <Badge className="bg-red-500 text-white animate-pulse">
                      <Radio className="w-3 h-3 mr-1" />
                      LIVE
                    </Badge>
                    <Badge className="bg-black/70 text-white">
                      <Eye className="w-3 h-3 mr-1" />
                      {viewers} watching
                    </Badge>
                  </div>

                  {/* Video Controls */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/20"
                        onClick={() => setMuted(!muted)}
                      >
                        {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </Button>

                      <div className="flex-1" />

                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/20"
                        onClick={shareStream}
                      >
                        <Share2 className="w-5 h-5" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/20"
                        onClick={toggleFullscreen}
                      >
                        <Maximize className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    {liveSession.status === 'SCHEDULED' ? (
                      <>
                        <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-2xl font-bold mb-2">Stream Scheduled</h3>
                        <p className="text-gray-400 mb-4">
                          Starts {new Date(liveSession.scheduledAt).toLocaleString()}
                        </p>
                        <Button
                          onClick={joinSession}
                          disabled={!session?.user}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          Join When Live
                        </Button>
                      </>
                    ) : liveSession.status === 'ENDED' ? (
                      <>
                        <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-2xl font-bold mb-2">Stream Ended</h3>
                        <p className="text-gray-400">This live session has concluded.</p>
                      </>
                    ) : (
                      <>
                        <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-2xl font-bold mb-2">Join Live Stream</h3>
                        <p className="text-gray-400 mb-4">Click to start watching</p>
                        <Button
                          onClick={joinSession}
                          disabled={!session?.user}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          <Radio className="w-4 h-4 mr-2" />
                          Join Stream
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Session Info */}
            <div className="p-6 bg-gray-900 lg:bg-transparent text-white">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {liveSession.channel.name[0]}
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold mb-2">{liveSession.title}</h1>
                  {liveSession.description && (
                    <p className="text-gray-400 mb-3">{liveSession.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="font-semibold">{liveSession.channel.name}</span>
                    <span>·</span>
                    <span>{viewers} viewers</span>
                    {isJoined && (
                      <>
                        <span>·</span>
                        <span>Watching for {formatDuration(watchTime)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Sidebar */}
          <div className="bg-gray-800 lg:mt-6 lg:rounded-lg flex flex-col h-[600px] lg:h-auto">
            {/* Tabs */}
            <div className="flex border-b border-gray-700">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 px-4 py-3 font-semibold transition-colors ${activeTab === 'chat'
                    ? 'text-white bg-gray-700'
                    : 'text-gray-400 hover:text-white'
                  }`}
              >
                <MessageSquare className="w-4 h-4 inline mr-2" />
                Chat
              </button>
              <button
                onClick={() => setActiveTab('qa')}
                className={`flex-1 px-4 py-3 font-semibold transition-colors ${activeTab === 'qa'
                    ? 'text-white bg-gray-700'
                    : 'text-gray-400 hover:text-white'
                  }`}
              >
                <HelpCircle className="w-4 h-4 inline mr-2" />
                Q&A
              </button>
            </div>

            {/* Chat Messages */}
            {activeTab === 'chat' && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {msg.userName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">
                          {msg.userName}
                        </p>
                        <p className="text-sm text-gray-300 break-words">
                          {msg.message}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />

                  {chatMessages.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      No messages yet. Be the first to chat!
                    </p>
                  )}
                </div>

                <div className="p-4 border-t border-gray-700">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder={isJoined ? "Say something..." : "Join to chat"}
                      disabled={!isJoined}
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!isJoined || !newMessage.trim()}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Q&A */}
            {activeTab === 'qa' && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {qaQuestions.sort((a, b) => b.upvotes - a.upvotes).map((q) => (
                    <div
                      key={q.id}
                      className={`p-3 rounded-lg border ${q.answered
                          ? 'border-green-500 bg-green-500/10'
                          : 'border-gray-700 bg-gray-700/50'
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => upvoteQuestion(q.id)}
                          className={`flex flex-col items-center gap-1 ${q.hasUpvoted ? 'text-purple-400' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                          <ThumbsUp className="w-4 h-4" />
                          <span className="text-xs font-bold">{q.upvotes}</span>
                        </button>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-white mb-1">
                            {q.userName}
                          </p>
                          <p className="text-sm text-gray-300">{q.question}</p>
                          {q.answered && (
                            <Badge className="bg-green-500 text-white mt-2">
                              Answered
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {qaQuestions.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      No questions yet. Ask one!
                    </p>
                  )}
                </div>

                <div className="p-4 border-t border-gray-700">
                  <textarea
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder={isJoined ? "Ask a question..." : "Join to ask questions"}
                    disabled={!isJoined}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none disabled:opacity-50 mb-2"
                  />
                  <Button
                    onClick={askQuestion}
                    disabled={!isJoined || !newQuestion.trim()}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    Ask Question
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Prevent static generation for pages that use session data
export const dynamic = 'force-dynamic'

export const runtime = 'edge'
