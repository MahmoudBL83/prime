'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Bookmark, Plus, Trash2, Clock, X, Save
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface VideoBookmark {
    id: string;
    timestamp: number;
    title: string;
    createdAt: string;
}

interface VideoBookmarksProps {
    lessonId: string;
    currentTime: number;
    onSeekTo: (time: number) => void;
    isArabic?: boolean;
}

export default function VideoBookmarks({
    lessonId,
    currentTime,
    onSeekTo,
    isArabic = false,
}: VideoBookmarksProps) {
    const [bookmarks, setBookmarks] = useState<VideoBookmark[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddingBookmark, setIsAddingBookmark] = useState(false);
    const [newBookmarkTitle, setNewBookmarkTitle] = useState('');

    useEffect(() => {
        loadBookmarks();
    }, [lessonId]);

    const loadBookmarks = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/lessons/${lessonId}/bookmarks`);
            if (response.ok) {
                const data = await response.json();
                setBookmarks(data.bookmarks || []);
            }
        } catch (error) {
            console.error('Error loading bookmarks:', error);
            toast.error(isArabic ? 'فشل تحميل الإشارات المرجعية' : 'Failed to load bookmarks');
        } finally {
            setLoading(false);
        }
    };

    const createBookmark = async () => {
        if (!newBookmarkTitle.trim()) {
            toast.error(isArabic ? 'الرجاء إدخال عنوان' : 'Please enter a title');
            return;
        }

        try {
            const response = await fetch(`/api/lessons/${lessonId}/bookmarks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timestamp: Math.floor(currentTime),
                    title: newBookmarkTitle,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setBookmarks(prev => [...prev, data.bookmark].sort((a, b) => a.timestamp - b.timestamp));
                setNewBookmarkTitle('');
                setIsAddingBookmark(false);
                toast.success(isArabic ? 'تم إضافة الإشارة المرجعية' : 'Bookmark added');
            } else {
                throw new Error('Failed to create bookmark');
            }
        } catch (error) {
            console.error('Error creating bookmark:', error);
            toast.error(isArabic ? 'فشل إضافة الإشارة المرجعية' : 'Failed to add bookmark');
        }
    };

    const deleteBookmark = async (bookmarkId: string) => {
        if (!confirm(isArabic ? 'هل تريد حذف هذه الإشارة المرجعية؟' : 'Delete this bookmark?')) {
            return;
        }

        try {
            const response = await fetch(`/api/lessons/${lessonId}/bookmarks?bookmarkId=${bookmarkId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
                toast.success(isArabic ? 'تم حذف الإشارة المرجعية' : 'Bookmark deleted');
            } else {
                throw new Error('Failed to delete bookmark');
            }
        } catch (error) {
            console.error('Error deleting bookmark:', error);
            toast.error(isArabic ? 'فشل حذف الإشارة المرجعية' : 'Failed to delete bookmark');
        }
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        
        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl border border-border p-4 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Bookmark className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-foreground">
                        {isArabic ? 'الإشارات المرجعية' : 'Bookmarks'}
                    </h3>
                    <span className="text-sm text-muted-foreground">({bookmarks.length})</span>
                </div>
                
                <button
                    onClick={() => setIsAddingBookmark(!isAddingBookmark)}
                    className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                    {isAddingBookmark ? <X className="w-4 h-4 text-foreground" /> : <Plus className="w-4 h-4 text-foreground" />}
                </button>
            </div>

            {/* Add New Bookmark */}
            <AnimatePresence>
                {isAddingBookmark && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4"
                    >
                        <div className="bg-gray-800/50 rounded-lg p-3 border border-border">
                            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span className="font-mono">{formatTime(currentTime)}</span>
                            </div>
                            <input
                                type="text"
                                value={newBookmarkTitle}
                                onChange={(e) => setNewBookmarkTitle(e.target.value)}
                                placeholder={isArabic ? 'عنوان الإشارة المرجعية...' : 'Bookmark title...'}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:border-blue-500 transition-colors mb-2"
                                autoFocus
                                onKeyPress={(e) => e.key === 'Enter' && createBookmark()}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={createBookmark}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-foreground py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    {isArabic ? 'حفظ' : 'Save'}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsAddingBookmark(false);
                                        setNewBookmarkTitle('');
                                    }}
                                    className="px-4 bg-gray-700 hover:bg-gray-600 text-foreground py-2 rounded-lg text-sm font-semibold transition-colors"
                                >
                                    {isArabic ? 'إلغاء' : 'Cancel'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bookmarks List */}
            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : bookmarks.length === 0 ? (
                    <div className="text-center py-8">
                        <Bookmark className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground text-sm">
                            {isArabic ? 'لا توجد إشارات مرجعية بعد' : 'No bookmarks yet'}
                        </p>
                        <p className="text-muted-foreground text-xs mt-1">
                            {isArabic ? 'اضغط + لإضافة إشارة مرجعية' : 'Click + to add a bookmark'}
                        </p>
                    </div>
                ) : (
                    bookmarks.map((bookmark, index) => (
                        <motion.button
                            key={bookmark.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => onSeekTo(bookmark.timestamp)}
                            className="w-full bg-gray-800/50 rounded-lg p-3 border border-border hover:border-blue-500/50 hover:bg-card transition-all text-left group"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <p className="text-foreground text-sm font-medium mb-1 truncate">
                                        {bookmark.title}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-blue-400">
                                        <Clock className="w-3 h-3" />
                                        <span className="font-mono">{formatTime(bookmark.timestamp)}</span>
                                    </div>
                                </div>
                                
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteBookmark(bookmark.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 rounded transition-all"
                                >
                                    <Trash2 className="w-4 h-4 text-red-400" />
                                </button>
                            </div>
                        </motion.button>
                    ))
                )}
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(31, 41, 55, 0.5);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(107, 114, 128, 0.5);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(107, 114, 128, 0.7);
                }
            `}</style>
        </div>
    );
}
