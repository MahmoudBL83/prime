'use client'

import React, { forwardRef, useState, useCallback } from 'react'
import { useOptimizedNavigation } from '@/hooks/useOptimizedNavigation'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface OptimizedLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string
    children: React.ReactNode
    prefetchOnHover?: boolean
    showLoadingSpinner?: boolean
    loadingDelay?: number
    className?: string
    activeClassName?: string
    isActive?: boolean
    loadingKey?: string
    disabled?: boolean
    onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
}

/**
 * Optimized Link component with prefetching and loading states
 */
export const OptimizedLink = forwardRef<HTMLAnchorElement, OptimizedLinkProps>(({
    href,
    children,
    prefetchOnHover = true,
    showLoadingSpinner = true,
    loadingDelay = 150,
    className,
    activeClassName,
    isActive = false,
    loadingKey,
    disabled = false,
    onClick,
    ...props
}, ref) => {
    const { 
        navigateWithOptimization, 
        prefetchRoute, 
        isNavigating 
    } = useOptimizedNavigation()
    
    const [isPrefetched, setIsPrefetched] = useState(false)
    const finalLoadingKey = loadingKey || `link-${href}`
    const isCurrentlyNavigating = isNavigating(finalLoadingKey)

    const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
        props.onMouseEnter?.(e)
        
        if (prefetchOnHover && !isPrefetched && !disabled) {
            prefetchRoute(href)
            setIsPrefetched(true)
        }
    }, [href, prefetchOnHover, isPrefetched, disabled, prefetchRoute, props.onMouseEnter])

    const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault()
        
        if (disabled || isCurrentlyNavigating) {
            return
        }

        // Call custom onClick if provided
        onClick?.(e)
        
        // Navigate with optimization
        navigateWithOptimization(href, finalLoadingKey, {
            prefetch: !isPrefetched,
            loadingDelay,
            showLoading: showLoadingSpinner
        })
    }, [
        disabled, 
        isCurrentlyNavigating, 
        onClick, 
        href, 
        finalLoadingKey, 
        isPrefetched, 
        loadingDelay, 
        showLoadingSpinner, 
        navigateWithOptimization
    ])

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLAnchorElement>) => {
        props.onKeyDown?.(e)
        
        if ((e.key === 'Enter' || e.key === ' ') && !disabled && !isCurrentlyNavigating) {
            e.preventDefault()
            handleClick(e as any)
        }
    }, [props.onKeyDown, disabled, isCurrentlyNavigating, handleClick])

    const combinedClassName = cn(
        'relative inline-flex items-center transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded-lg',
        isActive && activeClassName,
        disabled && 'opacity-50 cursor-not-allowed',
        isCurrentlyNavigating && 'cursor-wait',
        className
    )

    return (
        <a
            ref={ref}
            href={href}
            className={combinedClassName}
            onMouseEnter={handleMouseEnter}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            aria-disabled={disabled || isCurrentlyNavigating}
            {...props}
        >
            {showLoadingSpinner && isCurrentlyNavigating && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            {children}
        </a>
    )
})

OptimizedLink.displayName = 'OptimizedLink'

/**
 * Optimized navigation button component
 */
interface OptimizedNavButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
    href: string
    children: React.ReactNode
    loadingKey?: string
    showLoadingSpinner?: boolean
    loadingDelay?: number
    prefetch?: boolean
    variant?: 'default' | 'ghost' | 'outline'
    size?: 'sm' | 'md' | 'lg'
    isActive?: boolean
    onClick?: () => void
}

export const OptimizedNavButton = forwardRef<HTMLButtonElement, OptimizedNavButtonProps>(({
    href,
    children,
    loadingKey,
    showLoadingSpinner = true,
    loadingDelay = 150,
    prefetch = true,
    variant = 'default',
    size = 'md',
    isActive = false,
    disabled = false,
    onClick,
    className,
    ...props
}, ref) => {
    const { navigateWithOptimization, isNavigating } = useOptimizedNavigation()
    
    const finalLoadingKey = loadingKey || `nav-button-${href}`
    const isCurrentlyNavigating = isNavigating(finalLoadingKey)

    const handleClick = useCallback(() => {
        if (disabled || isCurrentlyNavigating) {
            return
        }

        onClick?.()
        
        navigateWithOptimization(href, finalLoadingKey, {
            prefetch,
            loadingDelay,
            showLoading: showLoadingSpinner
        })
    }, [
        disabled,
        isCurrentlyNavigating,
        onClick,
        href,
        finalLoadingKey,
        prefetch,
        loadingDelay,
        showLoadingSpinner,
        navigateWithOptimization
    ])

    const baseClasses = 'relative inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded-lg'
    
    const variantClasses = {
        default: 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl',
        ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
        outline: 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
    }
    
    const sizeClasses = {
        sm: 'px-3 py-2 text-sm',
        md: 'px-4 py-2.5 text-base',
        lg: 'px-6 py-3 text-lg'
    }

    const combinedClassName = cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        isActive && 'bg-purple-700 dark:bg-purple-600',
        disabled && 'opacity-50 cursor-not-allowed',
        isCurrentlyNavigating && 'cursor-wait',
        className
    )

    return (
        <button
            ref={ref}
            type="button"
            className={combinedClassName}
            onClick={handleClick}
            disabled={disabled || isCurrentlyNavigating}
            {...props}
        >
            {showLoadingSpinner && isCurrentlyNavigating && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            {children}
        </button>
    )
})

OptimizedNavButton.displayName = 'OptimizedNavButton'