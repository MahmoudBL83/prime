'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'

interface NavigationMetrics {
    route: string
    startTime: number
    endTime?: number
    duration?: number
    loadingDelay?: number
    prefetched?: boolean
    userAgent?: string
    timestamp: number
}

interface PerformanceMetrics {
    averageNavigationTime: number
    totalNavigations: number
    slowestNavigation: NavigationMetrics | null
    fastestNavigation: NavigationMetrics | null
    recentNavigations: NavigationMetrics[]
    errorRate: number
    prefetchHitRate: number
}

interface NavigationError {
    route: string
    error: string
    timestamp: number
    userAgent: string
}

const STORAGE_KEY = 'navigation_metrics'
const ERROR_STORAGE_KEY = 'navigation_errors'
const MAX_STORED_METRICS = 50
const MAX_STORED_ERRORS = 20

export function useNavigationPerformance() {
    const [currentMetrics, setCurrentMetrics] = useState<NavigationMetrics | null>(null)
    const [performanceData, setPerformanceData] = useState<PerformanceMetrics>({
        averageNavigationTime: 0,
        totalNavigations: 0,
        slowestNavigation: null,
        fastestNavigation: null,
        recentNavigations: [],
        errorRate: 0,
        prefetchHitRate: 0
    })
    
    const pathname = usePathname()
    const metricsRef = useRef<NavigationMetrics[]>([])
    const errorsRef = useRef<NavigationError[]>([])
    const isInitialized = useRef(false)

    // Load stored metrics on mount
    useEffect(() => {
        if (typeof window !== 'undefined' && !isInitialized.current) {
            try {
                const stored = localStorage.getItem(STORAGE_KEY)
                const storedErrors = localStorage.getItem(ERROR_STORAGE_KEY)
                
                if (stored) {
                    metricsRef.current = JSON.parse(stored)
                }
                
                if (storedErrors) {
                    errorsRef.current = JSON.parse(storedErrors)
                }
                
                calculatePerformanceMetrics()
                isInitialized.current = true
            } catch (error) {
                console.warn('Failed to load navigation metrics:', error)
            }
        }
    }, [])

    // Save metrics to localStorage
    const saveMetrics = useCallback(() => {
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(metricsRef.current))
                localStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(errorsRef.current))
            } catch (error) {
                console.warn('Failed to save navigation metrics:', error)
            }
        }
    }, [])

    // Calculate performance metrics
    const calculatePerformanceMetrics = useCallback(() => {
        const metrics = metricsRef.current
        const errors = errorsRef.current
        
        if (metrics.length === 0) {
            return
        }

        const completedNavigations = metrics.filter(m => m.duration !== undefined)
        const totalDuration = completedNavigations.reduce((sum, m) => sum + (m.duration || 0), 0)
        const averageNavigationTime = completedNavigations.length > 0 ? totalDuration / completedNavigations.length : 0

        const slowestNavigation = completedNavigations.reduce((slowest, current) => 
            !slowest || (current.duration || 0) > (slowest.duration || 0) ? current : slowest
        , null as NavigationMetrics | null)

        const fastestNavigation = completedNavigations.reduce((fastest, current) => 
            !fastest || (current.duration || 0) < (fastest.duration || 0) ? current : fastest
        , null as NavigationMetrics | null)

        const prefetchedNavigations = metrics.filter(m => m.prefetched).length
        const prefetchHitRate = metrics.length > 0 ? prefetchedNavigations / metrics.length : 0

        const totalAttempts = metrics.length + errors.length
        const errorRate = totalAttempts > 0 ? errors.length / totalAttempts : 0

        setPerformanceData({
            averageNavigationTime,
            totalNavigations: metrics.length,
            slowestNavigation,
            fastestNavigation,
            recentNavigations: metrics.slice(-10),
            errorRate,
            prefetchHitRate
        })
    }, [])

    // Start tracking a navigation
    const startNavigation = useCallback((route: string, prefetched = false, loadingDelay = 0) => {
        const metric: NavigationMetrics = {
            route,
            startTime: Date.now(),
            loadingDelay,
            prefetched,
            userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
            timestamp: Date.now()
        }
        
        setCurrentMetrics(metric)
        return metric
    }, [])

    // End tracking a navigation
    const endNavigation = useCallback((metric?: NavigationMetrics) => {
        const endTime = Date.now()
        const navigationMetric = metric || currentMetrics
        
        if (navigationMetric) {
            const completedMetric: NavigationMetrics = {
                ...navigationMetric,
                endTime,
                duration: endTime - navigationMetric.startTime
            }
            
            // Add to metrics array
            metricsRef.current = [...metricsRef.current, completedMetric].slice(-MAX_STORED_METRICS)
            
            // Recalculate performance data
            calculatePerformanceMetrics()
            
            // Save to localStorage
            saveMetrics()
            
            setCurrentMetrics(null)
            
            return completedMetric
        }
        
        return null
    }, [currentMetrics, calculatePerformanceMetrics, saveMetrics])

    // Record a navigation error
    const recordError = useCallback((route: string, error: string) => {
        const errorRecord: NavigationError = {
            route,
            error,
            timestamp: Date.now(),
            userAgent: typeof window !== 'undefined' ? navigator.userAgent : ''
        }
        
        errorsRef.current = [...errorsRef.current, errorRecord].slice(-MAX_STORED_ERRORS)
        
        // Recalculate metrics to update error rate
        calculatePerformanceMetrics()
        saveMetrics()
    }, [calculatePerformanceMetrics, saveMetrics])

    // Auto-end navigation when pathname changes
    useEffect(() => {
        if (currentMetrics && pathname !== currentMetrics.route) {
            endNavigation()
        }
    }, [pathname, currentMetrics, endNavigation])

    // Get performance report
    const getPerformanceReport = useCallback(() => {
        return {
            ...performanceData,
            allMetrics: metricsRef.current,
            allErrors: errorsRef.current,
            currentNavigation: currentMetrics
        }
    }, [performanceData, currentMetrics])

    // Clear all metrics
    const clearMetrics = useCallback(() => {
        metricsRef.current = []
        errorsRef.current = []
        setCurrentMetrics(null)
        setPerformanceData({
            averageNavigationTime: 0,
            totalNavigations: 0,
            slowestNavigation: null,
            fastestNavigation: null,
            recentNavigations: [],
            errorRate: 0,
            prefetchHitRate: 0
        })
        
        if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY)
            localStorage.removeItem(ERROR_STORAGE_KEY)
        }
    }, [])

    // Get navigation insights
    const getNavigationInsights = useCallback(() => {
        const insights = []
        
        if (performanceData.averageNavigationTime > 2000) {
            insights.push('Average navigation time is high. Consider implementing more prefetching.')
        }
        
        if (performanceData.errorRate > 0.1) {
            insights.push('High error rate detected. Check network connectivity and error handling.')
        }
        
        if (performanceData.prefetchHitRate < 0.3) {
            insights.push('Low prefetch hit rate. Consider more aggressive prefetching on hover/focus.')
        }
        
        if (performanceData.slowestNavigation && performanceData.slowestNavigation.duration! > 5000) {
            insights.push(`Slowest navigation (${performanceData.slowestNavigation.route}) took ${performanceData.slowestNavigation.duration}ms. Investigate this route.`)
        }
        
        return insights
    }, [performanceData])

    return {
        // Current state
        currentMetrics,
        performanceData,
        
        // Actions
        startNavigation,
        endNavigation,
        recordError,
        
        // Analytics
        getPerformanceReport,
        getNavigationInsights,
        clearMetrics,
        
        // Computed values
        isNavigating: currentMetrics !== null,
        hasMetrics: metricsRef.current.length > 0
    }
}

