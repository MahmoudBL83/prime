'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Star, Send, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import toast from 'react-hot-toast'

interface ReviewModalProps {
    isOpen: boolean
    onClose: () => void
    mentorId: string
    mentorName: string
    isArabic: boolean
    onReviewSubmitted?: () => void
    courseId?: string  // Required: specific course to review
}

export default function ReviewModal({
    isOpen,
    onClose,
    mentorId,
    mentorName,
    isArabic,
    onReviewSubmitted,
    courseId
}: ReviewModalProps) {
    const [rating, setRating] = useState(0)
    const [hoveredRating, setHoveredRating] = useState(0)
    const [title, setTitle] = useState('')
    const [reviewText, setReviewText] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error(isArabic ? 'الرجاء اختيار تقييم' : 'Please select a rating')
            return
        }

        if (reviewText.trim().length < 10) {
            toast.error(isArabic ? 'الرجاء كتابة تعليق أطول' : 'Please write a longer review')
            return
        }

        if (!courseId) {
            toast.error(isArabic ? 'الرجاء اختيار دورة للتقييم' : 'Please select a course to review')
            return
        }

        setIsSubmitting(true)

        try {
            const response = await fetch(`/api/mentors/${mentorId}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    courseId,
                    rating,
                    title: title.trim() || undefined,
                    comment: reviewText.trim()
                })
            })

            if (response.ok) {
                setIsSubmitted(true)
                toast.success(isArabic ? 'تم إرسال التقييم بنجاح!' : 'Review submitted successfully!')
                
                // Wait 2 seconds then close and refresh
                setTimeout(() => {
                    onReviewSubmitted?.()
                    handleClose()
                }, 2000)
            } else {
                const error = await response.json()
                toast.error(error.error || (isArabic ? 'فشل إرسال التقييم' : 'Failed to submit review'))
            }
        } catch (error) {
            console.error('Review submission error:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        setRating(0)
        setHoveredRating(0)
        setReviewText('')
        setIsSubmitted(false)
        onClose()
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-card border border-border rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white relative">
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-2xl font-bold mb-1">
                            {isArabic ? 'تقييم المعلم' : 'Rate Mentor'}
                        </h2>
                        <p className="text-white/80 text-sm">
                            {mentorName}
                        </p>
                    </div>

                    {!isSubmitted ? (
                        <div className="p-6">
                            {/* Star Rating */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-foreground mb-3">
                                    {isArabic ? 'تقييمك' : 'Your Rating'}
                                </label>
                                <div className="flex items-center justify-center gap-2 py-4">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoveredRating(star)}
                                            onMouseLeave={() => setHoveredRating(0)}
                                            className="transition-transform hover:scale-110"
                                        >
                                            <Star
                                                className={`w-12 h-12 ${
                                                    star <= (hoveredRating || rating)
                                                        ? 'fill-yellow-400 text-yellow-400'
                                                        : 'text-gray-300'
                                                }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                                {rating > 0 && (
                                    <p className="text-center text-sm text-muted-foreground">
                                        {rating === 5 && (isArabic ? 'ممتاز!' : 'Excellent!')}
                                        {rating === 4 && (isArabic ? 'جيد جداً' : 'Very Good')}
                                        {rating === 3 && (isArabic ? 'جيد' : 'Good')}
                                        {rating === 2 && (isArabic ? 'مقبول' : 'Fair')}
                                        {rating === 1 && (isArabic ? 'ضعيف' : 'Poor')}
                                    </p>
                                )}
                            </div>

                            {/* Review Title */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    {isArabic ? 'عنوان التقييم (اختياري)' : 'Review Title (Optional)'}
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder={isArabic 
                                        ? 'مثال: معلم ممتاز ومتمكن'
                                        : 'e.g., Excellent and knowledgeable mentor'
                                    }
                                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                                    maxLength={100}
                                />
                                {title && (
                                    <p className="text-xs text-muted-foreground mt-1 text-right">
                                        {title.length}/100
                                    </p>
                                )}
                            </div>

                            {/* Review Text */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    {isArabic ? 'تعليقك (اختياري)' : 'Your Review (Optional)'}
                                </label>
                                <Textarea
                                    value={reviewText}
                                    onChange={(e) => setReviewText(e.target.value)}
                                    placeholder={isArabic 
                                        ? 'شارك تجربتك مع هذا المعلم...'
                                        : 'Share your experience with this mentor...'
                                    }
                                    rows={5}
                                    className="bg-background border-border resize-none"
                                    maxLength={500}
                                />
                                <p className="text-xs text-muted-foreground mt-2 text-right">
                                    {reviewText.length}/500
                                </p>
                            </div>

                            {/* Submit Button */}
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting || rating === 0}
                                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                        {isArabic ? 'جاري الإرسال...' : 'Submitting...'}
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5 mr-2" />
                                        {isArabic ? 'إرسال التقييم' : 'Submit Review'}
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
                            >
                                <CheckCircle className="w-12 h-12 text-white" />
                            </motion.div>
                            <h3 className="text-2xl font-bold text-foreground mb-2">
                                {isArabic ? 'شكراً لك!' : 'Thank You!'}
                            </h3>
                            <p className="text-muted-foreground">
                                {isArabic 
                                    ? 'تم إرسال تقييمك بنجاح'
                                    : 'Your review has been submitted successfully'
                                }
                            </p>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
