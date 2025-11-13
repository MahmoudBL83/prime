'use client';

import { useState, useEffect } from 'react';
import { useLocaleSafe } from './useTranslationsSafe';

interface Course {
    id: string;
    title: string;
    titleAr: string;
    description: string;
    descriptionAr: string;
    category: string;
    skillLevel: string;
    thumbnailUrl: string | null;
    duration: number;
    price: number;
    rating: number;
    status: string;
    creator: {
        user: {
            id: string;
            name: string;
            arabicName: string;
            profileImage: string | null;
        };
    };
    _count?: {
        enrollments: number;
    };
}

interface UseCoursesOptions {
    category?: string;
    skillLevel?: string;
    search?: string;
    limit?: number;
    featured?: boolean;
}

interface UseCoursesReturn {
    courses: Course[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useCourses(options: UseCoursesOptions = {}): UseCoursesReturn {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            setError(null);

            const searchParams = new URLSearchParams();
            if (options.category) searchParams.set('category', options.category);
            if (options.skillLevel) searchParams.set('skillLevel', options.skillLevel);
            if (options.search) searchParams.set('search', options.search);
            if (options.limit) searchParams.set('limit', options.limit.toString());
            if (options.featured) searchParams.set('featured', 'true');

            const response = await fetch(`/api/courses?${searchParams.toString()}`);

            if (!response.ok) {
                throw new Error('Failed to fetch courses');
            }

            const data = await response.json();
            setCourses(data.courses || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, [options.category, options.skillLevel, options.search, options.limit, options.featured]);

    return {
        courses,
        loading,
        error,
        refetch: fetchCourses
    };
}

// Helper function to convert Course to ContentItem
export function courseToContentItem(course: Course) {
    const locale = useLocaleSafe();

    // Convert duration from minutes to HH:MM format
    const formatDurationFromMinutes = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}:${remainingMinutes.toString().padStart(2, '0')}`;
    };

    // Get title based on current locale
    const getTitle = () => {
        if (locale === 'ar') {
            return course.titleAr || course.title;
        }
        return course.title || course.titleAr;
    };

    // Get description based on current locale
    const getDescription = () => {
        if (locale === 'ar') {
            return course.descriptionAr || course.description;
        }
        return course.description || course.descriptionAr;
    };

    // Get instructor name based on current locale
    const getInstructorName = () => {
        if (locale === 'ar') {
            return course.creator.user.arabicName || course.creator.user.name;
        }
        return course.creator.user.name || course.creator.user.arabicName;
    };

    // Get background image based on course category and ID
    const getBackgroundImage = (courseId: string, category: string) => {
        // Map of course images based on category or specific courses
        const courseImages: { [key: string]: string } = {
            // Programming courses
            'PROGRAMMING': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=450&fit=crop',
            'برمجة': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=450&fit=crop',
            'CATEGORY_A': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=450&fit=crop',

            // Design courses
            'DESIGN': 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=450&fit=crop',
            'تصميم': 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=450&fit=crop',

            // Business courses
            'BUSINESS': 'https://images.unsplash.com/photo-1557838923-2985c318be48?w=800&h=450&fit=crop',
            'أعمال': 'https://images.unsplash.com/photo-1557838923-2985c318be48?w=800&h=450&fit=crop',

            // Marketing courses
            'MARKETING': 'https://images.unsplash.com/photo-1557838923-2985c318be48?w=800&h=450&fit=crop',
            'تسويق': 'https://images.unsplash.com/photo-1557838923-2985c318be48?w=800&h=450&fit=crop',

            // Technology courses
            'تكنولوجيا': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop',
            'TECHNOLOGY': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop',

            // Data Science courses
            'DATA_SCIENCE': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop',
            'علم البيانات': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop',

            // Personal Development courses
            'PERSONAL_DEVELOPMENT': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=450&fit=crop',
            'التطوير الشخصي': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=450&fit=crop',

            // Photography courses
            'PHOTOGRAPHY': 'https://images.unsplash.com/photo-1542038784456-1c8e0b5d3c1c?w=800&h=450&fit=crop',
            'التصوير الفوتوغرافي': 'https://images.unsplash.com/photo-1542038784456-1c8e0b5d3c1c?w=800&h=450&fit=crop',

            // Music courses
            'MUSIC': 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=450&fit=crop',
            'موسيقى': 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=450&fit=crop',

            // Health courses
            'HEALTH': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=450&fit=crop',
            'صحة': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=450&fit=crop',

            // Language courses
            'LANGUAGE': 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=450&fit=crop',
            'لغة': 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=450&fit=crop',
        };

        // Try specific course ID first, then category, then default
        return courseImages[courseId] || courseImages[category] || 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=450&fit=crop';
    };

    return {
        id: course.id,
        title: getTitle(),
        type: 'course' as const,
        thumbnail: getBackgroundImage(course.id, course.category),
        duration: formatDurationFromMinutes(course.duration || 0),
        rating: course.rating || 4.5,
        category: course.category,
        isNew: false, // This could be based on creation date
        description: getDescription(),
        instructor: getInstructorName(),
        instructorImage: course.creator.user.profileImage,
        price: course.price
    };
}