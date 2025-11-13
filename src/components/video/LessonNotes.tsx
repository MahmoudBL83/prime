'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    StickyNote, Plus, Edit2, Trash2, Save, X, Clock, Search
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface VideoNote {
    id: string;
    timestamp: number;
    content: string;
    createdAt: string;
    updatedAt: string;
}

interface LessonNotesProps {
    lessonId: string;
    currentTime: number;
    onSeekTo: (time: number) => void;
    isArabic?: boolean;
}

export default function LessonNotes({
    lessonId,
    currentTime,
    onSeekTo,
    isArabic = false,
}: LessonNotesProps) {
    const [notes, setNotes] = useState<VideoNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [newNoteContent, setNewNoteContent] = useState('');
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddingNote, setIsAddingNote] = useState(false);

    useEffect(() => {
        loadNotes();
    }, [lessonId]);

    const loadNotes = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/lessons/${lessonId}/notes`);
            if (response.ok) {
                const data = await response.json();
                setNotes(data.notes || []);
            }
        } catch (error) {
            console.error('Error loading notes:', error);
            toast.error(isArabic ? 'فشل تحميل الملاحظات' : 'Failed to load notes');
        } finally {
            setLoading(false);
        }
    };

    const createNote = async () => {
        if (!newNoteContent.trim()) {
            toast.error(isArabic ? 'الرجاء إدخال محتوى الملاحظة' : 'Please enter note content');
            return;
        }

        try {
            const response = await fetch(`/api/lessons/${lessonId}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timestamp: Math.floor(currentTime),
                    content: newNoteContent,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setNotes(prev => [...prev, data.note].sort((a, b) => a.timestamp - b.timestamp));
                setNewNoteContent('');
                setIsAddingNote(false);
                toast.success(isArabic ? 'تم إضافة الملاحظة' : 'Note added');
            } else {
                throw new Error('Failed to create note');
            }
        } catch (error) {
            console.error('Error creating note:', error);
            toast.error(isArabic ? 'فشل إضافة الملاحظة' : 'Failed to add note');
        }
    };

    const updateNote = async (noteId: string) => {
        if (!editContent.trim()) {
            toast.error(isArabic ? 'الرجاء إدخال محتوى الملاحظة' : 'Please enter note content');
            return;
        }

        try {
            const response = await fetch(`/api/lessons/${lessonId}/notes`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    noteId,
                    content: editContent,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setNotes(prev => prev.map(n => n.id === noteId ? data.note : n));
                setEditingNoteId(null);
                setEditContent('');
                toast.success(isArabic ? 'تم تحديث الملاحظة' : 'Note updated');
            } else {
                throw new Error('Failed to update note');
            }
        } catch (error) {
            console.error('Error updating note:', error);
            toast.error(isArabic ? 'فشل تحديث الملاحظة' : 'Failed to update note');
        }
    };

    const deleteNote = async (noteId: string) => {
        if (!confirm(isArabic ? 'هل تريد حذف هذه الملاحظة؟' : 'Delete this note?')) {
            return;
        }

        try {
            const response = await fetch(`/api/lessons/${lessonId}/notes?noteId=${noteId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setNotes(prev => prev.filter(n => n.id !== noteId));
                toast.success(isArabic ? 'تم حذف الملاحظة' : 'Note deleted');
            } else {
                throw new Error('Failed to delete note');
            }
        } catch (error) {
            console.error('Error deleting note:', error);
            toast.error(isArabic ? 'فشل حذف الملاحظة' : 'Failed to delete note');
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

    const filteredNotes = notes.filter(note =>
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl border border-border p-4 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <StickyNote className="w-5 h-5 text-yellow-400" />
                    <h3 className="text-lg font-semibold text-foreground">
                        {isArabic ? 'ملاحظاتي' : 'My Notes'}
                    </h3>
                    <span className="text-sm text-muted-foreground">({notes.length})</span>
                </div>
                
                <button
                    onClick={() => setIsAddingNote(!isAddingNote)}
                    className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                >
                    {isAddingNote ? <X className="w-4 h-4 text-foreground" /> : <Plus className="w-4 h-4 text-foreground" />}
                </button>
            </div>

            {/* Search */}
            {notes.length > 0 && (
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder={isArabic ? 'بحث في الملاحظات...' : 'Search notes...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2 text-foreground text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                </div>
            )}

            {/* Add New Note */}
            <AnimatePresence>
                {isAddingNote && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4"
                    >
                        <div className="bg-gray-800/50 rounded-lg p-3 border border-border">
                            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>{formatTime(currentTime)}</span>
                            </div>
                            <textarea
                                value={newNoteContent}
                                onChange={(e) => setNewNoteContent(e.target.value)}
                                placeholder={isArabic ? 'اكتب ملاحظتك هنا...' : 'Write your note here...'}
                                className="w-full bg-background border border-border rounded-lg p-3 text-foreground text-sm focus:outline-none focus:border-purple-500 transition-colors resize-none"
                                rows={3}
                                autoFocus
                            />
                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={createNote}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-foreground py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    {isArabic ? 'حفظ' : 'Save'}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsAddingNote(false);
                                        setNewNoteContent('');
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

            {/* Notes List */}
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                    </div>
                ) : filteredNotes.length === 0 ? (
                    <div className="text-center py-8">
                        <StickyNote className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground text-sm">
                            {searchQuery ? 
                                (isArabic ? 'لا توجد نتائج' : 'No results found') :
                                (isArabic ? 'لا توجد ملاحظات بعد' : 'No notes yet')
                            }
                        </p>
                        {!searchQuery && (
                            <p className="text-muted-foreground text-xs mt-1">
                                {isArabic ? 'اضغط + لإضافة ملاحظة' : 'Click + to add a note'}
                            </p>
                        )}
                    </div>
                ) : (
                    filteredNotes.map((note, index) => (
                        <motion.div
                            key={note.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-gray-800/50 rounded-lg p-3 border border-border hover:border-purple-500/50 transition-all group"
                        >
                            {/* Timestamp */}
                            <button
                                onClick={() => onSeekTo(note.timestamp)}
                                className="flex items-center gap-2 mb-2 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                            >
                                <Clock className="w-3 h-3" />
                                <span className="font-mono">{formatTime(note.timestamp)}</span>
                            </button>

                            {/* Content */}
                            {editingNoteId === note.id ? (
                                <div>
                                    <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="w-full bg-background border border-border rounded-lg p-2 text-foreground text-sm focus:outline-none focus:border-purple-500 transition-colors resize-none mb-2"
                                        rows={3}
                                        autoFocus
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => updateNote(note.id)}
                                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-foreground py-1.5 rounded text-xs font-semibold transition-colors"
                                        >
                                            {isArabic ? 'حفظ' : 'Save'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingNoteId(null);
                                                setEditContent('');
                                            }}
                                            className="px-3 bg-gray-700 hover:bg-gray-600 text-foreground py-1.5 rounded text-xs font-semibold transition-colors"
                                        >
                                            {isArabic ? 'إلغاء' : 'Cancel'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <p className="text-gray-200 text-sm mb-2 whitespace-pre-wrap">
                                        {note.content}
                                    </p>

                                    {/* Actions */}
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => {
                                                setEditingNoteId(note.id);
                                                setEditContent(note.content);
                                            }}
                                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-purple-400 transition-colors"
                                        >
                                            <Edit2 className="w-3 h-3" />
                                            {isArabic ? 'تعديل' : 'Edit'}
                                        </button>
                                        <button
                                            onClick={() => deleteNote(note.id)}
                                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            {isArabic ? 'حذف' : 'Delete'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </motion.div>
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
