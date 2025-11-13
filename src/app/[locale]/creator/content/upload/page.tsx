'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    Upload,
    Video,
    Image as ImageIcon,
    FileText,
    ArrowLeft,
    Home,
    Play,
    X,
    Check,
    Loader2,
    AlertCircle,
    Lock,
    Users,
    Crown,
    Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import Image from 'next/image'

type ContentType = 'VIDEO' | 'IMAGE' | 'TEXT'
type Visibility = 'FREE' | 'VIP' | 'VVIP'

export default function CreatorUpload() {
    const { data: session } = useSession()
    const router = useRouter()
    const params = useParams()
    const locale = params.locale as string
    const isArabic = locale === 'ar'

    const [step, setStep] = useState(1)
    const [contentType, setContentType] = useState<ContentType>('VIDEO')
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [visibility, setVisibility] = useState<Visibility>('FREE')
    const [file, setFile] = useState<File | null>(null)
    const [thumbnail, setThumbnail] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    if (!session?.user) {
        router.push(`/${locale}/login`)
        return null
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)
            
            // Create preview URL
            const url = URL.createObjectURL(selectedFile)
            setPreviewUrl(url)
        }
    }

    const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setThumbnail(selectedFile)
        }
    }

    const handleUpload = async () => {
        if (!file && contentType !== 'TEXT') {
            toast.error(isArabic ? 'الرجاء اختيار ملف' : 'Please select a file')
            return
        }

        if (!title.trim()) {
            toast.error(isArabic ? 'الرجاء إدخال العنوان' : 'Please enter a title')
            return
        }

        setUploading(true)
        setUploadProgress(0)

        try {
            const formData = new FormData()
            formData.append('type', contentType)
            formData.append('title', title)
            formData.append('description', description)
            formData.append('visibility', visibility)
            
            if (file) {
                formData.append('file', file)
            }
            
            if (thumbnail) {
                formData.append('thumbnail', thumbnail)
            }

            // Simulate upload progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval)
                        return prev
                    }
                    return prev + 10
                })
            }, 500)

            const response = await fetch('/api/creator/content/upload', {
                method: 'POST',
                body: formData
            })

            clearInterval(progressInterval)
            setUploadProgress(100)

            if (response.ok) {
                toast.success(isArabic ? 'تم الرفع بنجاح!' : 'Upload successful!')
                setTimeout(() => {
                    router.push(`/${locale}/creator/content`)
                }, 1000)
            } else {
                const error = await response.json()
                toast.error(error.message || (isArabic ? 'فشل الرفع' : 'Upload failed'))
            }
        } catch (error) {
            console.error('Upload error:', error)
            toast.error(isArabic ? 'حدث خطأ أثناء الرفع' : 'Upload error occurred')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-card border-b border-border">
                <div className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => router.back()}
                                className="p-2 hover:bg-accent rounded-full transition-colors"
                                title={isArabic ? 'رجوع' : 'Back'}
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => router.push(`/${locale}`)}
                                className="p-2 hover:bg-accent rounded-full transition-colors"
                                title={isArabic ? 'الصفحة الرئيسية' : 'Home'}
                            >
                                <Home className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="h-8 w-px bg-border" />

                        <Link href={`/${locale}/creator/dashboard`} className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                                <Play className="w-6 h-6 text-white fill-white" />
                            </div>
                            <span className="text-xl font-bold">
                                {isArabic ? 'رفع محتوى' : 'Upload Content'}
                            </span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/${locale}/creator/content`)}
                        >
                            {isArabic ? 'إلغاء' : 'Cancel'}
                        </Button>
                    </div>
                </div>
            </header>

            <div className="max-w-5xl mx-auto p-8">
                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-center gap-4">
                        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-purple-500' : 'text-muted-foreground'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-purple-500 text-white' : 'bg-accent'}`}>
                                {step > 1 ? <Check className="w-5 h-5" /> : '1'}
                            </div>
                            <span className="font-semibold">{isArabic ? 'نوع المحتوى' : 'Content Type'}</span>
                        </div>

                        <div className={`h-px w-16 ${step > 1 ? 'bg-purple-500' : 'bg-border'}`} />

                        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-purple-500' : 'text-muted-foreground'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-purple-500 text-white' : 'bg-accent'}`}>
                                {step > 2 ? <Check className="w-5 h-5" /> : '2'}
                            </div>
                            <span className="font-semibold">{isArabic ? 'التفاصيل' : 'Details'}</span>
                        </div>

                        <div className={`h-px w-16 ${step > 2 ? 'bg-purple-500' : 'bg-border'}`} />

                        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-purple-500' : 'text-muted-foreground'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-purple-500 text-white' : 'bg-accent'}`}>
                                {step > 3 ? <Check className="w-5 h-5" /> : '3'}
                            </div>
                            <span className="font-semibold">{isArabic ? 'الرفع' : 'Upload'}</span>
                        </div>
                    </div>
                </div>

                {/* Step 1: Content Type Selection */}
                {step === 1 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold mb-2">
                                {isArabic ? 'اختر نوع المحتوى' : 'Choose Content Type'}
                            </h2>
                            <p className="text-muted-foreground">
                                {isArabic ? 'ما نوع المحتوى الذي تريد رفعه؟' : 'What type of content do you want to upload?'}
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    setContentType('VIDEO')
                                    setStep(2)
                                }}
                                className={`p-8 rounded-xl border-2 transition-all ${
                                    contentType === 'VIDEO'
                                        ? 'border-purple-500 bg-purple-500/10'
                                        : 'border-border bg-card hover:border-purple-500/50'
                                }`}
                            >
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full mb-4">
                                    <Video className="w-8 h-8 text-purple-500" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">{isArabic ? 'فيديو' : 'Video'}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {isArabic ? 'رفع محتوى فيديو تعليمي' : 'Upload video content'}
                                </p>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    setContentType('IMAGE')
                                    setStep(2)
                                }}
                                className={`p-8 rounded-xl border-2 transition-all ${
                                    contentType === 'IMAGE'
                                        ? 'border-blue-500 bg-blue-500/10'
                                        : 'border-border bg-card hover:border-blue-500/50'
                                }`}
                            >
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full mb-4">
                                    <ImageIcon className="w-8 h-8 text-blue-500" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">{isArabic ? 'صورة' : 'Image'}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {isArabic ? 'رفع صورة أو إنفوجرافيك' : 'Upload image or infographic'}
                                </p>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    setContentType('TEXT')
                                    setStep(2)
                                }}
                                className={`p-8 rounded-xl border-2 transition-all ${
                                    contentType === 'TEXT'
                                        ? 'border-green-500 bg-green-500/10'
                                        : 'border-border bg-card hover:border-green-500/50'
                                }`}
                            >
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full mb-4">
                                    <FileText className="w-8 h-8 text-green-500" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">{isArabic ? 'نص' : 'Text'}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {isArabic ? 'إنشاء منشور نصي' : 'Create text post'}
                                </p>
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {/* Step 2: Details & File Upload */}
                {step === 2 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold mb-2">
                                {isArabic ? 'تفاصيل المحتوى' : 'Content Details'}
                            </h2>
                            <p className="text-muted-foreground">
                                {isArabic ? 'أضف المعلومات والملفات' : 'Add information and files'}
                            </p>
                        </div>

                        <div className="bg-card border border-border rounded-xl p-8 space-y-6">
                            {/* File Upload Area */}
                            {contentType !== 'TEXT' && (
                                <div>
                                    <label className="block text-sm font-semibold mb-3">
                                        {contentType === 'VIDEO' 
                                            ? (isArabic ? 'ملف الفيديو' : 'Video File')
                                            : (isArabic ? 'ملف الصورة' : 'Image File')
                                        }
                                    </label>
                                    <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-purple-500 transition-colors">
                                        {!file ? (
                                            <label className="cursor-pointer">
                                                <input
                                                    type="file"
                                                    accept={contentType === 'VIDEO' ? 'video/*' : 'image/*'}
                                                    onChange={handleFileSelect}
                                                    className="hidden"
                                                />
                                                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full mb-4">
                                                    <Upload className="w-8 h-8 text-purple-500" />
                                                </div>
                                                <p className="text-lg font-semibold mb-2">
                                                    {isArabic ? 'انقر للرفع' : 'Click to upload'}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {contentType === 'VIDEO' 
                                                        ? 'MP4, MOV, AVI up to 2GB'
                                                        : 'JPG, PNG, GIF up to 10MB'
                                                    }
                                                </p>
                                            </label>
                                        ) : (
                                            <div className="space-y-4">
                                                {previewUrl && contentType === 'IMAGE' && (
                                                    <div className="relative w-full h-48 rounded-lg overflow-hidden">
                                                        <Image src={previewUrl} alt="Preview" fill className="object-contain" />
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        {contentType === 'VIDEO' ? (
                                                            <Video className="w-8 h-8 text-purple-500" />
                                                        ) : (
                                                            <ImageIcon className="w-8 h-8 text-blue-500" />
                                                        )}
                                                        <div className="text-left">
                                                            <p className="font-semibold">{file.name}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            setFile(null)
                                                            setPreviewUrl(null)
                                                        }}
                                                        className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-semibold mb-3">
                                    {isArabic ? 'العنوان' : 'Title'}
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder={isArabic ? 'أدخل عنوان المحتوى...' : 'Enter content title...'}
                                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    maxLength={100}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    {title.length}/100
                                </p>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-semibold mb-3">
                                    {isArabic ? 'الوصف' : 'Description'}
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder={isArabic ? 'أضف وصفاً للمحتوى...' : 'Add a description...'}
                                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[150px]"
                                    maxLength={500}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    {description.length}/500
                                </p>
                            </div>

                            {/* Visibility */}
                            <div>
                                <label className="block text-sm font-semibold mb-3">
                                    {isArabic ? 'من يمكنه المشاهدة؟' : 'Who can see this?'}
                                </label>
                                <div className="grid md:grid-cols-3 gap-4">
                                    <button
                                        onClick={() => setVisibility('FREE')}
                                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                                            visibility === 'FREE'
                                                ? 'border-blue-500 bg-blue-500/10'
                                                : 'border-border hover:border-blue-500/50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <Users className="w-5 h-5 text-blue-500" />
                                            <span className="font-bold">{isArabic ? 'مجاني' : 'Free'}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {isArabic ? 'متاح للجميع' : 'Available to everyone'}
                                        </p>
                                    </button>

                                    <button
                                        onClick={() => setVisibility('VIP')}
                                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                                            visibility === 'VIP'
                                                ? 'border-purple-500 bg-purple-500/10'
                                                : 'border-border hover:border-purple-500/50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <Star className="w-5 h-5 text-purple-500" />
                                            <span className="font-bold">VIP</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {isArabic ? 'للمشتركين VIP فقط' : 'VIP subscribers only'}
                                        </p>
                                    </button>

                                    <button
                                        onClick={() => setVisibility('VVIP')}
                                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                                            visibility === 'VVIP'
                                                ? 'border-pink-500 bg-pink-500/10'
                                                : 'border-border hover:border-pink-500/50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <Crown className="w-5 h-5 text-pink-500" />
                                            <span className="font-bold">VVIP</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {isArabic ? 'للمشتركين VVIP فقط' : 'VVIP subscribers only'}
                                        </p>
                                    </button>
                                </div>
                            </div>

                            {/* Thumbnail (for videos) */}
                            {contentType === 'VIDEO' && (
                                <div>
                                    <label className="block text-sm font-semibold mb-3">
                                        {isArabic ? 'صورة مصغرة (اختياري)' : 'Thumbnail (Optional)'}
                                    </label>
                                    <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-purple-500 transition-colors">
                                        <label className="cursor-pointer">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleThumbnailSelect}
                                                className="hidden"
                                            />
                                            {thumbnail ? (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-semibold">{thumbnail.name}</span>
                                                    <X 
                                                        className="w-5 h-5 cursor-pointer hover:text-red-500" 
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            setThumbnail(null)
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                <>
                                                    <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                                    <p className="text-sm text-muted-foreground">
                                                        {isArabic ? 'انقر لرفع صورة مصغرة' : 'Click to upload thumbnail'}
                                                    </p>
                                                </>
                                            )}
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between">
                            <Button
                                variant="outline"
                                onClick={() => setStep(1)}
                            >
                                {isArabic ? 'السابق' : 'Previous'}
                            </Button>
                            <Button
                                onClick={() => setStep(3)}
                                disabled={!title.trim() || (contentType !== 'TEXT' && !file)}
                                className="bg-gradient-to-r from-purple-600 to-pink-600"
                            >
                                {isArabic ? 'التالي' : 'Next'}
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* Step 3: Review & Upload */}
                {step === 3 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold mb-2">
                                {isArabic ? 'مراجعة والرفع' : 'Review & Upload'}
                            </h2>
                            <p className="text-muted-foreground">
                                {isArabic ? 'تأكد من صحة المعلومات قبل الرفع' : 'Confirm details before uploading'}
                            </p>
                        </div>

                        <div className="bg-card border border-border rounded-xl p-8 space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                                        {isArabic ? 'نوع المحتوى' : 'Content Type'}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        {contentType === 'VIDEO' && <Video className="w-5 h-5 text-purple-500" />}
                                        {contentType === 'IMAGE' && <ImageIcon className="w-5 h-5 text-blue-500" />}
                                        {contentType === 'TEXT' && <FileText className="w-5 h-5 text-green-500" />}
                                        <span className="font-bold">{contentType}</span>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                                        {isArabic ? 'الرؤية' : 'Visibility'}
                                    </h3>
                                    <Badge variant="outline" className="text-sm">
                                        {visibility}
                                    </Badge>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                                    {isArabic ? 'العنوان' : 'Title'}
                                </h3>
                                <p className="font-semibold">{title}</p>
                            </div>

                            {description && (
                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                                        {isArabic ? 'الوصف' : 'Description'}
                                    </h3>
                                    <p className="text-muted-foreground">{description}</p>
                                </div>
                            )}

                            {file && (
                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                                        {isArabic ? 'الملف' : 'File'}
                                    </h3>
                                    <div className="flex items-center gap-3 p-4 bg-accent rounded-lg">
                                        {contentType === 'VIDEO' ? (
                                            <Video className="w-8 h-8 text-purple-500" />
                                        ) : (
                                            <ImageIcon className="w-8 h-8 text-blue-500" />
                                        )}
                                        <div>
                                            <p className="font-semibold">{file.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {uploading && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            {isArabic ? 'جاري الرفع...' : 'Uploading...'}
                                        </span>
                                        <span className="font-bold">{uploadProgress}%</span>
                                    </div>
                                    <div className="h-2 bg-accent rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${uploadProgress}%` }}
                                            className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between">
                            <Button
                                variant="outline"
                                onClick={() => setStep(2)}
                                disabled={uploading}
                            >
                                {isArabic ? 'السابق' : 'Previous'}
                            </Button>
                            <Button
                                onClick={handleUpload}
                                disabled={uploading}
                                className="bg-gradient-to-r from-purple-600 to-pink-600"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        {isArabic ? 'جاري الرفع...' : 'Uploading...'}
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4 mr-2" />
                                        {isArabic ? 'رفع الآن' : 'Upload Now'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    )
}
