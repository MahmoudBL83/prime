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
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { useLocaleSafe } from '@/hooks/useTranslationsSafe';
import { useNavigationLoading } from '@/hooks/useNavigationLoading';
import { motion, AnimatePresence } from 'framer-motion';

export function Navigation() {
    const session = useSession();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
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
            <nav className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-white/10" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
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
                        <div className={`hidden lg:flex items-center absolute left-1/2 transform -translate-x-1/2 ${locale === 'ar' ? 'space-x-reverse space-x-8' : 'space-x-8'}`}>
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
                        <div className={`flex items-center ${locale === 'ar' ? 'space-x-reverse space-x-6' : 'space-x-6'}`}>
                            {/* Theme Toggle */}
                            <div className="hidden lg:block">
                                <ThemeToggle />
                            </div>

                            {/* Language Switcher */}
                            <div className="hidden lg:block relative">
                                <button
                                    onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                                    className="flex items-center text-white/70 hover:text-white transition-colors"
                                    aria-label="Language"
                                >
                                    <Globe className="w-5 h-5" />
                                </button>
                                <AnimatePresence>
                                    {isLanguageMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute top-full mt-2 right-0 bg-neutral-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl min-w-[180px] z-50"
                                            onMouseLeave={() => setIsLanguageMenuOpen(false)}
                                        >
                                            <LanguageSwitcher />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Show messaging and profile only when logged in */}
                            {session?.data?.user ? (
                                <>
                                    {/* Messaging */}
                                    <button
                                        onClick={() => navigateWithLoading(`/${locale}/messages`, 'nav-messages')}
                                        disabled={isLoading('nav-messages')}
                                        className="hidden lg:flex items-center text-white/70 hover:text-white transition-colors"
                                        aria-label="Messages"
                                    >
                                        <MessageCircle className="w-5 h-5" />
                                    </button>

                                    {/* Account - Profile Menu */}
                                    <div className="hidden lg:block relative">
                                        <button
                                            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                            className="flex items-center text-white/70 hover:text-white transition-colors"
                                            aria-label="Account"
                                        >
                                            <User className="w-5 h-5" />
                                        </button>
                                        <AnimatePresence>
                                            {isProfileMenuOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="absolute top-full mt-2 right-0 bg-neutral-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl min-w-[180px] z-50"
                                                    onMouseLeave={() => setIsProfileMenuOpen(false)}
                                                >
                                                    <button
                                                        onClick={() => {
                                                            navigateWithLoading(`/${locale}/dashboard`, 'nav-dashboard');
                                                            setIsProfileMenuOpen(false);
                                                        }}
                                                        className="w-full px-4 py-2.5 text-left text-sm text-white/90 hover:bg-white/10 transition-colors flex items-center gap-2"
                                                    >
                                                        <User className="w-4 h-4" />
                                                        Dashboard
                                                    </button>
                                                    <div className="h-[0.5px] bg-white/10" />
                                                    <button
                                                        onClick={() => {
                                                            setIsProfileMenuOpen(false);
                                                            window.location.href = '/api/auth/signout';
                                                        }}
                                                        className="w-full px-4 py-2.5 text-left text-sm text-white/90 hover:bg-white/10 transition-colors flex items-center gap-2"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                        </svg>
                                                        Sign Out
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </>
                            ) : (
                                /* Sign In Button - shown when not logged in */
                                <button
                                    onClick={() => navigateWithLoading(`/${locale}/auth/login`, 'nav-signin')}
                                    disabled={isLoading('nav-signin')}
                                    className="hidden lg:block px-4 py-1.5 bg-[#0a84ff] hover:bg-[#0a84ff]/90 text-white text-sm font-semibold rounded-full transition-all"
                                >
                                    Sign In
                                </button>
                            )}

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
                                        {session?.data?.user ? (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-around px-4 py-2">
                                                    <ThemeToggle />
                                                    <button 
                                                        onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                                                        className="text-white/70 hover:text-white transition-colors"
                                                    >
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
                                                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                                        className="text-white/70 hover:text-white transition-colors"
                                                    >
                                                        <User className="w-5 h-5" />
                                                    </button>
                                                </div>
                                                
                                                {/* Language Menu - Mobile */}
                                                <AnimatePresence>
                                                    {isLanguageMenuOpen && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                            className="bg-neutral-900 border border-white/10 rounded-xl overflow-hidden"
                                                        >
                                                            <LanguageSwitcher />
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                                
                                                {/* Profile Menu - Mobile */}
                                                <AnimatePresence>
                                                    {isProfileMenuOpen && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                            className="bg-neutral-900 border border-white/10 rounded-xl overflow-hidden"
                                                        >
                                                            <button
                                                                onClick={() => {
                                                                    navigateWithLoading(`/${locale}/dashboard`, 'nav-dashboard');
                                                                    setIsProfileMenuOpen(false);
                                                                    setIsMobileMenuOpen(false);
                                                                }}
                                                                className="w-full px-4 py-2.5 text-left text-sm text-white/90 hover:bg-white/10 transition-colors flex items-center gap-2"
                                                            >
                                                                <User className="w-4 h-4" />
                                                                Dashboard
                                                            </button>
                                                            <div className="h-[0.5px] bg-white/10" />
                                                            <button
                                                                onClick={() => {
                                                                    setIsProfileMenuOpen(false);
                                                                    setIsMobileMenuOpen(false);
                                                                    window.location.href = '/api/auth/signout';
                                                                }}
                                                                className="w-full px-4 py-2.5 text-left text-sm text-white/90 hover:bg-white/10 transition-colors flex items-center gap-2"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                                </svg>
                                                                Sign Out
                                                            </button>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-center gap-4 px-4 py-2">
                                                    <ThemeToggle />
                                                    <button 
                                                        onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                                                        className="text-white/70 hover:text-white transition-colors"
                                                    >
                                                        <Globe className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            navigateWithLoading(`/${locale}/auth/login`, 'nav-signin');
                                                            setIsMobileMenuOpen(false);
                                                        }}
                                                        className="px-6 py-2 bg-[#0a84ff] hover:bg-[#0a84ff]/90 text-white text-sm font-semibold rounded-full transition-all"
                                                    >
                                                        Sign In
                                                    </button>
                                                </div>
                                                
                                                {/* Language Menu - Mobile (Not logged in) */}
                                                <AnimatePresence>
                                                    {isLanguageMenuOpen && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                            className="bg-neutral-900 border border-white/10 rounded-xl overflow-hidden"
                                                        >
                                                            <LanguageSwitcher />
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        )}
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
