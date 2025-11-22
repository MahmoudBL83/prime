'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Globe,
    Menu,
    X,
    BookOpen,
    Crown,
    MessageCircle,
    User,
} from 'lucide-react';
import { NavigationAuthSection } from '@/components/navigation/NavigationAuthSection';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useLocaleSafe } from '@/hooks/useTranslationsSafe';
import { useNavigationLoading } from '@/hooks/useNavigationLoading';
import { motion, AnimatePresence } from 'framer-motion';

export function Navigation() {
    const session = useSession();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { navigateWithLoading, isLoading } = useNavigationLoading();
    const locale = useLocaleSafe();

    // Close mobile menu when window is resized to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setIsMobileMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        // Cleanup on unmount
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMobileMenuOpen]);

    // Check if a navigation item is active
    const isActive = (path: string) => {
        if (path === `/${locale}`) {
            return pathname === `/${locale}` || pathname === '/';
        }
        return pathname?.startsWith(path);
    };

    // Navigation items configuration - Apple TV Style
    const navigationItems = [
        {
            label: 'Courses',
            path: `/${locale}/courses`,
            icon: BookOpen,
            key: 'nav-courses',
            description: 'Browse all courses'
        },
        {
            label: 'Mentors',
            path: `/${locale}/mentors`,
            icon: Crown,
            key: 'nav-mentors',
            description: 'Connect with expert mentors'
        },

    ];

    return (
        <>
            {/* Apple TV Navigation - Clean & Minimal */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-white/10">
                <div className="max-w-screen-2xl mx-auto px-8">
                    <div className="flex items-center justify-between h-[52px]">
                        {/* Left: Logo */}
                        <div className="flex items-center">
                            {/* Prime Logo */}
                            <button
                                onClick={() => navigateWithLoading(`/${locale}/courses`, 'nav-home')}
                                disabled={isLoading('nav-home')}
                                className="text-white text-xl font-semibold tracking-tight hover:opacity-80 transition-opacity"
                            >
                                Prime
                            </button>
                        </div>

                        {/* Center: Navigation Links */}
                        <div className="hidden lg:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
                            {navigationItems.slice(0, 3).map((item) => {
                                const active = isActive(item.path);
                                return (
                                    <button
                                        key={item.key}
                                        onClick={() => navigateWithLoading(item.path, item.key)}
                                        disabled={isLoading(item.key)}
                                        className={`text-sm font-semibold transition-opacity ${
                                            active ? 'text-white' : 'text-white/70 hover:text-white'
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Right: Theme, Language, Messaging & Account */}
                        <div className="flex items-center space-x-6">
                            {/* Theme Toggle */}
                            <div className="hidden lg:block">
                                <ThemeToggle />
                            </div>

                            {/* Language Switcher */}
                            <button
                                className="hidden lg:flex items-center text-white/70 hover:text-white transition-colors"
                                aria-label="Language"
                            >
                                <Globe className="w-5 h-5" />
                            </button>

                            {/* Messaging */}
                            <button
                                onClick={() => navigateWithLoading(`/${locale}/messages`, 'nav-messages')}
                                disabled={isLoading('nav-messages')}
                                className="hidden lg:flex items-center text-white/70 hover:text-white transition-colors"
                                aria-label="Messages"
                            >
                                <MessageCircle className="w-5 h-5" />
                            </button>

                            {/* Account */}
                            <button
                                onClick={() => navigateWithLoading(`/${locale}/profile`, 'nav-profile')}
                                disabled={isLoading('nav-profile')}
                                className="hidden lg:flex items-center text-white/70 hover:text-white transition-colors"
                                aria-label="Account"
                            >
                                <User className="w-5 h-5" />
                            </button>

                            {/* Mobile Menu */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="lg:hidden text-white/70 hover:text-white transition-colors"
                                aria-label="Menu"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Apple TV Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-40 lg:hidden"
                    >
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 bg-black/95"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />

                        {/* Menu Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                            className="fixed top-0 left-0 right-0 bg-black border-b border-white/10"
                        >
                            <div className="max-w-screen-2xl mx-auto px-8 py-6">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="text-xl font-semibold text-white">
                                        Prime
                                    </div>
                                    <button
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="text-white/70 hover:text-white transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Navigation Links */}
                                <div className="space-y-4">
                                    {navigationItems.map((item) => {
                                        const active = isActive(item.path);
                                        return (
                                            <button
                                                key={item.key}
                                                onClick={() => {
                                                    navigateWithLoading(item.path, item.key);
                                                    setIsMobileMenuOpen(false);
                                                }}
                                                disabled={isLoading(item.key)}
                                                className={`block w-full text-left text-base py-2 transition-colors ${
                                                    active ? 'text-white' : 'text-white/70 hover:text-white'
                                                }`}
                                            >
                                                {item.label}
                                            </button>
                                        );
                                    })}
                                    
                                    <div className="pt-4 border-t border-white/10 space-y-4">
                                        {/* Mobile Icons */}
                                        <div className="flex items-center justify-around px-4 py-2">
                                            <ThemeToggle />
                                            <button className="text-white/70 hover:text-white transition-colors">
                                                <Globe className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    navigateWithLoading(`/${locale}/messages`, 'nav-messages');
                                                    setIsMobileMenuOpen(false);
                                                }}
                                                className="text-white/70 hover:text-white transition-colors"
                                            >
                                                <MessageCircle className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    navigateWithLoading(`/${locale}/profile`, 'nav-profile');
                                                    setIsMobileMenuOpen(false);
                                                }}
                                                className="text-white/70 hover:text-white transition-colors"
                                            >
                                                <User className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
