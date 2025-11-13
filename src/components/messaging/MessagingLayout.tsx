'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MessagingLayoutProps {
    children: ReactNode;
    sidebarOpen: boolean;
    onToggleSidebar: () => void;
    isConnected?: boolean;
}

export default function MessagingLayout({
    children,
    sidebarOpen,
    onToggleSidebar,
    isConnected = false
}: MessagingLayoutProps) {
    return (
        <div className="h-screen flex flex-col bg-background">
            {/* Header */}
            <header className="bg-background border-b border-border px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={onToggleSidebar}
                        className="lg:hidden p-2 rounded-md hover:bg-card-hover"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-semibold text-foreground">Messages</h1>
                </div>

                <div className="flex items-center space-x-2">
                    {/* Connection status */}
                    <div className="flex items-center space-x-2">
                        <div className={cn(
                            "w-2 h-2 rounded-full",
                            isConnected ? "bg-green-500" : "bg-red-500"
                        )} />
                        <span className="text-sm text-muted-foreground hidden sm:block">
                            {isConnected ? "Connected" : "Disconnected"}
                        </span>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <div className="flex-1 flex overflow-hidden">
                {children}
            </div>
        </div>
    );
}