/**
 * Hook for monitoring Web Vitals and page performance
 */
export function useWebVitals() {
    const [vitals, setVitals] = useState<{
        fcp?: number // First Contentful Paint
        lcp?: number // Largest Contentful Paint
        fid?: number // First Input Delay
        cls?: number // Cumulative Layout Shift
        ttfb?: number // Time to First Byte
    }>({})

    useEffect(() => {
        if (typeof window === 'undefined') return

        // Use the web-vitals library if available, otherwise use Performance API
        const measureWebVitals = () => {
            // FCP - First Contentful Paint
            const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0] as PerformanceEntry
            if (fcpEntry) {
                setVitals(prev => ({ ...prev, fcp: fcpEntry.startTime }))
            }

            // TTFB - Time to First Byte
            const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
            if (navigationEntry) {
                setVitals(prev => ({ ...prev, ttfb: navigationEntry.responseStart - navigationEntry.requestStart }))
            }

            // LCP - Largest Contentful Paint (requires observer)
            if ('PerformanceObserver' in window) {
                try {
                    const lcpObserver = new PerformanceObserver((entryList) => {
                        const entries = entryList.getEntries()
                        if (entries.length > 0) {
                            const lastEntry = entries[entries.length - 1]
                            setVitals(prev => ({ ...prev, lcp: lastEntry.startTime }))
                        }
                    })
                    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

                    return () => lcpObserver.disconnect()
                } catch (error) {
                    console.warn('LCP measurement not supported:', error)
                }
            }
        }

        // Measure after page load
        if (document.readyState === 'complete') {
            measureWebVitals()
        } else {
            window.addEventListener('load', measureWebVitals)
            return () => window.removeEventListener('load', measureWebVitals)
        }
    }, [])

    const getVitalsReport = useCallback(() => {
        const report = {
            ...vitals,
            scores: {
                fcp: vitals.fcp ? (vitals.fcp < 1800 ? 'good' : vitals.fcp < 3000 ? 'needs-improvement' : 'poor') : 'unknown',
                lcp: vitals.lcp ? (vitals.lcp < 2500 ? 'good' : vitals.lcp < 4000 ? 'needs-improvement' : 'poor') : 'unknown',
                fid: vitals.fid ? (vitals.fid < 100 ? 'good' : vitals.fid < 300 ? 'needs-improvement' : 'poor') : 'unknown',
                cls: vitals.cls ? (vitals.cls < 0.1 ? 'good' : vitals.cls < 0.25 ? 'needs-improvement' : 'poor') : 'unknown',
                ttfb: vitals.ttfb ? (vitals.ttfb < 800 ? 'good' : vitals.ttfb < 1800 ? 'needs-improvement' : 'poor') : 'unknown',
            }
        }
        
        return report
    }, [vitals])

    return {
        vitals,
        getVitalsReport,
        hasVitals: Object.keys(vitals).length > 0
    }
}
