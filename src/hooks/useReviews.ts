'use client';

import { useState, useEffect } from 'react';

interface ReviewUser {
    id: string;
    name: string;
    arabicName: string | null;
    profileImage: string | null;
}

interface Review {
    id: string;
    rating: number;
    title: string | null;
    comment: string;
    helpful: number;
    verified: boolean;
    createdAt: string;
    user: ReviewUser;
}

interface ReviewStats {
    averageRating: number;
    totalReviews: number;
    recommendationPercentage: number;
    ratingBreakdown: {
        rating: number;
        count: number;
        percentage: number;
    }[];
}

interface UseReviewsReturn {
    reviews: Review[];
    stats: ReviewStats | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
    loadMore: () => void;
    hasMore: boolean;
}

export function useReviews(courseId: string, initialLimit: number = 10): UseReviewsReturn {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState<ReviewStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchReviews = async (pageNum: number = 1, reset: boolean = false) => {
        try {
            if (pageNum === 1) setLoading(true);
            setError(null);

            const response = await fetch(`/api/courses/${courseId}/reviews?page=${pageNum}&limit=${initialLimit}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (reset || pageNum === 1) {
                setReviews(data.reviews || []);
            } else {
                setReviews(prev => [...prev, ...(data.reviews || [])]);
            }
            
            setStats(data.stats);
            setHasMore(pageNum < data.pagination.pages);
            
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch reviews';
            setError(errorMessage);
            console.error('Reviews fetch error:', err);
        } finally {
            if (pageNum === 1) setLoading(false);
        }
    };

    const loadMore = () => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchReviews(nextPage, false);
        }
    };

    const refetch = () => {
        setPage(1);
        fetchReviews(1, true);
    };

    useEffect(() => {
        if (courseId) {
            fetchReviews(1, true);
        }
    }, [courseId]);

    return {
        reviews,
        stats,
        loading,
        error,
        refetch,
        loadMore,
        hasMore
    };
}