import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { toast } from 'react-hot-toast'

/**
 * Custom hook for handling navigation with loading states
 */
export function useNavigationLoading() {
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
    const router = useRouter()
    const pathname = usePathname()

    // Clear all loading states when pathname changes (navigation completes)
    useEffect(() => {
        setLoadingStates({})
    }, [pathname])

    const navigateWithLoading = async (
        path: string, 
        loadingKey: string = 'default',
        delay: number = 300
    ) => {
        try {
            // Set loading state
            setLoadingStates(prev => ({ ...prev, [loadingKey]: true }))
            
            // Add small delay to show loading animation
            await new Promise(resolve => setTimeout(resolve, delay))
            
            // Navigate
            router.push(path)
            
            // Fallback timeout to clear loading state if navigation doesn't complete
            setTimeout(() => {
                setLoadingStates(prev => ({ ...prev, [loadingKey]: false }))
            }, 5000) // 5 second fallback
        } catch (error) {
            console.error('Navigation error:', error)
            toast.error('Navigation failed')
            // Reset loading state on error
            setLoadingStates(prev => ({ ...prev, [loadingKey]: false }))
        }
    }

    const isLoading = (loadingKey: string = 'default'): boolean => {
        return loadingStates[loadingKey] || false
    }

    const resetLoading = (loadingKey?: string) => {
        if (loadingKey) {
            setLoadingStates(prev => ({ ...prev, [loadingKey]: false }))
        } else {
            setLoadingStates({})
        }
    }

    return {
        navigateWithLoading,
        isLoading,
        resetLoading,
        loadingStates
    }
}
