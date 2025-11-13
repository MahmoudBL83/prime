'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { 
    Calendar,
    Clock,
    Users,
    Shield,
    Video,
    ArrowLeft,
    Save,
    Send
} from 'lucide-react';

type TierType = 'BRONZE' | 'SILVER' | 'GOLD' | 'ALL';

interface SessionFormData {
    title: string;
    description: string;
    scheduledAt: string;
    duration: number;
    tier: TierType;
    maxAttendees: number;
}

export default function ScheduleLiveSessionPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const t = useTranslations('creator.liveSessions');
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState<SessionFormData>({
        title: '',
        description: '',
        scheduledAt: '',
        duration: 60,
        tier: 'BRONZE',
        maxAttendees: 100,
    });

    const [errors, setErrors] = useState<Partial<Record<keyof SessionFormData, string>>>({});

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        } else if (session?.user?.role !== 'CREATOR') {
            router.push('/dashboard');
        }
    }, [status, session, router]);

    const tierOptions: { value: TierType; label: string; color: string; description: string }[] = [
        { value: 'BRONZE', label: 'Bronze Tier', color: 'from-amber-600 to-orange-600', description: 'Basic members' },
        { value: 'SILVER', label: 'Silver Tier', color: 'from-gray-400 to-gray-600', description: 'Premium members' },
        { value: 'GOLD', label: 'Gold Tier', color: 'from-yellow-400 to-yellow-600', description: 'VIP members' },
        { value: 'ALL', label: 'All Members', color: 'from-purple-500 to-blue-500', description: 'Everyone' },
    ];

    const durationOptions = [
        { value: 15, label: '15 minutes' },
        { value: 30, label: '30 minutes' },
        { value: 45, label: '45 minutes' },
        { value: 60, label: '1 hour' },
        { value: 90, label: '1.5 hours' },
        { value: 120, label: '2 hours' },
        { value: 180, label: '3 hours' },
        { value: 240, label: '4 hours' },
    ];

    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof SessionFormData, string>> = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Session title is required';
        } else if (formData.title.length < 3) {
            newErrors.title = 'Title must be at least 3 characters';
        }

        if (!formData.scheduledAt) {
            newErrors.scheduledAt = 'Please select a date and time';
        } else {
            const scheduledDate = new Date(formData.scheduledAt);
            if (scheduledDate <= new Date()) {
                newErrors.scheduledAt = 'Scheduled time must be in the future';
            }
        }

        if (!formData.duration || formData.duration < 15) {
            newErrors.duration = 'Duration must be at least 15 minutes';
        }

        if (formData.maxAttendees < 1) {
            newErrors.maxAttendees = 'Must allow at least 1 attendee';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            const payload = {
                title: formData.title,
                description: formData.description || undefined,
                scheduledAt: new Date(formData.scheduledAt).toISOString(),
                duration: formData.duration,
                tier: formData.tier === 'ALL' ? 'BRONZE' : formData.tier,
                maxAttendees: formData.maxAttendees,
            };

            const response = await fetch('/api/creator/live-sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to schedule session');
            }

            alert('Live session scheduled successfully!');
            router.push('/creator/live');

        } catch (error) {
            console.error('Error scheduling session:', error);
            alert(error instanceof Error ? error.message : 'Failed to schedule session');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back
                    </button>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        Schedule Live Session
                    </h1>
                    <p className="text-gray-400">Create a new live session for your members</p>
                </div>

                {/* Main Form */}
                <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 md:p-8 space-y-6">
                    
                    {/* Session Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Session Title <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g., Web Development Q&A Session"
                                className="w-full bg-gray-900/50 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                        {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe what you'll cover in this session..."
                            rows={4}
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        />
                    </div>

                    {/* Schedule Date & Time */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Schedule Date & Time <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="datetime-local"
                                value={formData.scheduledAt}
                                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                                min={new Date().toISOString().slice(0, 16)}
                                className="w-full bg-gray-900/50 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                        {errors.scheduledAt && <p className="text-red-400 text-sm mt-1">{errors.scheduledAt}</p>}
                    </div>

                    {/* Duration */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Duration <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <select
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                                className="w-full bg-gray-900/50 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none cursor-pointer"
                            >
                                {durationOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {errors.duration && <p className="text-red-400 text-sm mt-1">{errors.duration}</p>}
                    </div>

                    {/* Tier Access */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                            Minimum Tier Access <span className="text-red-400">*</span>
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {tierOptions.map((tier) => (
                                <button
                                    key={tier.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, tier: tier.value })}
                                    className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                                        formData.tier === tier.value
                                            ? `border-purple-500 bg-gradient-to-r ${tier.color} bg-opacity-20`
                                            : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                                    }`}
                                >
                                    <div className={`flex items-center gap-2 mb-1 ${
                                        formData.tier === tier.value ? 'text-white' : 'text-gray-400'
                                    }`}>
                                        <Shield className="w-4 h-4" />
                                        <span className="font-bold text-sm">{tier.value}</span>
                                    </div>
                                    <div className="text-xs text-gray-500">{tier.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Max Attendees */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Maximum Attendees
                        </label>
                        <div className="relative">
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="number"
                                value={formData.maxAttendees}
                                onChange={(e) => setFormData({ ...formData, maxAttendees: Number(e.target.value) })}
                                min={1}
                                max={10000}
                                className="w-full bg-gray-900/50 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                        <p className="text-gray-500 text-sm mt-1">Leave blank for unlimited attendees</p>
                        {errors.maxAttendees && <p className="text-red-400 text-sm mt-1">{errors.maxAttendees}</p>}
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <Video className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="text-blue-300 font-medium mb-1">Live Streaming Info</h4>
                                <p className="text-gray-400 text-sm">
                                    When you start your session, you'll receive streaming credentials (RTMP URL and Stream Key). 
                                    Use OBS, Streamlabs, or any streaming software to broadcast your session.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-700/50">
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-1 min-w-[200px] bg-gradient-to-r from-purple-500 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-600 hover:to-blue-700 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                            Schedule Session
                        </button>

                        <button
                            onClick={() => router.back()}
                            disabled={loading}
                            className="flex-1 min-w-[200px] bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
