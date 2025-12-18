'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X,
    Upload,
    Image as ImageIcon,
    Video,
    FileText,
    Lock,
    Users,
    Crown,
    Sparkles,
    DollarSign,
    Calendar,
    Clock,
    Tag,
    MapPin,
    Smile,
    AtSign,
    Hash,
    Type,
    Bold,
    Italic,
    List as ListIcon,
    Link as LinkIcon,
    AlertCircle,
    Check,
    Loader2,
    Trash2,
    Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import Image from 'next/image'
import toast from 'react-hot-toast'

interface UploadMediaModalProps {
    isOpen: boolean
    onClose: () => void
    isArabic?: boolean
    existingPost?: any
    onUploadSuccess?: (post: any) => void
}

interface MediaFile {
    id: string
    file: File
    preview: string
    type: 'image' | 'video' | 'document'
    size: number
    duration?: number // For videos
}

type TierAccess = 'public' | 'basic' | 'premium' | 'vip' | 'ppv'

export default function UploadMediaModal({ isOpen, onClose, isArabic = false, existingPost, onUploadSuccess }: UploadMediaModalProps) {
    const [step, setStep] = useState<'upload' | 'details' | 'schedule'>(existingPost ? 'details' : 'upload')
    const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
    const [caption, setCaption] = useState(existingPost?.title || existingPost?.content || '')
    const [tierAccess, setTierAccess] = useState<TierAccess>(existingPost?.tierAccess || 'basic')
    const [ppvPrice, setPpvPrice] = useState(existingPost?.ppvPrice?.toString() || '29')
    const [tags, setTags] = useState<string[]>(existingPost?.tags || [])
    const [tagInput, setTagInput] = useState('')
    const [location, setLocation] = useState(existingPost?.location || '')
    const [scheduleDate, setScheduleDate] = useState(existingPost?.scheduledAt ? new Date(existingPost.scheduledAt).toISOString().split('T')[0] : '')
    const [scheduleTime, setScheduleTime] = useState(existingPost?.scheduledAt ? new Date(existingPost.scheduledAt).toTimeString().slice(0, 5) : '')
    const [isScheduled, setIsScheduled] = useState(!!existingPost?.scheduledAt)
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    
    const fileInputRef = useRef<HTMLInputElement>(null)
    const videoInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        
        files.forEach(file => {
            // Validate file size (max 100MB for videos, 10MB for images)
            const maxSize = file.type.startsWith('video/') ? 100 * 1024 * 1024 : 10 * 1024 * 1024
            if (file.size > maxSize) {
                toast.error(`File ${file.name} is too large. Max size: ${maxSize / (1024 * 1024)}MB`)
                return
            }

            const reader = new FileReader()
            reader.onload = (e) => {
                const mediaFile: MediaFile = {
                    id: Math.random().toString(36).substr(2, 9),
                    file,
                    preview: e.target?.result as string,
                    type: file.type.startsWith('video/') ? 'video' : 
                          file.type.startsWith('image/') ? 'image' : 'document',
                    size: file.size
                }
                
                // Get video duration if it's a video
                if (file.type.startsWith('video/')) {
                    const video = document.createElement('video')
                    video.src = mediaFile.preview
                    video.onloadedmetadata = () => {
                        mediaFile.duration = video.duration
                        setMediaFiles(prev => [...prev, mediaFile])
                    }
                } else {
                    setMediaFiles(prev => [...prev, mediaFile])
                }
            }
            reader.readAsDataURL(file)
        })

        if (e.target) {
            e.target.value = ''
        }
    }, [])

    const removeMedia = (id: string) => {
        setMediaFiles(prev => prev.filter(m => m.id !== id))
    }

    const addTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()])
            setTagInput('')
        }
    }

    const removeTag = (tag: string) => {
        setTags(tags.filter(t => t !== tag))
    }

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const handleUpload = async () => {
        if (mediaFiles.length === 0 && !existingPost) {
            toast.error(isArabic ? 'يرجى اختيار ملفات للرفع' : 'Please select files to upload')
            return
        }

        setUploading(true)
        setUploadProgress(0)

        try {
            let uploadedMediaUrl = existingPost?.mediaUrl || ''
            let uploadedThumbnailUrl = existingPost?.thumbnailUrl || ''

            // Upload media files first
            if (mediaFiles.length > 0) {
                setUploadProgress(10)
                
                // Upload the first media file
                const mediaFile = mediaFiles[0]
                const mediaFormData = new FormData()
                mediaFormData.append('file', mediaFile.file)
                mediaFormData.append('type', mediaFile.type === 'video' ? 'video' : 'image')

                const mediaUploadResponse = await fetch('/api/upload', {
                    method: 'POST',
                    body: mediaFormData
                })

                if (!mediaUploadResponse.ok) {
                    const error = await mediaUploadResponse.json()
                    throw new Error(error.error || 'Failed to upload media')
                }

                const mediaUploadData = await mediaUploadResponse.json()
                uploadedMediaUrl = mediaUploadData.url
                setUploadProgress(50)

                // For videos, generate/upload thumbnail from first frame if we have a preview
                if (mediaFile.type === 'video' && mediaFile.preview) {
                    uploadedThumbnailUrl = uploadedMediaUrl // Use video URL as thumbnail for now
                }

                // If there's a second image file, use it as thumbnail
                if (mediaFiles.length > 1 && mediaFiles[1].type === 'image') {
                    const thumbnailFormData = new FormData()
                    thumbnailFormData.append('file', mediaFiles[1].file)
                    thumbnailFormData.append('type', 'image')

                    const thumbnailUploadResponse = await fetch('/api/upload', {
                        method: 'POST',
                        body: thumbnailFormData
                    })

                    if (thumbnailUploadResponse.ok) {
                        const thumbnailData = await thumbnailUploadResponse.json()
                        uploadedThumbnailUrl = thumbnailData.url
                    }
                }
            }

            setUploadProgress(70)
            
            // Prepare post data
            const postData: any = {
                action: existingPost ? 'update' : 'create',
                postId: existingPost?.id,
                content: caption,
                title: caption,
                type: mediaFiles[0]?.type === 'video' ? 'VIDEO' : mediaFiles[0]?.type === 'image' ? 'IMAGE' : existingPost?.type || 'TEXT',
                tier: tierAccess.toUpperCase(),
                scheduledAt: isScheduled && scheduleDate && scheduleTime ? `${scheduleDate}T${scheduleTime}:00.000Z` : null,
                mediaUrl: uploadedMediaUrl || null,
                thumbnailUrl: uploadedThumbnailUrl || null,
                duration: mediaFiles[0]?.duration || existingPost?.duration || 0
            }

            setUploadProgress(80)

            // Call the actual API
            const response = await fetch('/api/scheduled-posts', {
                method: existingPost ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postData)
            })

            setUploadProgress(100)

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to create post')
            }

            const result = await response.json()
            const newPost = result.post

            toast.success(
                isScheduled 
                    ? (isArabic ? 'تم جدولة المنشور بنجاح' : 'Post scheduled successfully!')
                    : (isArabic ? 'تم نشر المنشور بنجاح' : 'Post uploaded successfully!')
            )
            onUploadSuccess?.(newPost)
            handleClose()

        } catch (error) {
            console.error('Upload error:', error)
            toast.error(isArabic ? 'فشل الرفع. حاول مرة أخرى' : 'Upload failed. Please try again')
            setUploading(false)
            setUploadProgress(0)
        }
    }

    const handleClose = () => {
        if (!uploading) {
            setMediaFiles([])
            setCaption('')
            setTierAccess('basic')
            setTags([])
            setLocation('')
            setScheduleDate('')
            setScheduleTime('')
            setIsScheduled(false)
            setStep('upload')
            setUploadProgress(0)
            onClose()
        }
    }

    const emojis = ['😀', '😍', '🔥', '💯', '🎉', '❤️', '👍', '💪', '✨', '🚀', '📚', '🎓', '💡', '⭐']

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-4xl max-h-[90vh] bg-background border border-border rounded-3xl shadow-2xl overflow-hidden pointer-events-auto"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-border bg-card">
                                <div>
                                    <h2 className="text-2xl font-black text-foreground">
                                        {isArabic ? 'إنشاء منشور جديد' : 'Create New Post'}
                                    </h2>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {step === 'upload' && (isArabic ? 'ارفع الصور والفيديوهات' : 'Upload photos and videos')}
                                        {step === 'details' && (isArabic ? 'أضف التفاصيل والوصف' : 'Add details and caption')}
                                        {step === 'schedule' && (isArabic ? 'جدولة النشر' : 'Schedule posting')}
                                    </p>
                                </div>
                                <button
                                    onClick={handleClose}
                                    disabled={uploading}
                                    className="w-10 h-10 rounded-full bg-card-hover hover:bg-border transition-all flex items-center justify-center disabled:opacity-50"
                                >
                                    <X className="w-5 h-5 text-foreground" />
                                </button>
                            </div>

                            {/* Progress Steps */}
                            <div className="flex items-center justify-center gap-2 p-4 bg-card/50">
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                                    step === 'upload' ? 'bg-purple-500 text-white' : 'bg-card text-muted-foreground'
                                }`}>
                                    <Upload className="w-4 h-4" />
                                    <span className="text-sm font-semibold">{isArabic ? 'رفع' : 'Upload'}</span>
                                </div>
                                <div className="w-8 h-0.5 bg-border" />
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                                    step === 'details' ? 'bg-purple-500 text-white' : 'bg-card text-muted-foreground'
                                }`}>
                                    <FileText className="w-4 h-4" />
                                    <span className="text-sm font-semibold">{isArabic ? 'تفاصيل' : 'Details'}</span>
                                </div>
                                <div className="w-8 h-0.5 bg-border" />
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                                    step === 'schedule' ? 'bg-purple-500 text-white' : 'bg-card text-muted-foreground'
                                }`}>
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-sm font-semibold">{isArabic ? 'نشر' : 'Publish'}</span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="overflow-y-auto max-h-[calc(90vh-240px)] p-6">
                                {/* Step 1: Upload */}
                                {step === 'upload' && (
                                    <div className="space-y-4">
                                        {/* Upload Area */}
                                        <div className="border-2 border-dashed border-border rounded-2xl p-8 bg-card hover:bg-card-hover transition-all">
                                            <div className="text-center">
                                                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                                    <Upload className="w-10 h-10 text-white" />
                                                </div>
                                                <h3 className="text-xl font-bold text-foreground mb-2">
                                                    {isArabic ? 'اسحب وأفلت ملفاتك هنا' : 'Drag and drop your files here'}
                                                </h3>
                                                <p className="text-muted-foreground mb-4">
                                                    {isArabic ? 'أو اختر من جهازك' : 'or choose from your device'}
                                                </p>
                                                <div className="flex items-center justify-center gap-3">
                                                    <Button
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="bg-purple-500 hover:bg-purple-600 text-white font-semibold px-6 py-3 rounded-full"
                                                    >
                                                        <ImageIcon className="w-5 h-5 mr-2" />
                                                        {isArabic ? 'اختر صور' : 'Choose Photos'}
                                                    </Button>
                                                    <Button
                                                        onClick={() => videoInputRef.current?.click()}
                                                        className="bg-pink-500 hover:bg-pink-600 text-white font-semibold px-6 py-3 rounded-full"
                                                    >
                                                        <Video className="w-5 h-5 mr-2" />
                                                        {isArabic ? 'اختر فيديو' : 'Choose Videos'}
                                                    </Button>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-4">
                                                    {isArabic 
                                                        ? 'صور: حتى 10 ميجابايت | فيديو: حتى 100 ميجابايت'
                                                        : 'Photos: up to 10MB | Videos: up to 100MB'
                                                    }
                                                </p>
                                            </div>
                                        </div>

                                        {/* Hidden file inputs */}
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                        <input
                                            ref={videoInputRef}
                                            type="file"
                                            accept="video/*"
                                            multiple
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />

                                        {/* Preview uploaded files */}
                                        {mediaFiles.length > 0 && (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-bold text-foreground">
                                                        {isArabic ? 'الملفات المحملة' : 'Uploaded Files'} ({mediaFiles.length})
                                                    </h4>
                                                    <Button
                                                        onClick={() => setMediaFiles([])}
                                                        variant="ghost"
                                                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        {isArabic ? 'حذف الكل' : 'Clear All'}
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                    {mediaFiles.map((media) => (
                                                        <motion.div
                                                            key={media.id}
                                                            initial={{ opacity: 0, scale: 0.9 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            className="relative group aspect-square rounded-xl overflow-hidden bg-card border border-border"
                                                        >
                                                            {media.type === 'image' ? (
                                                                <img
                                                                    src={media.preview}
                                                                    alt="Preview"
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="relative w-full h-full">
                                                                    <video
                                                                        src={media.preview}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                                        <Video className="w-12 h-12 text-white" />
                                                                    </div>
                                                                    {media.duration && (
                                                                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                                                            {formatDuration(media.duration)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                                                                <button
                                                                    onClick={() => removeMedia(media.id)}
                                                                    className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all"
                                                                >
                                                                    <Trash2 className="w-5 h-5 text-white" />
                                                                </button>
                                                            </div>
                                                            <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                                                {formatFileSize(media.size)}
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step 2: Details */}
                                {step === 'details' && (
                                    <div className="space-y-6">
                                        {/* Caption */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                {isArabic ? 'الوصف' : 'Caption'}
                                            </label>
                                            <div className="relative">
                                                <Textarea
                                                    value={caption}
                                                    onChange={(e) => setCaption(e.target.value)}
                                                    placeholder={isArabic ? 'اكتب وصفاً لمنشورك...' : 'Write a caption for your post...'}
                                                    className="w-full min-h-[120px] bg-card border-border focus:border-purple-500 text-foreground resize-none"
                                                    maxLength={2000}
                                                />
                                                <div className="flex items-center justify-between mt-2">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                                            className="w-8 h-8 rounded-lg bg-card hover:bg-card-hover border border-border flex items-center justify-center transition-all"
                                                        >
                                                            <Smile className="w-4 h-4 text-muted-foreground" />
                                                        </button>
                                                        <button className="w-8 h-8 rounded-lg bg-card hover:bg-card-hover border border-border flex items-center justify-center transition-all">
                                                            <AtSign className="w-4 h-4 text-muted-foreground" />
                                                        </button>
                                                        <button className="w-8 h-8 rounded-lg bg-card hover:bg-card-hover border border-border flex items-center justify-center transition-all">
                                                            <Hash className="w-4 h-4 text-muted-foreground" />
                                                        </button>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">
                                                        {caption.length}/2000
                                                    </span>
                                                </div>
                                                {/* Emoji Picker */}
                                                {showEmojiPicker && (
                                                    <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-xl p-3 shadow-xl z-10">
                                                        <div className="grid grid-cols-7 gap-2">
                                                            {emojis.map((emoji) => (
                                                                <button
                                                                    key={emoji}
                                                                    onClick={() => {
                                                                        setCaption(caption + emoji)
                                                                        setShowEmojiPicker(false)
                                                                    }}
                                                                    className="w-8 h-8 hover:bg-card-hover rounded-lg transition-all text-xl"
                                                                >
                                                                    {emoji}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Access Tier */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-3">
                                                {isArabic ? 'من يمكنه رؤية هذا المنشور؟' : 'Who can see this post?'}
                                            </label>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                <button
                                                    onClick={() => setTierAccess('public')}
                                                    className={`p-4 rounded-xl border-2 transition-all ${
                                                        tierAccess === 'public'
                                                            ? 'border-green-500 bg-green-500/10'
                                                            : 'border-border hover:border-green-500/50'
                                                    }`}
                                                >
                                                    <Users className={`w-6 h-6 mx-auto mb-2 ${
                                                        tierAccess === 'public' ? 'text-green-500' : 'text-muted-foreground'
                                                    }`} />
                                                    <div className="text-sm font-semibold text-foreground">
                                                        {isArabic ? 'عام' : 'Public'}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {isArabic ? 'الجميع' : 'Everyone'}
                                                    </div>
                                                </button>
                                                <button
                                                    onClick={() => setTierAccess('basic')}
                                                    className={`p-4 rounded-xl border-2 transition-all ${
                                                        tierAccess === 'basic'
                                                            ? 'border-gray-500 bg-gray-500/10'
                                                            : 'border-border hover:border-gray-500/50'
                                                    }`}
                                                >
                                                    <Lock className={`w-6 h-6 mx-auto mb-2 ${
                                                        tierAccess === 'basic' ? 'text-gray-400' : 'text-muted-foreground'
                                                    }`} />
                                                    <div className="text-sm font-semibold text-foreground">
                                                        {isArabic ? 'أساسي' : 'Basic'}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">49 EGP+</div>
                                                </button>
                                                <button
                                                    onClick={() => setTierAccess('premium')}
                                                    className={`p-4 rounded-xl border-2 transition-all ${
                                                        tierAccess === 'premium'
                                                            ? 'border-purple-500 bg-purple-500/10'
                                                            : 'border-border hover:border-purple-500/50'
                                                    }`}
                                                >
                                                    <Sparkles className={`w-6 h-6 mx-auto mb-2 ${
                                                        tierAccess === 'premium' ? 'text-purple-400' : 'text-muted-foreground'
                                                    }`} />
                                                    <div className="text-sm font-semibold text-foreground">
                                                        {isArabic ? 'مميز' : 'Premium'}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">99 EGP+</div>
                                                </button>
                                                <button
                                                    onClick={() => setTierAccess('vip')}
                                                    className={`p-4 rounded-xl border-2 transition-all ${
                                                        tierAccess === 'vip'
                                                            ? 'border-yellow-500 bg-yellow-500/10'
                                                            : 'border-border hover:border-yellow-500/50'
                                                    }`}
                                                >
                                                    <Crown className={`w-6 h-6 mx-auto mb-2 ${
                                                        tierAccess === 'vip' ? 'text-yellow-400' : 'text-muted-foreground'
                                                    }`} />
                                                    <div className="text-sm font-semibold text-foreground">VIP</div>
                                                    <div className="text-xs text-muted-foreground">199 EGP+</div>
                                                </button>
                                                <button
                                                    onClick={() => setTierAccess('ppv')}
                                                    className={`p-4 rounded-xl border-2 transition-all ${
                                                        tierAccess === 'ppv'
                                                            ? 'border-pink-500 bg-pink-500/10'
                                                            : 'border-border hover:border-pink-500/50'
                                                    }`}
                                                >
                                                    <DollarSign className={`w-6 h-6 mx-auto mb-2 ${
                                                        tierAccess === 'ppv' ? 'text-pink-400' : 'text-muted-foreground'
                                                    }`} />
                                                    <div className="text-sm font-semibold text-foreground">
                                                        {isArabic ? 'الدفع لكل مشاهدة' : 'Pay-Per-View'}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {isArabic ? 'سعر مخصص' : 'Custom price'}
                                                    </div>
                                                </button>
                                            </div>
                                        </div>

                                        {/* PPV Price */}
                                        {tierAccess === 'ppv' && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="space-y-2"
                                            >
                                                <label className="block text-sm font-semibold text-foreground">
                                                    {isArabic ? 'سعر المشاهدة' : 'View Price'}
                                                </label>
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        value={ppvPrice}
                                                        onChange={(e) => setPpvPrice(e.target.value)}
                                                        placeholder="29"
                                                        className="w-full bg-card border-border focus:border-pink-500 text-foreground pl-4 pr-16"
                                                        min="1"
                                                    />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                                                        EGP
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {isArabic 
                                                        ? 'المستخدمون سيدفعون هذا المبلغ لرؤية هذا المنشور'
                                                        : 'Users will pay this amount to view this post'
                                                    }
                                                </p>
                                            </motion.div>
                                        )}

                                        {/* Tags */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                {isArabic ? 'الوسوم' : 'Tags'}
                                            </label>
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="relative flex-1">
                                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                    <Input
                                                        value={tagInput}
                                                        onChange={(e) => setTagInput(e.target.value)}
                                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                                        placeholder={isArabic ? 'أضف وسم...' : 'Add a tag...'}
                                                        className="w-full bg-card border-border focus:border-purple-500 text-foreground pl-10"
                                                    />
                                                </div>
                                                <Button
                                                    onClick={addTag}
                                                    className="bg-purple-500 hover:bg-purple-600 text-white px-6"
                                                >
                                                    {isArabic ? 'إضافة' : 'Add'}
                                                </Button>
                                            </div>
                                            {tags.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {tags.map((tag) => (
                                                        <div
                                                            key={tag}
                                                            className="bg-purple-500/10 border border-purple-500/30 text-purple-400 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2"
                                                        >
                                                            #{tag}
                                                            <button
                                                                onClick={() => removeTag(tag)}
                                                                className="hover:text-purple-300 transition-all"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Location */}
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                {isArabic ? 'الموقع' : 'Location'} ({isArabic ? 'اختياري' : 'Optional'})
                                            </label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <Input
                                                    value={location}
                                                    onChange={(e) => setLocation(e.target.value)}
                                                    placeholder={isArabic ? 'أضف موقعاً...' : 'Add a location...'}
                                                    className="w-full bg-card border-border focus:border-purple-500 text-foreground pl-10"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Schedule */}
                                {step === 'schedule' && (
                                    <div className="space-y-6">
                                        {/* Post Now or Schedule */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => setIsScheduled(false)}
                                                className={`p-6 rounded-2xl border-2 transition-all ${
                                                    !isScheduled
                                                        ? 'border-purple-500 bg-purple-500/10'
                                                        : 'border-border hover:border-purple-500/50'
                                                }`}
                                            >
                                                <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                                                    !isScheduled ? 'bg-purple-500' : 'bg-card'
                                                }`}>
                                                    <Upload className={`w-6 h-6 ${
                                                        !isScheduled ? 'text-white' : 'text-muted-foreground'
                                                    }`} />
                                                </div>
                                                <div className="text-lg font-bold text-foreground mb-1">
                                                    {isArabic ? 'نشر الآن' : 'Post Now'}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {isArabic ? 'انشر فوراً' : 'Publish immediately'}
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => setIsScheduled(true)}
                                                className={`p-6 rounded-2xl border-2 transition-all ${
                                                    isScheduled
                                                        ? 'border-purple-500 bg-purple-500/10'
                                                        : 'border-border hover:border-purple-500/50'
                                                }`}
                                            >
                                                <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                                                    isScheduled ? 'bg-purple-500' : 'bg-card'
                                                }`}>
                                                    <Clock className={`w-6 h-6 ${
                                                        isScheduled ? 'text-white' : 'text-muted-foreground'
                                                    }`} />
                                                </div>
                                                <div className="text-lg font-bold text-foreground mb-1">
                                                    {isArabic ? 'جدولة' : 'Schedule'}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {isArabic ? 'اختر وقت النشر' : 'Choose when to post'}
                                                </div>
                                            </button>
                                        </div>

                                        {/* Schedule Date/Time */}
                                        {isScheduled && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-card border border-border rounded-2xl p-6 space-y-4"
                                            >
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                                                        <Calendar className="w-5 h-5 text-purple-400" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-foreground">
                                                            {isArabic ? 'اختر التاريخ والوقت' : 'Choose Date & Time'}
                                                        </h3>
                                                        <p className="text-sm text-muted-foreground">
                                                            {isArabic ? 'حدد متى تريد نشر هذا المحتوى' : 'Select when to publish this content'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                                            {isArabic ? 'التاريخ' : 'Date'}
                                                        </label>
                                                        <Input
                                                            type="date"
                                                            value={scheduleDate}
                                                            onChange={(e) => setScheduleDate(e.target.value)}
                                                            className="w-full bg-background border-border focus:border-purple-500 text-foreground"
                                                            min={new Date().toISOString().split('T')[0]}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                                            {isArabic ? 'الوقت' : 'Time'}
                                                        </label>
                                                        <Input
                                                            type="time"
                                                            value={scheduleTime}
                                                            onChange={(e) => setScheduleTime(e.target.value)}
                                                            className="w-full bg-background border-border focus:border-purple-500 text-foreground"
                                                        />
                                                    </div>
                                                </div>
                                                {scheduleDate && scheduleTime && (
                                                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                                                        <div className="flex items-center gap-2 text-purple-400">
                                                            <AlertCircle className="w-5 h-5" />
                                                            <span className="text-sm font-semibold">
                                                                {isArabic 
                                                                    ? `سيتم النشر في ${new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString(isArabic ? 'ar-EG' : 'en-US')}`
                                                                    : `Will be posted on ${new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString('en-US')}`
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}

                                        {/* Post Summary */}
                                        <div className="bg-card border border-border rounded-2xl p-6">
                                            <h3 className="font-bold text-foreground mb-4">
                                                {isArabic ? 'ملخص المنشور' : 'Post Summary'}
                                            </h3>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">{isArabic ? 'الملفات' : 'Media Files'}</span>
                                                    <span className="font-semibold text-foreground">
                                                        {mediaFiles.length} {isArabic ? 'ملف' : 'file(s)'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">{isArabic ? 'الوصول' : 'Access'}</span>
                                                    <span className="font-semibold text-foreground capitalize">{tierAccess}</span>
                                                </div>
                                                {tierAccess === 'ppv' && (
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-muted-foreground">{isArabic ? 'السعر' : 'Price'}</span>
                                                        <span className="font-semibold text-foreground">€{ppvPrice}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">{isArabic ? 'الوسوم' : 'Tags'}</span>
                                                    <span className="font-semibold text-foreground">{tags.length}</span>
                                                </div>
                                                {location && (
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-muted-foreground">{isArabic ? 'الموقع' : 'Location'}</span>
                                                        <span className="font-semibold text-foreground">{location}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer Actions */}
                            <div className="p-6 border-t border-border bg-card">
                                {uploading ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-foreground font-semibold">
                                                {isArabic ? 'جاري الرفع...' : 'Uploading...'}
                                            </span>
                                            <span className="text-purple-400 font-bold">{uploadProgress}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-card-hover rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${uploadProgress}%` }}
                                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between gap-3">
                                        {step !== 'upload' && (
                                            <Button
                                                onClick={() => {
                                                    if (step === 'details') setStep('upload')
                                                    if (step === 'schedule') setStep('details')
                                                }}
                                                variant="outline"
                                                className="px-6 py-3 font-semibold"
                                            >
                                                {isArabic ? 'رجوع' : 'Back'}
                                            </Button>
                                        )}
                                        <div className="flex-1" />
                                        {step === 'upload' && (
                                            <Button
                                                onClick={() => setStep('details')}
                                                disabled={mediaFiles.length === 0}
                                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold px-8 py-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isArabic ? 'التالي' : 'Next'}
                                            </Button>
                                        )}
                                        {step === 'details' && (
                                            <Button
                                                onClick={() => setStep('schedule')}
                                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold px-8 py-3 rounded-full"
                                            >
                                                {isArabic ? 'التالي' : 'Next'}
                                            </Button>
                                        )}
                                        {step === 'schedule' && (
                                            <Button
                                                onClick={handleUpload}
                                                disabled={uploading || (isScheduled && (!scheduleDate || !scheduleTime))}
                                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold px-8 py-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                {uploading ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                        {isArabic ? 'جاري الرفع...' : 'Uploading...'}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Check className="w-5 h-5" />
                                                        {isScheduled 
                                                            ? (isArabic ? 'جدولة المنشور' : 'Schedule Post')
                                                            : (isArabic ? 'نشر الآن' : 'Post Now')
                                                        }
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )
}
