'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/landing/Footer';

interface MainLayoutProps {
    children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    const pathname = usePathname();
    
    // Don't show navbar/footer for admin routes, signature-courses, video player pages, messaging, or creator routes
    const isAdminRoute = pathname?.startsWith('/admin');
    const isSignatureCoursesPage = pathname?.includes('/signature-courses');
    const isVideoPlayerPage = pathname?.includes('/learn');
    const isMessagingPage = pathname?.includes('/messaging');
    const isCreatorRoute = pathname?.includes('/creator');
    
    if (isAdminRoute || isSignatureCoursesPage || isVideoPlayerPage || isMessagingPage || isCreatorRoute) {
        return <>{children}</>;
    }
    
    return (
        <div className="min-h-screen flex flex-col bg-black">
            <Navigation />
            <main className="flex-1 pt-[52px]">
                {children}
            </main>
            <Footer />
        </div>
    );
}
