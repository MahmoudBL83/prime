'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface Notification {
    id: string;
    type: 'MESSAGE' | 'MENTION' | 'GROUP_INVITE' | 'GROUP_JOIN' | 'REACTION' | 'SYSTEM';
    title: string;
    message: string;
    data?: any;
    isRead: boolean;
    createdAt: string;
}

interface NotificationToastProps {
    notification: Notification;
    onClose: (id: string) => void;
    onClick: (notification: Notification) => void;
}

export default function NotificationToast({
    notification,
    onClose,
    onClick,
}: NotificationToastProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Animate in
        setIsVisible(true);

        // Auto close after 5 seconds
        const timer = setTimeout(() => {
            handleClose();
        }, 5000);

        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => onClose(notification.id), 300); // Wait for animation
    };

    const getIcon = () => {
        switch (notification.type) {
            case 'MESSAGE':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                );
            case 'MENTION':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                );
            case 'GROUP_INVITE':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                );
            case 'REACTION':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
        }
    };

    const getTypeColor = () => {
        switch (notification.type) {
            case 'MESSAGE':
                return 'border-blue-500 bg-blue-50';
            case 'MENTION':
                return 'border-yellow-500 bg-yellow-50';
            case 'GROUP_INVITE':
                return 'border-green-500 bg-green-50';
            case 'REACTION':
                return 'border-purple-500 bg-purple-50';
            default:
                return 'border-gray-500 bg-background';
        }
    };

    return (
        <div
            className={cn(
                "fixed top-4 right-4 z-50 max-w-sm w-full transform transition-all duration-300",
                isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
            )}
        >
            <div
                className={cn(
                    "p-4 rounded-lg border-l-4 shadow-lg cursor-pointer",
                    getTypeColor()
                )}
                onClick={() => onClick(notification)}
            >
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <div className="text-blue-600">
                            {getIcon()}
                        </div>
                    </div>

                    <div className="ml-3 w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">
                            {notification.title}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {notification.message}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {new Date(notification.createdAt).toLocaleTimeString()}
                        </p>
                    </div>

                    <div className="ml-4 flex-shrink-0 flex">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClose();
                            }}
                            className="text-muted-foreground hover:text-muted-foreground"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}