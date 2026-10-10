import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { toast } from 'react-hot-toast'

/**
 * Custom hook for handling navigation with loading states.
 *
 * Navigation starts immediately; the loading key only drives button spinners
 * while the next route streams in. (An artificial delay used to be inserted
 * here, which made every click feel ~300ms slower.)
 */
export function useNavigationLoading() {
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
    const router = useRouter()
    const pathname = usePathname()

    // Clear all loading states when pathname changes (navigation completes)
    useEffect(() => {
        setLoadingStates({})
    }, [pathname])

    const navigateWithLoading = useCallback(async (
        path: string,
        loadingKey: string = 'default',
        delay: number = 0
    ) => {
        try {
            if (path === pathname) return

            setLoadingStates(prev => ({ ...prev, [loadingKey]: true }))

            if (delay > 0) {
                await new Promise(resolve => setTimeout(resolve, delay))
            }

            router.push(path)

            // Fallback timeout to clear loading state if navigation doesn't complete
            setTimeout(() => {
                setLoadingStates(prev => ({ ...prev, [loadingKey]: false }))
            }, 5000)
        } catch (error) {
            console.error('Navigation error:', error)
            toast.error('Navigation failed')
            setLoadingStates(prev => ({ ...prev, [loadingKey]: false }))
        }
    }, [router, pathname])

    const isLoading = useCallback((loadingKey: string = 'default'): boolean => {
        return loadingStates[loadingKey] || false
    }, [loadingStates])

    const resetLoading = useCallback((loadingKey?: string) => {
        if (loadingKey) {
            setLoadingStates(prev => ({ ...prev, [loadingKey]: false }))
        } else {
            setLoadingStates({})
        }
    }, [])

    return {
        navigateWithLoading,
        isLoading,
        resetLoading,
        loadingStates
    }
}
