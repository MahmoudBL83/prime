'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { 
    Plus,
    FileText,
    Eye,
    Heart,
    MessageSquare,
    Calendar,
    Edit,
    Trash2,
    Clock,
    CheckCircle
} from 'lucide-react';

interface Post {
    id: string;
    title: string;
    content: string;
    type: string;
    tier: string;
    channelName?: string;
    viewCount: number;
    likesCount: number;
    commentsCount: number;
    publishedAt: string | null;
    scheduledFor: string | null;
    createdAt: string;
    isDraft: boolean;
}

type FilterType = 'all' | 'draft' | 'scheduled' | 'published';

export default function PostsListPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const t = useTranslations('creator.posts');
    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useState<Post[]>([]);
    const [filter, setFilter] = useState<FilterType>('all');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        } else if (session?.user?.role !== 'CREATOR') {
            router.push('/dashboard');
        } else {
            loadPosts();
        }
    }, [status, session, router, filter]);

    const loadPosts = async () => {
        try {
            setLoading(true);
            const statusParam = filter === 'all' ? '' : `?status=${filter}`;
            const response = await fetch(`/api/creator/posts${statusParam}`);
            const data = await response.json();

            if (response.ok) {
                setPosts(data.posts);
            }
        } catch (error) {
            console.error('Error loading posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (postId: string) => {
        try {
            const response = await fetch(`/api/creator/posts/${postId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setPosts(posts.filter(p => p.id !== postId));
                setDeleteConfirm(null);
                alert('Post deleted successfully');
            } else {
                alert('Failed to delete post');
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('Error deleting post');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (post: Post) => {
        if (post.isDraft) {
            return (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-600">
                    {t('drafts')}
                </span>
            );
        } else if (post.scheduledFor) {
            return (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {t('scheduled')}
                </span>
            );
        } else if (post.publishedAt) {
            return (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {t('published')}
                </span>
            );
        }
    };

    const getTierBadge = (tier: string) => {
        const colors: Record<string, string> = {
            BRONZE: 'bg-amber-500/10 text-amber-400 border-amber-600',
            SILVER: 'bg-gray-400/10 text-gray-300 border-gray-500',
            GOLD: 'bg-yellow-500/10 text-yellow-400 border-yellow-600',
            ALL: 'bg-purple-500/10 text-purple-400 border-purple-600'
        };

        return (
            <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${colors[tier] || colors.ALL}`}>
                {tier}
            </span>
        );
    };

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading posts...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                            {t('myPosts')}
                        </h1>
                        <p className="text-gray-400">{t('subtitle')}</p>
                    </div>
                    <button
                        onClick={() => router.push('/creator/content/posts/new')}
                        className="bg-gradient-to-r from-purple-500 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-600 hover:to-blue-700 transition-all duration-300 flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        {t('createPost')}
                    </button>
                </div>

                {/* Filters */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {(['all', 'published', 'scheduled', 'draft'] as FilterType[]).map((filterType) => (
                        <button
                            key={filterType}
                            onClick={() => setFilter(filterType)}
                            className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${
                                filter === filterType
                                    ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white'
                                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                            }`}
                        >
                            {filterType === 'all' ? 'All Posts' : t(filterType)}
                        </button>
                    ))}
                </div>

                {/* Posts Grid */}
                {posts.length === 0 ? (
                    <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-12 text-center">
                        <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">{t('noPostsYet')}</h3>
                        <p className="text-gray-400 mb-6">{t('createFirstPost')}</p>
                        <button
                            onClick={() => router.push('/creator/content/posts/new')}
                            className="bg-gradient-to-r from-purple-500 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-600 hover:to-blue-700 transition-all duration-300 inline-flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            {t('createPost')}
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {posts.map((post) => (
                            <div
                                key={post.id}
                                className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-bold text-white">{post.title}</h3>
                                            {getStatusBadge(post)}
                                            {getTierBadge(post.tier)}
                                        </div>
                                        <p className="text-gray-400 line-clamp-2 mb-3">{post.content}</p>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <FileText className="w-4 h-4" />
                                                {post.type}
                                            </span>
                                            {post.channelName && (
                                                <span>• {post.channelName}</span>
                                            )}
                                            <span>
                                                • {post.publishedAt 
                                                    ? formatDate(post.publishedAt) 
                                                    : post.scheduledFor 
                                                    ? `Scheduled: ${formatDate(post.scheduledFor)}`
                                                    : formatDate(post.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
                                    <div className="flex items-center gap-6 text-sm text-gray-400">
                                        <span className="flex items-center gap-2">
                                            <Eye className="w-4 h-4" />
                                            {post.viewCount} {t('views')}
                                        </span>
                                        <span className="flex items-center gap-2">
                                            <Heart className="w-4 h-4" />
                                            {post.likesCount} {t('likes')}
                                        </span>
                                        <span className="flex items-center gap-2">
                                            <MessageSquare className="w-4 h-4" />
                                            {post.commentsCount} {t('comments')}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => router.push(`/creator/content/posts/${post.id}/edit`)}
                                            className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all duration-300"
                                            title={t('edit')}
                                        >
                                            <Edit className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirm(post.id)}
                                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-300"
                                            title={t('delete')}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
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
                            <h3 className="text-2xl font-bold text-white mb-4">Confirm Delete</h3>
                            <p className="text-gray-400 mb-6">
                                Are you sure you want to delete this post? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleDelete(deleteConfirm)}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300"
                                >
                                    Delete
                                </button>
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
