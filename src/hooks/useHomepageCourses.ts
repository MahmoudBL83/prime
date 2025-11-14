'use client';

import { useState, useEffect } from 'react';

interface HomepageCourseSectionData {
    id: string;
    title: string;
    titleAr: string;
    type: 'course' | 'series' | 'masterclass' | 'workshop';
    thumbnail: string;
    duration?: string;
    rating?: number;
    category?: string;
    categoryKey?: string;
    isNew?: boolean;
    isTopRated?: boolean;
    topPosition?: number;
    instructor?: string;
    instructorKey?: string;
    instructorImage?: string | null;
    description?: string;
    descriptionAr?: string;
    price?: number;
    studentCount?: number;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

interface HomepageCoursesData {
    topCourses: HomepageCourseSectionData[];
    newReleases: HomepageCourseSectionData[];
    featuredCourses: HomepageCourseSectionData[];
    totalCourses: number;
}

interface UseHomepageCoursesReturn {
    data: HomepageCoursesData | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

// Client-side cache - 3 minutes
const CACHE_KEY = 'homepage-courses-cache'
const CACHE_DURATION = 3 * 60 * 1000 // 3 minutes

interface CacheEntry {
    data: HomepageCoursesData;
    timestamp: number;
}

// In-memory cache for immediate reuse
let memoryCache: CacheEntry | null = null

const getFromCache = (): HomepageCoursesData | null => {
    // Check memory cache first
    if (memoryCache && Date.now() - memoryCache.timestamp < CACHE_DURATION) {
        return memoryCache.data
    }
    
    // Check localStorage cache
    try {
        const cached = localStorage.getItem(CACHE_KEY)
        if (cached) {
            const parsed: CacheEntry = JSON.parse(cached)
            if (Date.now() - parsed.timestamp < CACHE_DURATION) {
                memoryCache = parsed // Update memory cache
                return parsed.data
            }
        }
    } catch (err) {
        // Ignore cache errors
    }
    
    return null
}

const setToCache = (data: HomepageCoursesData) => {
    const entry: CacheEntry = {
        data,
        timestamp: Date.now()
    }
    
    // Set memory cache
    memoryCache = entry
    
    // Set localStorage cache
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(entry))
    } catch (err) {
        // Ignore cache errors (storage full, etc.)
    }
}

export function useHomepageCourses(): UseHomepageCoursesReturn {
    const [data, setData] = useState<HomepageCoursesData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async (skipCache = false) => {
        try {
            setError(null);
            
            // Try cache first (unless explicitly skipping)
            if (!skipCache) {
                const cached = getFromCache()
                if (cached) {
                    setData(cached)
                    setLoading(false)
                    return
                }
            }

            setLoading(true);

            const response = await fetch('/api/courses/homepage');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            setData(result);
            
            // Cache the result
            setToCache(result)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch homepage courses';
            setError(errorMessage);
            console.error('Homepage courses fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return {
        data,
        loading,
        error,
        refetch: () => fetchData(true) // Skip cache on manual refetch
    };
}
