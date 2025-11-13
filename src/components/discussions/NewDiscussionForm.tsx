/**
 * New Discussion Form Component
 * Modal for creating new discussions
 */

'use client'

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import {
    X,
    MessageSquare,
    Tag,
    BookOpen,
    Loader
} from 'lucide-react'

interface NewDiscussionFormProps {
    courseId: string
    lessonId?: string
    onClose: () => void
    onSuccess: () => void
    lang?: string
}

export default function NewDiscussionForm({
    courseId,
    lessonId,
    onClose,
    onSuccess,
    lang = 'en'
}: NewDiscussionFormProps) {
    const { data: session } = useSession()
    const isArabic = lang === 'ar'

    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [tags, setTags] = useState<string[]>([])
    const [tagInput, setTagInput] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const handleAddTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 5) {
            setTags([...tags, tagInput.trim()])
            setTagInput('')
        }
    }

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!session) {
            toast.error(isArabic ? 'يجب تسجيل الدخول' : 'Please sign in')
            return
        }

        // Validation
        if (title.trim().length < 10 || title.trim().length > 200) {
            toast.error(isArabic 
                ? 'العنوان يجب أن يكون بين 10 و 200 حرف'
                : 'Title must be between 10 and 200 characters')
            return
        }

        if (content.trim().length < 20) {
            toast.error(isArabic 
                ? 'المحتوى يجب أن يكون 20 حرف على الأقل'
                : 'Content must be at least 20 characters')
            return
        }

        try {
            setSubmitting(true)
            const response = await fetch(`/api/courses/${courseId}/discussions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    content: content.trim(),
                    lessonId: lessonId || null,
                    tags
                })
            })

            if (response.ok) {
                toast.success(isArabic ? 'تم إنشاء المناقشة!' : 'Discussion created!')
                onSuccess()
                onClose()
            } else {
                const error = await response.json()
                throw new Error(error.error || 'Failed to create discussion')
            }
        } catch (error: any) {
            console.error('Submit error:', error)
            toast.error(error.message || (isArabic ? 'فشل إنشاء المناقشة' : 'Failed to create discussion'))
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir={isArabic ? 'rtl' : 'ltr'}>
            <div className="bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <MessageSquare className="w-6 h-6 text-purple-400" />
                        {isArabic ? 'مناقشة جديدة' : 'New Discussion'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-700 rounded-lg transition"
                    >
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-semibold text-muted-foreground mb-2">
                            {isArabic ? 'العنوان' : 'Title'} <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={isArabic 
                                ? 'اطرح سؤالاً أو ابدأ نقاشاً...'
                                : 'Ask a question or start a discussion...'}
                            className="w-full bg-gray-900/50 border border-border rounded-lg px-4 py-3 text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            maxLength={200}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            {title.length}/200 {isArabic ? 'حرف' : 'characters'}
                        </p>
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-sm font-semibold text-muted-foreground mb-2">
                            {isArabic ? 'التفاصيل' : 'Details'} <span className="text-red-400">*</span>
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={isArabic
                                ? 'اشرح سؤالك أو نقطتك بالتفصيل...'
                                : 'Explain your question or point in detail...'}
                            rows={8}
                            className="w-full bg-gray-900/50 border border-border rounded-lg px-4 py-3 text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            {content.length} {isArabic ? 'حرف' : 'characters'} ({isArabic ? 'الحد الأدنى 20' : 'minimum 20'})
                        </p>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-semibold text-muted-foreground mb-2">
                            <Tag className="w-4 h-4 inline mr-1" />
                            {isArabic ? 'الوسوم' : 'Tags'}
                            <span className="text-muted-foreground font-normal ml-2">
                                ({isArabic ? 'اختياري، حتى 5 وسوم' : 'Optional, up to 5 tags'})
                            </span>
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        handleAddTag()
                                    }
                                }}
                                placeholder={isArabic ? 'أضف وسم...' : 'Add a tag...'}
                                className="flex-1 bg-gray-900/50 border border-border rounded-lg px-4 py-2 text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                disabled={tags.length >= 5}
                            />
                            <button
                                type="button"
                                onClick={handleAddTag}
                                disabled={!tagInput.trim() || tags.length >= 5}
                                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-foreground rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isArabic ? 'إضافة' : 'Add'}
                            </button>
                        </div>
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="flex items-center gap-1 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm"
                                    >
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTag(tag)}
                                            className="hover:text-foreground transition"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Lesson Info */}
                    {lessonId && (
                        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 flex items-start gap-3">
                            <BookOpen className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-purple-300">
                                    {isArabic ? 'مرتبط بالدرس' : 'Related to Lesson'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {isArabic 
                                        ? 'ستظهر هذه المناقشة في صفحة الدرس'
                                        : 'This discussion will appear on the lesson page'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-foreground rounded-lg font-semibold transition"
                        >
                            {isArabic ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || title.trim().length < 10 || content.trim().length < 20}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-foreground rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <>
                                    <Loader className="w-5 h-5 animate-spin" />
                                    {isArabic ? 'جاري النشر...' : 'Posting...'}
                                </>
                            ) : (
                                <>
                                    <MessageSquare className="w-5 h-5" />
                                    {isArabic ? 'نشر المناقشة' : 'Post Discussion'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
