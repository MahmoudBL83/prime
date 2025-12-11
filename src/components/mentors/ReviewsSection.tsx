'use client'

import { useState, useEffect } from 'react'
import { Star, ThumbsUp, CheckCircle, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { AvatarPlaceholder, guessGenderFromName } from '@/components/ui/avatar-placeholder'

interface Review {
    id: string
    rating: number
    title: string
    comment: string
    verified: boolean
    helpful: number
    createdAt: string
    user: {
        id: string
        name: string
        arabicName: string | null
        profileImage: string | null
    }
    course: {
        id: string
        title: string
        titleAr: string | null
    }
}

interface ReviewStats {
    totalReviews: number
    averageRating: number
    ratingDistribution: {
        5: number
        4: number
        3: number
        2: number
        1: number
    }
}

interface ReviewsSectionProps {
    mentorId: string
    isArabic: boolean
    onWriteReview?: () => void
}

export default function ReviewsSection({ mentorId, isArabic, onWriteReview }: ReviewsSectionProps) {
    const [reviews, setReviews] = useState<Review[]>([])
    const [stats, setStats] = useState<ReviewStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(false)

    useEffect(() => {
        fetchReviews()
    }, [mentorId, page])

    const fetchReviews = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/mentors/${mentorId}/reviews?page=${page}&limit=10`)
            
            if (response.ok) {
                const data = await response.json()
                setStats(data.stats)
                
                if (page === 1) {
                    setReviews(data.reviews)
                } else {
                    setReviews(prev => [...prev, ...data.reviews])
                }
                
                setHasMore(data.reviews.length === 10)
            }
        } catch (error) {
            console.error('Error fetching reviews:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleMarkHelpful = async (reviewId: string) => {
        try {
            const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
                method: 'POST'
            })
            
            if (response.ok) {
                setReviews(prev => prev.map(review =>
                    review.id === reviewId
                        ? { ...review, helpful: review.helpful + 1 }
                        : review
                ))
            }
        } catch (error) {
            console.error('Error marking review as helpful:', error)
        }
    }

    const getRatingPercentage = (rating: number) => {
        if (!stats || stats.totalReviews === 0) return 0
        return (stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution] / stats.totalReviews) * 100
    }

    if (loading && page === 1) {
        return (
            <div className="space-y-4">
                <div className="h-8 bg-card animate-pulse rounded-lg" />
                <div className="h-32 bg-card animate-pulse rounded-lg" />
                <div className="h-24 bg-card animate-pulse rounded-lg" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Rating Overview */}
            {stats && stats.totalReviews > 0 && (
                <div className="bg-card border border-border rounded-2xl p-6">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Average Rating */}
                        <div className="text-center md:text-left">
                            <div className="text-5xl font-bold text-foreground mb-2">
                                {stats.averageRating.toFixed(1)}
                            </div>
                            <div className="flex items-center justify-center md:justify-start gap-1 mb-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`w-6 h-6 ${
                                            star <= Math.round(stats.averageRating)
                                                ? 'fill-yellow-400 text-yellow-400'
                                                : 'text-gray-300'
                                        }`}
                                    />
                                ))}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {isArabic ? 'بناءً على' : 'Based on'} {stats.totalReviews} {isArabic ? 'تقييم' : 'reviews'}
                            </div>
                        </div>

                        {/* Rating Distribution */}
                        <div className="space-y-2">
                            {[5, 4, 3, 2, 1].map((rating) => (
                                <div key={rating} className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 min-w-[60px]">
                                        <span className="text-sm font-medium text-foreground">{rating}</span>
                                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    </div>
                                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-yellow-400 transition-all duration-500"
                                            style={{ width: `${getRatingPercentage(rating)}%` }}
                                        />
                                    </div>
                                    <span className="text-sm text-muted-foreground min-w-[40px] text-right">
                                        {stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Write Review Button */}
                    {onWriteReview && (
                        <div className="mt-6 pt-6 border-t border-border">
                            <Button
                                onClick={onWriteReview}
                                className="w-full md:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                            >
                                <Star className="w-4 h-4 mr-2" />
                                {isArabic ? 'كتابة تقييم' : 'Write a Review'}
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Reviews List */}
            <AnimatePresence mode="popLayout">
                {reviews.length === 0 && !loading ? (
                    <div className="text-center py-12">
                        <Star className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            {isArabic ? 'لا توجد تقييمات بعد' : 'No reviews yet'}
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            {isArabic ? 'كن أول من يقيم هذا المعلم' : 'Be the first to review this mentor'}
                        </p>
                        {onWriteReview && (
                            <Button
                                onClick={onWriteReview}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                            >
                                <Star className="w-4 h-4 mr-2" />
                                {isArabic ? 'كتابة تقييم' : 'Write a Review'}
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reviews.map((review, index) => (
                            <motion.div
                                key={review.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-card border border-border rounded-2xl p-6 hover:border-purple-500/30 transition-all"
                            >
                                {/* Review Header */}
                                <div className="flex items-start gap-4 mb-4">
                                    {review.user.profileImage ? (
                                        <Image
                                            src={review.user.profileImage}
                                            alt={review.user.name}
                                            width={48}
                                            height={48}
                                            className="rounded-full object-cover w-12 h-12"
                                        />
                                    ) : (
                                        <AvatarPlaceholder 
                                            gender={guessGenderFromName(review.user.name)} 
                                            size={48} 
                                            className="rounded-full flex-shrink-0"
                                        />
                                    )}
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <span className="font-semibold text-foreground">
                                                {isArabic && review.user.arabicName ? review.user.arabicName : review.user.name}
                                            </span>
                                            {review.verified && (
                                                <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 rounded-full">
                                                    <CheckCircle className="w-3 h-3 text-blue-500" />
                                                    <span className="text-xs text-blue-500 font-medium">
                                                        {isArabic ? 'مشترٍ مؤكد' : 'Verified Purchase'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                            <div className="flex items-center gap-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star
                                                        key={star}
                                                        className={`w-4 h-4 ${
                                                            star <= review.rating
                                                                ? 'fill-yellow-400 text-yellow-400'
                                                                : 'text-gray-300'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                            <span>•</span>
                                            <span>
                                                {new Date(review.createdAt).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                        
                                        <div className="text-xs text-muted-foreground">
                                            {isArabic ? 'دورة:' : 'Course:'}{' '}
                                            <span className="text-foreground font-medium">
                                                {isArabic && review.course.titleAr ? review.course.titleAr : review.course.title}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Review Content */}
                                <div className="space-y-2">
                                    {review.title && (
                                        <h4 className="font-semibold text-foreground text-lg">
                                            {review.title}
                                        </h4>
                                    )}
                                    <p className="text-muted-foreground leading-relaxed">
                                        {review.comment}
                                    </p>
                                </div>

                                {/* Review Actions */}
                                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
                                    <button
                                        onClick={() => handleMarkHelpful(review.id)}
                                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-purple-500 transition-colors group"
                                    >
                                        <ThumbsUp className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        <span>
                                            {isArabic ? 'مفيد' : 'Helpful'} ({review.helpful})
                                        </span>
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </AnimatePresence>

            {/* Load More Button */}
            {hasMore && !loading && (
                <div className="text-center">
                    <Button
                        onClick={() => setPage(prev => prev + 1)}
                        variant="outline"
                        className="border-border hover:border-purple-500/50"
                    >
                        {isArabic ? 'تحميل المزيد' : 'Load More'}
                    </Button>
                </div>
            )}

            {/* Loading More */}
            {loading && page > 1 && (
                <div className="text-center py-4">
                    <div className="inline-block w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
            )}
        </div>
    )
}
