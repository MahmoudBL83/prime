'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { 
    Video,
    VideoOff,
    Mic,
    MicOff,
    Users,
    MessageSquare,
    Settings,
    StopCircle,
    Copy,
    Check,
    Eye,
    Clock,
    Shield
} from 'lucide-react';

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

interface LiveSession {
    id: string;
    title: string;
    description?: string;
    scheduledAt: string;
    duration: number;
    status: string;
    tier: string;
    streamUrl?: string;
    streamKey?: string;
    actualStartAt?: string;
    viewCount: number;
    activeAttendees: number;
    channelName: string;
}

export default function LiveSessionRoomPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const sessionId = params.id as string;
    const t = useTranslations('creator.liveSessions');
    
    const [loading, setLoading] = useState(true);
    const [liveSession, setLiveSession] = useState<LiveSession | null>(null);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [copiedKey, setCopiedKey] = useState(false);
    const [copiedUrl, setCopiedUrl] = useState(false);
    const [activeTab, setActiveTab] = useState<'stream' | 'attendees' | 'chat'>('stream');

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        } else if (session?.user?.role !== 'CREATOR') {
            router.push('/dashboard');
        }
    }, [status, session, router]);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchSession();
            // Poll for updates every 10 seconds
            const interval = setInterval(fetchSession, 10000);
            return () => clearInterval(interval);
        }
    }, [status, sessionId]);

    const fetchSession = async () => {
        try {
            const response = await fetch(`/api/creator/live-sessions/${sessionId}`);
            const data = await response.json();

            if (response.ok) {
                setLiveSession(data.session);
            } else {
                console.error('Failed to fetch session:', data.error);
                alert('Session not found');
                router.push('/creator/live');
            }
        } catch (error) {
            console.error('Error fetching session:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEndSession = async () => {
        if (!confirm('Are you sure you want to end this live session?')) return;

        try {
            const response = await fetch(`/api/creator/live-sessions/${sessionId}/end`, {
                method: 'POST',
            });

            const data = await response.json();

            if (response.ok) {
                alert('Session ended successfully');
                router.push('/creator/live');
            } else {
                alert(data.error || 'Failed to end session');
            }
        } catch (error) {
            console.error('Error ending session:', error);
            alert('Failed to end session');
        }
    };

    const copyToClipboard = (text: string, type: 'url' | 'key') => {
        navigator.clipboard.writeText(text);
        if (type === 'url') {
            setCopiedUrl(true);
            setTimeout(() => setCopiedUrl(false), 2000);
        } else {
            setCopiedKey(true);
            setTimeout(() => setCopiedKey(false), 2000);
        }
    };

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading live session...</p>
                </div>
            </div>
        );
    }

    if (!liveSession) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
            {/* Top Bar */}
            <div className="bg-gray-900/95 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                <span className="text-white font-bold">LIVE</span>
                            </div>
                            <h1 className="text-xl font-bold text-white">{liveSession.title}</h1>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-gray-400">
                                <Eye className="w-4 h-4" />
                                <span className="text-sm">{liveSession.viewCount} views</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                                <Users className="w-4 h-4" />
                                <span className="text-sm">{liveSession.activeAttendees} watching</span>
                            </div>
                            <button
                                onClick={handleEndSession}
                                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-2"
                            >
                                <StopCircle className="w-5 h-5" />
                                End Session
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Video Area */}
                    <div className="lg:col-span-2">
                        <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden">
                            {/* Video Preview */}
                            <div className="aspect-video bg-gray-900 flex items-center justify-center relative">
                                <div className="text-center">
                                    <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                    <p className="text-gray-400 mb-2">Use your streaming software to go live</p>
                                    <p className="text-sm text-gray-500">OBS, Streamlabs, XSplit, etc.</p>
                                </div>
                                
                                {/* Overlay Controls */}
                                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setVideoEnabled(!videoEnabled)}
                                            className={`p-3 rounded-full transition-all duration-300 ${
                                                videoEnabled 
                                                    ? 'bg-gray-800/80 hover:bg-gray-700/80 text-white' 
                                                    : 'bg-red-600/80 hover:bg-red-700/80 text-white'
                                            }`}
                                        >
                                            {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                                        </button>
                                        <button
                                            onClick={() => setAudioEnabled(!audioEnabled)}
                                            className={`p-3 rounded-full transition-all duration-300 ${
                                                audioEnabled 
                                                    ? 'bg-gray-800/80 hover:bg-gray-700/80 text-white' 
                                                    : 'bg-red-600/80 hover:bg-red-700/80 text-white'
                                            }`}
                                        >
                                            {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    
                                    <button className="p-3 rounded-full bg-gray-800/80 hover:bg-gray-700/80 text-white transition-all duration-300">
                                        <Settings className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Stream Info */}
                            <div className="p-6 space-y-4">
                                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                                    <h3 className="text-blue-300 font-medium mb-3 flex items-center gap-2">
                                        <Video className="w-5 h-5" />
                                        Streaming Credentials
                                    </h3>
                                    
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs text-gray-400 block mb-1">RTMP Server URL</label>
                                            <div className="flex items-center gap-2">
                                                <code className="flex-1 bg-gray-900 text-gray-300 px-3 py-2 rounded-lg text-sm font-mono">
                                                    {liveSession.streamUrl || 'rtmp://stream.example.com/live'}
                                                </code>
                                                <button
                                                    onClick={() => copyToClipboard(liveSession.streamUrl || '', 'url')}
                                                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                                                >
                                                    {copiedUrl ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label className="text-xs text-gray-400 block mb-1">Stream Key (Keep Private)</label>
                                            <div className="flex items-center gap-2">
                                                <code className="flex-1 bg-gray-900 text-gray-300 px-3 py-2 rounded-lg text-sm font-mono">
                                                    {liveSession.streamKey || '••••••••••••••••'}
                                                </code>
                                                <button
                                                    onClick={() => copyToClipboard(liveSession.streamKey || '', 'key')}
                                                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                                                >
                                                    {copiedKey ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-sm text-gray-400">
                                    <p className="mb-2">📹 <strong>Setup Instructions:</strong></p>
                                    <ol className="list-decimal list-inside space-y-1 text-gray-500">
                                        <li>Open your streaming software (OBS, Streamlabs, etc.)</li>
                                        <li>Copy the Server URL and Stream Key above</li>
                                        <li>Paste them into your streaming software settings</li>
                                        <li>Click "Start Streaming" in your software</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden">
                            {/* Tabs */}
                            <div className="flex border-b border-gray-700">
                                <button
                                    onClick={() => setActiveTab('attendees')}
                                    className={`flex-1 py-3 px-4 font-medium transition-colors ${
                                        activeTab === 'attendees'
                                            ? 'text-white bg-gray-800/50 border-b-2 border-purple-500'
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    <Users className="w-4 h-4 inline mr-2" />
                                    Attendees
                                </button>
                                <button
                                    onClick={() => setActiveTab('chat')}
                                    className={`flex-1 py-3 px-4 font-medium transition-colors ${
                                        activeTab === 'chat'
                                            ? 'text-white bg-gray-800/50 border-b-2 border-purple-500'
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    <MessageSquare className="w-4 h-4 inline mr-2" />
                                    Chat
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="p-4 h-[500px] overflow-y-auto">
                                {activeTab === 'attendees' && (
                                    <div>
                                        <div className="text-center text-gray-400 py-8">
                                            <Users className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                                            <p className="text-sm">No attendees yet</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Viewers will appear here when they join
                                            </p>
                                        </div>
                                    </div>
                                )}
                                
                                {activeTab === 'chat' && (
                                    <div>
                                        <div className="text-center text-gray-400 py-8">
                                            <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                                            <p className="text-sm">Chat is empty</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Messages will appear here during the session
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Session Info */}
                        <div className="mt-6 bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4">
                            <h3 className="text-white font-medium mb-3">Session Info</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Duration</span>
                                    <span className="text-white">{liveSession.duration} min</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Tier</span>
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-gradient-to-r from-amber-600 to-orange-600 text-white">
                                        <Shield className="w-3 h-3" />
                                        {liveSession.tier}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Started</span>
                                    <span className="text-white">
                                        {liveSession.actualStartAt 
                                            ? new Date(liveSession.actualStartAt).toLocaleTimeString()
                                            : 'Not started'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
