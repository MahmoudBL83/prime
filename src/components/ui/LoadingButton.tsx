'use client';

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface LoadingButtonProps {
    children: ReactNode;
    loading?: boolean;
    loadingText?: string;
    disabled?: boolean;
    onClick?: () => void;
    className?: string;
    size?: 'default' | 'sm' | 'lg' | 'icon';
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    type?: 'button' | 'submit' | 'reset';
}

export function LoadingButton({
    children,
    loading = false,
    loadingText,
    disabled = false,
    onClick,
    className,
    size = 'default',
    variant = 'default',
    type = 'button',
    ...props
}: LoadingButtonProps) {
    return (
        <Button
            type={type}
            size={size}
            variant={variant}
            disabled={loading || disabled}
            onClick={onClick}
            className={cn(className)}
            {...props}
        >
            {loading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {loadingText || children}
                </>
            ) : (
                children
            )}
        </Button>
    );
}