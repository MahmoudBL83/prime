'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { 
    FileText, 
    Video, 
    Megaphone, 
    MessageSquare, 
    FileDown,
    Calendar,
    Upload,
    Image as ImageIcon,
    Save,
    Send,
    Clock,
    X,
    ArrowLeft
} from 'lucide-react';

type PostType = 'TEXT' | 'VIDEO' | 'IMAGE' | 'DOCUMENT' | 'POLL' | 'ANNOUNCEMENT';
type TierType = 'BRONZE' | 'SILVER' | 'GOLD' | 'ALL';

interface PostFormData {
    title: string;
    content: string;
    type: PostType;
    tier: TierType;
    mediaUrl: string;
    thumbnailUrl: string;
    scheduledFor: string;
    publishedAt: string | null;
}

export default function EditPostPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const postId = params.id as string;
    const t = useTranslations('creator.posts');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [showScheduler, setShowScheduler] = useState(false);
    
    const [formData, setFormData] = useState<PostFormData>({
        title: '',
        content: '',
        type: 'TEXT',
        tier: 'ALL',
        mediaUrl: '',
        thumbnailUrl: '',
        scheduledFor: '',
        publishedAt: null
    });

    const [errors, setErrors] = useState<Partial<Record<keyof PostFormData, string>>>({});

    // Fetch existing post data
    useEffect(() => {
        const fetchPost = async () => {
            if (!postId) return;
            
            try {
                const response = await fetch(`/api/creator/posts/${postId}`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch post');
                }

                setFormData({
                    title: data.post.title || '',
                    content: data.post.content || '',
                    type: data.post.type || 'TEXT',
                    tier: data.post.tier || 'ALL',
                    mediaUrl: data.post.mediaUrl || '',
                    thumbnailUrl: data.post.thumbnailUrl || '',
                    scheduledFor: data.post.scheduledFor 
                        ? new Date(data.post.scheduledFor).toISOString().slice(0, 16) 
                        : '',
                    publishedAt: data.post.publishedAt
                });

                if (data.post.scheduledFor && !data.post.publishedAt) {
                    setShowScheduler(true);
                }
            } catch (error) {
                console.error('Error fetching post:', error);
                alert('Failed to load post');
                router.push('/creator/content/posts');
            } finally {
                setFetching(false);
            }
        };

        if (status === 'authenticated') {
            fetchPost();
        }
    }, [postId, status, router]);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        } else if (session?.user?.role !== 'CREATOR') {
            router.push('/dashboard');
        }
    }, [status, session, router]);

    const postTypes: { value: PostType; icon: any; label: string }[] = [
        { value: 'TEXT', icon: FileText, label: 'Article' },
        { value: 'VIDEO', icon: Video, label: 'Video' },
        { value: 'IMAGE', icon: ImageIcon, label: 'Image' },
        { value: 'DOCUMENT', icon: FileDown, label: 'Document' },
        { value: 'ANNOUNCEMENT', icon: Megaphone, label: 'Announcement' },
        { value: 'POLL', icon: MessageSquare, label: 'Poll' },
    ];

    const tierOptions: { value: TierType; label: string; color: string }[] = [
        { value: 'BRONZE', label: t('tiers.bronze'), color: 'from-amber-600 to-orange-600' },
        { value: 'SILVER', label: t('tiers.silver'), color: 'from-gray-400 to-gray-600' },
        { value: 'GOLD', label: t('tiers.gold'), color: 'from-yellow-400 to-yellow-600' },
        { value: 'ALL', label: t('tiers.all'), color: 'from-purple-500 to-blue-500' },
    ];

    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof PostFormData, string>> = {};

        if (!formData.title.trim()) {
            newErrors.title = t('validation.titleRequired');
        }
        if (!formData.content.trim()) {
            newErrors.content = t('validation.contentRequired');
        }
        if (!formData.type) {
            newErrors.type = t('validation.typeRequired');
        }
        if (!formData.tier) {
            newErrors.tier = t('validation.tierRequired');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (action: 'update' | 'publish' | 'schedule') => {
        if (!validateForm()) return;

        // Prevent scheduling already published posts
        if (action === 'schedule' && formData.publishedAt) {
            alert('Cannot schedule a post that is already published');
            return;
        }

        setLoading(true);
        try {
            const payload: any = {
                title: formData.title,
                content: formData.content,
                type: formData.type,
                tier: formData.tier,
                mediaUrl: formData.mediaUrl || undefined,
                thumbnailUrl: formData.thumbnailUrl || undefined,
            };

            if (action === 'publish') {
                payload.publish = true;
                payload.scheduledFor = null;
            } else if (action === 'schedule') {
                if (!formData.scheduledFor) {
                    alert('Please select a schedule date and time');
                    setLoading(false);
                    return;
                }
                payload.scheduledFor = new Date(formData.scheduledFor).toISOString();
                payload.publish = false;
            }

            const response = await fetch(`/api/creator/posts/${postId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update post');
            }

            // Show success message
            const successMessage = action === 'publish' 
                ? 'Post published successfully'
                : action === 'schedule' 
                ? t('scheduledSuccess') 
                : 'Post updated successfully';

            alert(successMessage);
            router.push('/creator/content/posts');

        } catch (error) {
            console.error('Error updating post:', error);
            alert('Failed to update post');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'loading' || fetching) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading post...</p>
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
                        {t('editPost')}
                    </h1>
                    <p className="text-gray-400">Update your post content and settings</p>
                </div>

                {/* Main Form */}
                <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 md:p-8 space-y-6">
                    
                    {/* Published Status Badge */}
                    {formData.publishedAt && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-green-400">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-sm font-medium">
                                    Published on {new Date(formData.publishedAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t('postTitle')} <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder={t('placeholder.title')}
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
                    </div>

                    {/* Post Type Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                            {t('postType')} <span className="text-red-400">*</span>
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {postTypes.map((type) => {
                                const Icon = type.icon;
                                return (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: type.value })}
                                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300 ${
                                            formData.type === type.value
                                                ? 'border-purple-500 bg-purple-500/10 text-white'
                                                : 'border-gray-700 bg-gray-800/30 text-gray-400 hover:border-gray-600'
                                        }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="font-medium text-sm">{type.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                        {errors.type && <p className="text-red-400 text-sm mt-1">{errors.type}</p>}
                    </div>

                    {/* Tier Access */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                            {t('tierAccess')} <span className="text-red-400">*</span>
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
                                    <div className={`font-bold mb-1 ${
                                        formData.tier === tier.value ? 'text-white' : 'text-gray-400'
                                    }`}>
                                        {tier.value}
                                    </div>
                                    <div className="text-xs text-gray-500">{tier.label}</div>
                                </button>
                            ))}
                        </div>
                        {errors.tier && <p className="text-red-400 text-sm mt-1">{errors.tier}</p>}
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t('postContent')} <span className="text-red-400">*</span>
                        </label>
                        <textarea
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            placeholder={t('placeholder.content')}
                            rows={12}
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        />
                        {errors.content && <p className="text-red-400 text-sm mt-1">{errors.content}</p>}
                    </div>

                    {/* Media URLs */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                {t('addVideo')} / {t('addImage')}
                            </label>
                            <div className="relative">
                                <Upload className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="url"
                                    value={formData.mediaUrl}
                                    onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                                    placeholder="https://example.com/video.mp4"
                                    className="w-full bg-gray-900/50 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Thumbnail URL
                            </label>
                            <div className="relative">
                                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="url"
                                    value={formData.thumbnailUrl}
                                    onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                                    placeholder="https://example.com/thumbnail.jpg"
                                    className="w-full bg-gray-900/50 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Schedule Section (Only for unpublished posts) */}
                    {!formData.publishedAt && showScheduler && (
                        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-medium text-purple-300 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    {t('scheduleDate')}
                                </label>
                                <button
                                    onClick={() => setShowScheduler(false)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <input
                                type="datetime-local"
                                value={formData.scheduledFor}
                                onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                                className="w-full bg-gray-900/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-700/50">
                        <button
                            onClick={() => handleSubmit('update')}
                            disabled={loading}
                            className="flex-1 min-w-[200px] bg-gradient-to-r from-purple-500 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-600 hover:to-blue-700 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save className="w-5 h-5" />
                            )}
                            {t('update')}
                        </button>

                        {!formData.publishedAt && (
                            <>
                                <button
                                    onClick={() => handleSubmit('publish')}
                                    disabled={loading}
                                    className="flex-1 min-w-[200px] bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <Send className="w-5 h-5" />
                                    {t('publishNow')}
                                </button>

                                <button
                                    onClick={() => setShowScheduler(!showScheduler)}
                                    disabled={loading}
                                    className="flex-1 min-w-[200px] bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                    <Clock className="w-5 h-5" />
                                    {showScheduler ? 'Cancel Schedule' : t('scheduleLater')}
                                </button>

                                {showScheduler && (
                                    <button
                                        onClick={() => handleSubmit('schedule')}
                                        disabled={loading}
                                        className="flex-1 min-w-[200px] bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-6 py-3 rounded-xl font-medium hover:from-yellow-600 hover:to-orange-700 transition-all duration-300 flex items-center justify-center gap-2"
                                    >
                                        <Calendar className="w-5 h-5" />
                                        Confirm Schedule
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
