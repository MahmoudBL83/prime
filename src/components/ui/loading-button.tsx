import React from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingButtonProps extends React.ComponentProps<typeof Button> {
    loading?: boolean
    loadingText?: string
    icon?: React.ReactNode
}

export function LoadingButton({ 
    loading = false, 
    loadingText = 'Loading...', 
    icon,
    children, 
    disabled,
    className,
    ...props 
}: LoadingButtonProps) {
    return (
        <Button 
            {...props} 
            disabled={disabled || loading}
            className={cn(
                'relative transition-all duration-200',
                loading && 'cursor-not-allowed',
                className
            )}
        >
            {loading ? (
                <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{loadingText}</span>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    {icon && <span>{icon}</span>}
                    <span>{children}</span>
                </div>
            )}
        </Button>
    )
}