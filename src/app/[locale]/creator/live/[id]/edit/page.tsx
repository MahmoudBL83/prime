'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Calendar, Clock, Shield, Users, ArrowLeft } from 'lucide-react';

interface LiveSession {
    id: string;
    title: string;
    titleAr?: string;
    description?: string;
    descriptionAr?: string;
    scheduledAt: string;
    duration: number;
    tier: string;
    maxAttendees?: number;
    status: string;
}

export default function EditLiveSessionPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const sessionId = params.id as string;
    const t = useTranslations('creator.liveSessions');
    
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [originalSession, setOriginalSession] = useState<LiveSession | null>(null);
    
    const [formData, setFormData] = useState({
        title: '',
        titleAr: '',
        description: '',
        descriptionAr: '',
        scheduledAt: '',
        duration: 60,
        tier: 'BRONZE' as 'BRONZE' | 'SILVER' | 'GOLD' | 'ALL',
        maxAttendees: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

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
        }
    }, [status, sessionId]);

    const fetchSession = async () => {
        try {
            const response = await fetch(`/api/creator/live-sessions/${sessionId}`);
            const data = await response.json();

            if (response.ok) {
                const sess = data.session;
                setOriginalSession(sess);
                
                // Convert scheduledAt to datetime-local format
                const scheduledDate = new Date(sess.scheduledAt);
                const localDateTime = new Date(scheduledDate.getTime() - scheduledDate.getTimezoneOffset() * 60000)
                    .toISOString()
                    .slice(0, 16);

                setFormData({
                    title: sess.title || '',
                    titleAr: sess.titleAr || '',
                    description: sess.description || '',
                    descriptionAr: sess.descriptionAr || '',
                    scheduledAt: localDateTime,
                    duration: sess.duration || 60,
                    tier: sess.tier || 'BRONZE',
                    maxAttendees: sess.maxAttendees?.toString() || '',
                });
            } else {
                alert('Session not found');
                router.push('/creator/live');
            }
        } catch (error) {
            console.error('Error fetching session:', error);
            alert('Failed to load session');
            router.push('/creator/live');
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.title.trim()) {
            newErrors.title = 'English title is required';
        }
        if (!formData.titleAr.trim()) {
            newErrors.titleAr = 'Arabic title is required';
        }
        if (!formData.scheduledAt) {
            newErrors.scheduledAt = 'Scheduled date and time are required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setSubmitting(true);

        try {
            const payload: any = {
                title: formData.title,
                titleAr: formData.titleAr,
                scheduledAt: new Date(formData.scheduledAt).toISOString(),
                duration: formData.duration,
                tier: formData.tier,
            };

            if (formData.description) payload.description = formData.description;
            if (formData.descriptionAr) payload.descriptionAr = formData.descriptionAr;
            if (formData.maxAttendees) payload.maxAttendees = parseInt(formData.maxAttendees);

            const response = await fetch(`/api/creator/live-sessions/${sessionId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Session updated successfully!');
                router.push('/creator/live');
            } else {
                alert(data.error || 'Failed to update session');
            }
        } catch (error) {
            console.error('Error updating session:', error);
            alert('Failed to update session');
        } finally {
            setSubmitting(false);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading session...</p>
                </div>
            </div>
        );
    }

    if (!originalSession) {
        return null;
    }

    // Prevent editing LIVE or ENDED sessions
    if (originalSession.status === 'LIVE' || originalSession.status === 'ENDED') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
                        <h2 className="text-2xl font-bold text-red-400 mb-4">Cannot Edit Session</h2>
                        <p className="text-gray-300 mb-6">
                            You cannot edit a session that is currently {originalSession.status.toLowerCase()}.
                        </p>
                        <button
                            onClick={() => router.push('/creator/live')}
                            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl transition-all"
                        >
                            Back to Sessions
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push('/creator/live')}
                        className="text-gray-400 hover:text-white mb-4 flex items-center gap-2 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Sessions
                    </button>
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400">
                        Edit Live Session
                    </h1>
                    <p className="text-gray-400 mt-2">Update your session details</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title (English) */}
                    <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                        <label className="block text-white font-medium mb-2">
                            Session Title (English) *
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g., Introduction to React Hooks"
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                        />
                        {errors.title && <p className="text-red-400 text-sm mt-2">{errors.title}</p>}
                    </div>

                    {/* Title (Arabic) */}
                    <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                        <label className="block text-white font-medium mb-2">
                            Session Title (Arabic) *
                        </label>
                        <input
                            type="text"
                            value={formData.titleAr}
                            onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                            placeholder="مقدمة إلى React Hooks"
                            dir="rtl"
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                        />
                        {errors.titleAr && <p className="text-red-400 text-sm mt-2">{errors.titleAr}</p>}
                    </div>

                    {/* Description (English) */}
                    <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                        <label className="block text-white font-medium mb-2">
                            Description (English)
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="What will you cover in this session?"
                            rows={6}
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                        />
                    </div>

                    {/* Description (Arabic) */}
                    <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                        <label className="block text-white font-medium mb-2">
                            Description (Arabic)
                        </label>
                        <textarea
                            value={formData.descriptionAr}
                            onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                            placeholder="ماذا ستغطي في هذه الجلسة؟"
                            rows={6}
                            dir="rtl"
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                        />
                    </div>

                    {/* Scheduled Date/Time */}
                    <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                        <label className="block text-white font-medium mb-2 flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Scheduled Date & Time *
                        </label>
                        <input
                            type="datetime-local"
                            value={formData.scheduledAt}
                            onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                            min={new Date().toISOString().slice(0, 16)}
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                        />
                        {errors.scheduledAt && <p className="text-red-400 text-sm mt-2">{errors.scheduledAt}</p>}
                    </div>

                    {/* Duration */}
                    <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                        <label className="block text-white font-medium mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            Duration *
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[30, 60, 90, 120].map((duration) => (
                                <button
                                    key={duration}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, duration })}
                                    className={`p-4 rounded-xl border-2 transition-all ${
                                        formData.duration === duration
                                            ? 'border-purple-500 bg-purple-500/20 text-white'
                                            : 'border-gray-700 hover:border-gray-600 text-gray-400'
                                    }`}
                                >
                                    <div className="text-2xl font-bold">{duration}</div>
                                    <div className="text-xs">minutes</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tier */}
                    <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                        <label className="block text-white font-medium mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Access Tier *
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                { tier: 'BRONZE', gradient: 'from-amber-600 to-orange-700' },
                                { tier: 'SILVER', gradient: 'from-gray-400 to-gray-600' },
                                { tier: 'GOLD', gradient: 'from-yellow-400 to-yellow-600' },
                                { tier: 'ALL', gradient: 'from-purple-500 to-pink-600' },
                            ].map(({ tier, gradient }) => (
                                <button
                                    key={tier}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, tier: tier as any })}
                                    className={`p-4 rounded-xl border-2 transition-all ${
                                        formData.tier === tier
                                            ? `border-transparent bg-gradient-to-r ${gradient} text-white font-bold shadow-lg`
                                            : 'border-gray-700 hover:border-gray-600 text-gray-400'
                                    }`}
                                >
                                    <Shield className="w-6 h-6 mx-auto mb-1" />
                                    <div className="text-sm">{tier}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Max Attendees */}
                    <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                        <label className="block text-white font-medium mb-2 flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Max Attendees (Optional)
                        </label>
                        <input
                            type="number"
                            value={formData.maxAttendees}
                            onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value })}
                            placeholder="Leave empty for unlimited"
                            min="1"
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-purple-500/20"
                    >
                        {submitting ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Updating Session...
                            </span>
                        ) : (
                            'Update Session'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
