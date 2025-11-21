'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { 
    Video,
    Users,
    MessageSquare,
    Shield,
    Clock,
    Eye,
    Loader2,
    Lock,
    AlertCircle
} from 'lucide-react';

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

interface SessionData {
    id: string;
    title: string;
    titleAr?: string;
    description?: string;
    descriptionAr?: string;
    scheduledAt: string;
    duration: number;
    status: string;
    tier: string;
    streamUrl?: string;
    actualStartAt?: string;
    viewCount: number;
    activeAttendees: number;
    elapsedSeconds: number;
    creator: {
        id: string;
        name: string;
        profileImage?: string;
        channelName: string;
    };
}

interface UserAccess {
    hasAccess: boolean;
    userTier?: string;
    requiredTier: string;
    isAttending: boolean;
    attendeeId?: string;
}

export default function WatchLiveSessionPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const sessionId = params.id as string;
    const t = useTranslations('creator.live');
    const tm = useTranslations('memberSession');
    
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [sessionData, setSessionData] = useState<SessionData | null>(null);
    const [userAccess, setUserAccess] = useState<UserAccess | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Fetch session data
    const fetchSession = useCallback(async () => {
        try {
            const response = await fetch(`/api/sessions/${sessionId}`);
            const data = await response.json();

            if (response.ok) {
                setSessionData(data.session);
                setUserAccess(data.userAccess);
                setError(null);
            } else {
                setError(data.error || 'Failed to load session');
            }
        } catch (err) {
            console.error('Error fetching session:', err);
            setError('Failed to load session');
        } finally {
            setLoading(false);
        }
    }, [sessionId]);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        } else if (status === 'authenticated') {
            fetchSession();
        }
    }, [status, router, fetchSession]);

    // Auto-refresh every 10 seconds when live
    useEffect(() => {
        if (sessionData?.status === 'LIVE') {
            const interval = setInterval(fetchSession, 10000);
            return () => clearInterval(interval);
        }
    }, [sessionData?.status, fetchSession]);

    // Join session handler
    const handleJoinSession = async () => {
        setJoining(true);
        try {
            const response = await fetch(`/api/sessions/${sessionId}/join`, {
                method: 'POST',
            });

            const data = await response.json();

            if (response.ok) {
                // Refresh session data to update attendance
                await fetchSession();
            } else {
                alert(data.error || 'Failed to join session');
            }
        } catch (error) {
            console.error('Error joining session:', error);
            alert('Failed to join session');
        } finally {
            setJoining(false);
        }
    };

    // Leave session handler (called on page unload)
    useEffect(() => {
        const handleBeforeUnload = async () => {
            if (userAccess?.isAttending) {
                await fetch(`/api/sessions/${sessionId}/leave`, {
                    method: 'POST',
                    keepalive: true // Ensure request completes even if page is closing
                });
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [sessionId, userAccess?.isAttending]);

    // Format elapsed time
    const formatElapsedTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-16 h-16 text-purple-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">{t('loadingSession')}</p>
                </div>
            </div>
        );
    }

    if (error || !sessionData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-red-400 mb-2">{tm('error.notFound')}</h2>
                    <p className="text-gray-300 mb-6">{error || tm('error.loadFailed')}</p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl transition-all"
                    >
                        {tm('backToDashboard')}
                    </button>
                </div>
            </div>
        );
    }

    // Check if session is not live
    if (sessionData.status !== 'LIVE') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
                <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 max-w-md w-full text-center">
                    <Video className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">{tm('notLive')}</h2>
                    <p className="text-gray-400 mb-2">{tm('status.' + sessionData.status.toLowerCase())}</p>
                    {sessionData.status === 'SCHEDULED' && (
                        <p className="text-gray-500 text-sm mb-6">
                            {tm('sessionInfo.scheduledFor')}: {new Date(sessionData.scheduledAt).toLocaleString()}
                        </p>
                    )}
                    {sessionData.status === 'ENDED' && (
                        <p className="text-gray-500 text-sm mb-6">
                            {tm('sessionEnded')}
                        </p>
                    )}
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl transition-all"
                    >
                        {tm('backToDashboard')}
                    </button>
                </div>
            </div>
        );
    }

    // Check if user has access
    if (!userAccess?.hasAccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
                <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 max-w-md w-full text-center">
                    <Lock className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">{tm('subscriptionRequired')}</h2>
                    <p className="text-gray-400 mb-4">
                        {tm('tierRequired', { tier: userAccess?.requiredTier || 'PREMIUM' })}
                    </p>
                    {userAccess?.userTier && (
                        <p className="text-gray-500 text-sm mb-6">
                            {tm('yourTier')}: <span className="text-blue-400">{userAccess.userTier}</span>
                        </p>
                    )}
                    <div className="flex gap-3">
                        <button
                            onClick={() => router.push(`/creators/${sessionData.creator.id}`)}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl transition-all"
                        >
                            {tm('subscribeNow')}
                        </button>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl transition-all"
                        >
                            {tm('backToDashboard')}
                        </button>
                    </div>
                </div>
            </div>
        );
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
                                <span className="text-white font-bold">{tm('live')}</span>
                            </div>
                            <h1 className="text-xl font-bold text-white">{sessionData.title}</h1>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-gray-400">
                                <Eye className="w-4 h-4" />
                                <span className="text-sm">{sessionData.viewCount} {tm('viewCount')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                                <Users className="w-4 h-4" />
                                <span className="text-sm">{sessionData.activeAttendees} {tm('activeAttendees')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm font-mono">{formatElapsedTime(sessionData.elapsedSeconds)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Video Player Area */}
                    <div className="lg:col-span-2">
                        <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden">
                            {/* Video Player */}
                            <div className="aspect-video bg-gray-900 flex items-center justify-center">
                                {!userAccess.isAttending ? (
                                    <div className="text-center p-8">
                                        <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                        <p className="text-gray-400 mb-4">{tm('videoPlayer.placeholder')}</p>
                                        <button
                                            onClick={handleJoinSession}
                                            disabled={joining}
                                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                                        >
                                            {joining ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    {tm('joining')}
                                                </>
                                            ) : (
                                                <>
                                                    <Video className="w-5 h-5" />
                                                    {tm('joinSession')}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <div className="text-center">
                                            <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                            <p className="text-gray-400 mb-2">{tm('videoPlayer.streamWillAppear')}</p>
                                            <p className="text-sm text-gray-500">{tm('chat.comingSoon')}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Session Info */}
                            <div className="p-6">
                                <h2 className="text-2xl font-bold text-white mb-2">{sessionData.title}</h2>
                                {sessionData.description && (
                                    <p className="text-gray-400 mb-4">{sessionData.description}</p>
                                )}
                                
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        {sessionData.creator.profileImage ? (
                                            <img
                                                src={sessionData.creator.profileImage}
                                                alt={sessionData.creator.name}
                                                className="w-10 h-10 rounded-full"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                                <span className="text-white font-bold">
                                                    {sessionData.creator.name[0].toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-white font-medium">{sessionData.creator.name}</p>
                                            <p className="text-gray-500 text-sm">{sessionData.creator.channelName}</p>
                                        </div>
                                    </div>

                                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                                        <Shield className="w-3 h-3" />
                                        {sessionData.tier}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden">
                            <div className="border-b border-gray-700 p-4">
                                <h3 className="text-white font-bold flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5" />
                                    {tm('chat.title')}
                                </h3>
                            </div>
                            
                            <div className="h-[500px] p-4">
                                <div className="text-center text-gray-400 py-8">
                                    <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                                    <p className="text-sm">{tm('chat.placeholder')}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {tm('chat.comingSoon')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
