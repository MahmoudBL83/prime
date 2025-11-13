import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { toast } from 'react-hot-toast'

interface NavigationOptions {
    prefetch?: boolean
    showLoading?: boolean
    loadingDelay?: number
    timeout?: number
    onStart?: () => void
    onComplete?: () => void
    onError?: (error: Error) => void
}

interface NavigationState {
    isNavigating: boolean
    loadingKey: string | null
    error: string | null
    performanceMetrics: {
        startTime: number
        endTime?: number
        duration?: number
    } | null
}

/**
 * Optimized navigation hook with better performance and user experience
 */
export function useOptimizedNavigation() {
    const [navigationState, setNavigationState] = useState<NavigationState>({
        isNavigating: false,
        loadingKey: null,
        error: null,
        performanceMetrics: null
    })
    
    const router = useRouter()
    const pathname = usePathname()
    const abortController = useRef<AbortController | null>(null)
    const prefetchCache = useRef<Set<string>>(new Set())
    const navigationTimeout = useRef<NodeJS.Timeout | null>(null)

    // Clear navigation state when route changes
    useEffect(() => {
        if (navigationState.isNavigating) {
            setNavigationState(prev => ({
                ...prev,
                isNavigating: false,
                loadingKey: null,
                performanceMetrics: prev.performanceMetrics ? {
                    ...prev.performanceMetrics,
                    endTime: Date.now(),
                    duration: Date.now() - prev.performanceMetrics.startTime
                } : null
            }))
        }
        
        // Clear any pending timeout
        if (navigationTimeout.current) {
            clearTimeout(navigationTimeout.current)
            navigationTimeout.current = null
        }
    }, [pathname, navigationState.isNavigating])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortController.current) {
                abortController.current.abort()
            }
            if (navigationTimeout.current) {
                clearTimeout(navigationTimeout.current)
            }
        }
    }, [])

    /**
     * Prefetch a route for improved performance
     */
    const prefetchRoute = useCallback(async (path: string) => {
        if (prefetchCache.current.has(path)) {
            return // Already prefetched
        }

        try {
            // Use Next.js router prefetch with high priority
            await router.prefetch(path, { kind: 'auto' })
            prefetchCache.current.add(path)
        } catch (error) {
            console.warn('Failed to prefetch route:', path, error)
        }
    }, [router])

    /**
     * Navigate with optimized loading states and performance tracking
     */
    const navigateWithOptimization = useCallback(async (
        path: string,
        loadingKey: string = 'default',
        options: NavigationOptions = {}
    ) => {
        const {
            prefetch = true,
            showLoading = true,
            loadingDelay = 150,
            timeout = 8000,
            onStart,
            onComplete,
            onError
        } = options

        try {
            // Don't navigate if already navigating to the same path
            if (pathname === path) {
                return
            }

            // Abort any existing navigation
            if (abortController.current) {
                abortController.current.abort()
            }
            abortController.current = new AbortController()

            const startTime = Date.now()
            
            // Call onStart callback
            onStart?.()

            // Prefetch if requested and not already cached
            if (prefetch) {
                await prefetchRoute(path)
            }

            // Set loading state with optional delay for better UX
            if (showLoading) {
                const showLoadingWithDelay = async () => {
                    await new Promise(resolve => setTimeout(resolve, loadingDelay))
                    
                    // Check if navigation was aborted
                    if (abortController.current?.signal.aborted) {
                        return
                    }

                    setNavigationState(prev => ({
                        ...prev,
                        isNavigating: true,
                        loadingKey,
                        error: null,
                        performanceMetrics: { startTime }
                    }))
                }
                
                showLoadingWithDelay()
            }

            // Set navigation timeout
            navigationTimeout.current = setTimeout(() => {
                if (abortController.current && !abortController.current.signal.aborted) {
                    console.warn('Navigation timeout for:', path)
                    setNavigationState(prev => ({
                        ...prev,
                        isNavigating: false,
                        loadingKey: null,
                        error: 'Navigation timeout'
                    }))
                    toast.error('Navigation taking too long. Please try again.')
                }
            }, timeout)

            // Perform navigation
            router.push(path)
            
            // Call onComplete callback
            onComplete?.()

        } catch (error) {
            console.error('Navigation error:', error)
            
            const navigationError = error instanceof Error ? error : new Error('Navigation failed')
            
            setNavigationState(prev => ({
                ...prev,
                isNavigating: false,
                loadingKey: null,
                error: navigationError.message
            }))

            toast.error('Failed to navigate. Please try again.')
            
            // Call onError callback
            onError?.(navigationError)
        }
    }, [pathname, router, prefetchRoute])

    /**
     * Quick navigation without loading states for instant feedback
     */
    const navigateInstant = useCallback((path: string) => {
        if (pathname === path) return
        
        try {
            router.push(path)
        } catch (error) {
            console.error('Instant navigation error:', error)
            toast.error('Navigation failed')
        }
    }, [pathname, router])

    /**
     * Check if a specific navigation is in progress
     */
    const isNavigating = useCallback((loadingKey?: string) => {
        if (!loadingKey) {
            return navigationState.isNavigating
        }
        return navigationState.isNavigating && navigationState.loadingKey === loadingKey
    }, [navigationState])

    /**
     * Get performance metrics for the current navigation
     */
    const getNavigationMetrics = useCallback(() => {
        return navigationState.performanceMetrics
    }, [navigationState.performanceMetrics])

    /**
     * Reset navigation state
     */
    const resetNavigationState = useCallback(() => {
        setNavigationState({
            isNavigating: false,
            loadingKey: null,
            error: null,
            performanceMetrics: null
        })
        
        if (navigationTimeout.current) {
            clearTimeout(navigationTimeout.current)
            navigationTimeout.current = null
        }
    }, [])

    /**
     * Batch prefetch multiple routes
     */
    const batchPrefetch = useCallback(async (paths: string[]) => {
        const prefetchPromises = paths
            .filter(path => !prefetchCache.current.has(path))
            .map(path => prefetchRoute(path))
        
        try {
            await Promise.all(prefetchPromises)
        } catch (error) {
            console.warn('Batch prefetch error:', error)
        }
    }, [prefetchRoute])

    return {
        // Navigation methods
        navigateWithOptimization,
        navigateInstant,
        prefetchRoute,
        batchPrefetch,
        
        // State getters
        isNavigating,
        getNavigationMetrics,
        
        // State management
        resetNavigationState,
        
        // Raw state for advanced usage
        navigationState,
        
        // Convenience properties
        hasError: !!navigationState.error,
        error: navigationState.error
    }
}

/**
 * Hook for optimized link components with hover prefetching
 */
export function useOptimizedLink(href: string, prefetchOnHover: boolean = true) {
    const { prefetchRoute, navigateWithOptimization, isNavigating } = useOptimizedNavigation()
    const [isHovered, setIsHovered] = useState(false)

    const handleMouseEnter = useCallback(() => {
        setIsHovered(true)
        if (prefetchOnHover) {
            prefetchRoute(href)
        }
    }, [href, prefetchOnHover, prefetchRoute])

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false)
    }, [])

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        navigateWithOptimization(href, `link-${href}`)
    }, [href, navigateWithOptimization])

    return {
        handleMouseEnter,
        handleMouseLeave,
        handleClick,
        isHovered,
        isNavigating: isNavigating(`link-${href}`)
    }
}