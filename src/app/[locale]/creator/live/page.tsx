'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { 
    Plus,
    Calendar,
    Clock,
    Users,
    Eye,
    Edit,
    Trash2,
    Play,
    StopCircle,
    X,
    Video,
    Shield,
    Loader2
} from 'lucide-react';
import { CreatorSidebar, CreatorHeader } from '@/components/creator';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic'

interface LiveSession {
    id: string;
    title: string;
    description?: string;
    scheduledAt: string;
    duration: number;
    status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';
    tier: string;
    maxAttendees?: number;
    actualStartAt?: string;
    actualEndAt?: string;
    viewCount: number;
    attendeeCount: number;
    activeAttendees: number;
    channelName: string;
    createdAt: string;
}

type FilterType = 'all' | 'scheduled' | 'live' | 'ended';

export default function LiveSessionsListPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const t = useTranslations('creator.liveSessions');
    const [loading, setLoading] = useState(true);
    const [sessions, setSessions] = useState<LiveSession[]>([]);
    const [filter, setFilter] = useState<FilterType>('all');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        } else if (session?.user?.role !== 'CREATOR') {
            router.push('/dashboard');
        }
    }, [status, session, router]);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchSessions();
        }
    }, [status, filter]);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const url = filter === 'all' 
                ? '/api/creator/live-sessions'
                : `/api/creator/live-sessions?status=${filter}`;
            
            const response = await fetch(url);
            const data = await response.json();

            if (response.ok) {
                setSessions(data.sessions || []);
            } else {
                console.error('Failed to fetch sessions:', data.error);
            }
        } catch (error) {
            console.error('Error fetching sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (sessionId: string) => {
        try {
            const response = await fetch(`/api/creator/live-sessions/${sessionId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setSessions(sessions.filter((s) => s.id !== sessionId));
                setDeleteConfirm(null);
                alert('Session deleted successfully');
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to delete session');
            }
        } catch (error) {
            console.error('Error deleting session:', error);
            alert('Failed to delete session');
        }
    };

    const handleStartSession = async (sessionId: string) => {
        try {
            const response = await fetch(`/api/creator/live-sessions/${sessionId}/start`, {
                method: 'POST',
            });

            const data = await response.json();

            if (response.ok) {
                alert('Session started! Redirecting to live room...');
                router.push(`/creator/live/${sessionId}`);
            } else {
                alert(data.error || 'Failed to start session');
            }
        } catch (error) {
            console.error('Error starting session:', error);
            alert('Failed to start session');
        }
    };

    const handleCancelSession = async (sessionId: string) => {
        if (!confirm('Are you sure you want to cancel this session?')) return;

        try {
            const response = await fetch(`/api/creator/live-sessions/${sessionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'CANCELLED' }),
            });

            if (response.ok) {
                fetchSessions();
                alert('Session cancelled');
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to cancel session');
            }
        } catch (error) {
            console.error('Error cancelling session:', error);
            alert('Failed to cancel session');
        }
    };

    const getStatusBadge = (session: LiveSession) => {
        const statusConfig = {
            SCHEDULED: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', label: 'Scheduled' },
            LIVE: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', label: 'Live Now' },
            ENDED: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30', label: 'Ended' },
            CANCELLED: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30', label: 'Cancelled' },
        };

        const config = statusConfig[session.status];
        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
                {session.status === 'LIVE' && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                {config.label}
            </span>
        );
    };

    const getTierBadge = (tier: string) => {
        const tierColors = {
            BRONZE: 'from-amber-600 to-orange-600',
            SILVER: 'from-gray-400 to-gray-600',
            GOLD: 'from-yellow-400 to-yellow-600',
        };

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-gradient-to-r ${tierColors[tier as keyof typeof tierColors] || tierColors.BRONZE} text-white`}>
                <Shield className="w-3 h-3" />
                {tier}
            </span>
        );
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredSessions = sessions.filter((session) => {
        if (filter === 'all') return true;
        return session.status.toLowerCase() === filter;
    });

    const params = useParams();
    const locale = params.locale as string;
    const isArabic = locale === 'ar';

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen bg-background">
                <CreatorHeader title="Live Sessions" titleAr="الجلسات المباشرة" />
                <div className="flex">
                    <CreatorSidebar />
                    <main className="flex-1 p-8 flex items-center justify-center">
                        <div className="text-center">
                            <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-purple-500" />
                            <p className="text-muted-foreground">{isArabic ? 'جاري التحميل...' : 'Loading sessions...'}</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <CreatorHeader 
                title="Live Sessions" 
                titleAr="الجلسات المباشرة"
                rightContent={
                    <Button
                        onClick={() => router.push(`/${locale}/creator/live/schedule`)}
                        className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        {isArabic ? 'جدولة جلسة' : 'Schedule Session'}
                    </Button>
                }
            />
            
            <div className="flex">
                <CreatorSidebar />
                
                <main className="flex-1 p-8">
                    {/* Page Description */}
                    <div className="mb-8">
                        <p className="text-muted-foreground">
                            {isArabic ? 'إدارة جلسات البث المباشر الخاصة بك' : 'Manage your live streaming sessions'}
                        </p>
                    </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {[
                        { key: 'all', label: 'All Sessions' },
                        { key: 'scheduled', label: 'Scheduled' },
                        { key: 'live', label: 'Live Now' },
                        { key: 'ended', label: 'Past Sessions' },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key as FilterType)}
                            className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${
                                filter === tab.key
                                    ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white'
                                    : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Sessions List */}
                {filteredSessions.length === 0 ? (
                    <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-12 text-center">
                        <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No sessions yet</h3>
                        <p className="text-gray-400 mb-6">
                            Schedule your first live session to engage with your members
                        </p>
                        <button
                            onClick={() => router.push('/creator/live/schedule')}
                            className="bg-gradient-to-r from-purple-500 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-600 hover:to-blue-700 transition-all duration-300 inline-flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Schedule First Session
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {filteredSessions.map((session) => (
                            <div
                                key={session.id}
                                className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-bold text-white">{session.title}</h3>
                                            {getStatusBadge(session)}
                                            {getTierBadge(session.tier)}
                                        </div>
                                        {session.description && (
                                            <p className="text-gray-400 line-clamp-2 mb-3">{session.description}</p>
                                        )}
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                {formatDate(session.scheduledAt)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {session.duration} minutes
                                            </span>
                                            {session.maxAttendees && (
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-4 h-4" />
                                                    Max: {session.maxAttendees}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
                                    <div className="flex items-center gap-6 text-sm text-gray-400">
                                        <span className="flex items-center gap-2">
                                            <Eye className="w-4 h-4" />
                                            {session.viewCount} views
                                        </span>
                                        <span className="flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            {session.attendeeCount} attended
                                        </span>
                                        {session.status === 'LIVE' && (
                                            <span className="flex items-center gap-2 text-green-400">
                                                <Users className="w-4 h-4" />
                                                {session.activeAttendees} watching now
                                            </span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        {session.status === 'SCHEDULED' && (
                                            <>
                                                <button
                                                    onClick={() => handleStartSession(session.id)}
                                                    className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-all duration-300"
                                                    title="Start Session"
                                                >
                                                    <Play className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => router.push(`/creator/live/${session.id}/edit`)}
                                                    className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all duration-300"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleCancelSession(session.id)}
                                                    className="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 rounded-lg transition-all duration-300"
                                                    title="Cancel"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </>
                                        )}
                                        {session.status === 'LIVE' && (
                                            <button
                                                onClick={() => router.push(`/creator/live/${session.id}`)}
                                                className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg font-medium hover:from-red-600 hover:to-pink-700 transition-all duration-300 flex items-center gap-2"
                                            >
                                                <Video className="w-4 h-4" />
                                                Go Live
                                            </button>
                                        )}
                                        {(session.status === 'ENDED' || session.status === 'CANCELLED') && (
                                            <button
                                                onClick={() => setDeleteConfirm(session.id)}
                                                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-300"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deleteConfirm && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 max-w-md w-full">
                            <h3 className="text-2xl font-bold text-white mb-4">{isArabic ? 'تأكيد الحذف' : 'Confirm Delete'}</h3>
                            <p className="text-gray-400 mb-6">
                                {isArabic 
                                    ? 'هل أنت متأكد أنك تريد حذف هذه الجلسة؟ لا يمكن التراجع عن هذا الإجراء.'
                                    : 'Are you sure you want to delete this session? This action cannot be undone.'}
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleDelete(deleteConfirm)}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300"
                                >
                                    {isArabic ? 'حذف' : 'Delete'}
                                </button>
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300"
                                >
                                    {isArabic ? 'إلغاء' : 'Cancel'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                </main>
            </div>
        </div>
    );
}
