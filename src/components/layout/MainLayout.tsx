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
    
    // Don't show navbar/footer for admin routes, signature-courses, video player pages, messaging, courses pages (list and detail), or creator routes
    const isAdminRoute = pathname?.startsWith('/admin');
    const isSignatureCoursesPage = pathname?.includes('/signature-courses');
    const isVideoPlayerPage = pathname?.includes('/learn');
    const isMessagingPage = pathname?.includes('/messaging');
    const isCoursesPage = pathname?.includes('/courses');
    const isCreatorRoute = pathname?.includes('/creator');
    
    if (isAdminRoute || isSignatureCoursesPage || isVideoPlayerPage || isMessagingPage || isCoursesPage || isCreatorRoute) {
        return <>{children}</>;
    }
    
    return (
        <div className="min-h-screen flex flex-col bg-background dark:bg-background transition-colors duration-300">
            <Navigation />
            <main className="flex-1 pt-20">
                {children}
            </main>
            <Footer />
        </div>
    );
}
