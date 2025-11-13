'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Search, Globe, Award, Menu, X } from 'lucide-react';
import { NavigationAuthSection } from '@/components/navigation/NavigationAuthSection';
import { SearchModal } from '@/components/landing/SearchModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useLocaleSafe } from '@/hooks/useTranslationsSafe';
import { useNavigationLoading } from '@/hooks/useNavigationLoading';
import { motion, AnimatePresence } from 'framer-motion';

export function Navigation() {
    const session = useSession();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
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

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 sm:h-20">
                        {/* Logo */}
                        <motion.button
                            onClick={() => navigateWithLoading(`/${locale}`, 'nav-home')}
                            disabled={isLoading('nav-home')}
                            className="flex items-center group"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                                <span className="text-white text-lg font-bold">P</span>
                            </div>
                            <span className="ml-3 text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                Prime Egypt
                            </span>
                        </motion.button>

                        {/* Desktop Navigation Links */}
                        <div className="hidden lg:flex items-center space-x-1">
                            <Button
                                variant="ghost"
                                onClick={() => navigateWithLoading(`/${locale}/courses`, 'nav-courses')}
                                disabled={isLoading('nav-courses')}
                                className="px-4 py-2 rounded-xl hover:bg-muted hover:shadow-sm transition-all duration-300 text-foreground/80 hover:text-foreground font-medium"
                            >
                                {isLoading('nav-courses') && (
                                    <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                                )}
                                Courses
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => navigateWithLoading(`/${locale}/signature-courses`, 'nav-signature')}
                                disabled={isLoading('nav-signature')}
                                className="px-4 py-2 rounded-xl hover:bg-muted hover:shadow-sm transition-all duration-300 text-foreground/80 hover:text-foreground font-medium flex items-center"
                            >
                                {isLoading('nav-signature') ? (
                                    <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                                ) : (
                                    <Award className="w-4 h-4 mr-2" />
                                )}
                                Signature
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => navigateWithLoading(`/${locale}/mentors`, 'nav-mentors')}
                                disabled={isLoading('nav-mentors')}
                                className="px-4 py-2 rounded-xl hover:bg-muted hover:shadow-sm transition-all duration-300 text-foreground/80 hover:text-foreground font-medium"
                            >
                                {isLoading('nav-mentors') && (
                                    <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                                )}
                                Mentors
                            </Button>
                            
                            {/* Dashboard Navigation */}
                            {session.data && (
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        const dashboardPath = session.data.user.role === 'CREATOR' 
                                            ? `/${locale}/creator/dashboard` 
                                            : `/${locale}/dashboard`;
                                        navigateWithLoading(dashboardPath, 'nav-dashboard');
                                    }}
                                    disabled={isLoading('nav-dashboard')}
                                    className="px-4 py-2 rounded-xl hover:bg-muted hover:shadow-sm transition-all duration-300 text-foreground/80 hover:text-foreground font-medium"
                                >
                                    {isLoading('nav-dashboard') && (
                                        <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                                    )}
                                    {session.data.user.role === 'CREATOR' ? 'Creator Dashboard' : 'Dashboard'}
                                </Button>
                            )}
                        </div>

                        {/* Right Side Actions */}
                        <div className="flex items-center space-x-3">
                            {/* Search Button */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsSearchOpen(true)}
                                className="hidden sm:flex w-10 h-10 rounded-xl hover:bg-muted hover:shadow-sm transition-all duration-300 text-muted-foreground hover:text-foreground"
                            >
                                <Search className="w-5 h-5" />
                            </Button>
                            
                            {/* Theme Toggle */}
                            <ThemeToggle />
                            
                            {/* Desktop Auth Section */}
                            <div className="hidden lg:block">
                                <NavigationAuthSection />
                            </div>
                            
                            {/* Mobile Menu Button */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="lg:hidden w-10 h-10 rounded-xl hover:bg-muted hover:shadow-sm transition-all duration-300 text-muted-foreground hover:text-foreground"
                            >
                                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu */}
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
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        
                        {/* Menu Panel */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 h-full w-80 max-w-[85vw] bg-background border-l border-border shadow-2xl"
                        >
                            <div className="flex flex-col h-full">
                                {/* Header */}
                                <div className="p-6 border-b border-border">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                                                <span className="text-white text-sm font-bold">P</span>
                                            </div>
                                            <span className="ml-2 text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                                Prime Egypt
                                            </span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="w-8 h-8 rounded-lg hover:bg-muted"
                                        >
                                            <X className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Navigation Links */}
                                <div className="flex-1 p-6 space-y-2">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Navigation</h3>
                                    
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            navigateWithLoading(`/${locale}/courses`, 'nav-courses');
                                            setIsMobileMenuOpen(false);
                                        }}
                                        disabled={isLoading('nav-courses')}
                                        className="w-full justify-start px-4 py-3 rounded-xl hover:bg-muted transition-all duration-300 text-foreground/80 hover:text-foreground font-medium"
                                    >
                                        {isLoading('nav-courses') && (
                                            <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mr-3"></div>
                                        )}
                                        Courses
                                    </Button>
                                    
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            navigateWithLoading(`/${locale}/signature-courses`, 'nav-signature');
                                            setIsMobileMenuOpen(false);
                                        }}
                                        disabled={isLoading('nav-signature')}
                                        className="w-full justify-start px-4 py-3 rounded-xl hover:bg-muted transition-all duration-300 text-foreground/80 hover:text-foreground font-medium"
                                    >
                                        {isLoading('nav-signature') ? (
                                            <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mr-3"></div>
                                        ) : (
                                            <Award className="w-4 h-4 mr-3" />
                                        )}
                                        Signature Courses
                                    </Button>
                                    
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            navigateWithLoading(`/${locale}/mentors`, 'nav-mentors');
                                            setIsMobileMenuOpen(false);
                                        }}
                                        disabled={isLoading('nav-mentors')}
                                        className="w-full justify-start px-4 py-3 rounded-xl hover:bg-muted transition-all duration-300 text-foreground/80 hover:text-foreground font-medium"
                                    >
                                        {isLoading('nav-mentors') && (
                                            <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mr-3"></div>
                                        )}
                                        Mentors
                                    </Button>
                                    
                                    {/* Dashboard Navigation for Mobile */}
                                    {session.data && (
                                        <Button
                                            variant="ghost"
                                            onClick={() => {
                                                const dashboardPath = session.data.user.role === 'CREATOR' 
                                                    ? `/${locale}/creator/dashboard` 
                                                    : `/${locale}/dashboard`;
                                                navigateWithLoading(dashboardPath, 'nav-dashboard');
                                                setIsMobileMenuOpen(false);
                                            }}
                                            disabled={isLoading('nav-dashboard')}
                                            className="w-full justify-start px-4 py-3 rounded-xl hover:bg-muted transition-all duration-300 text-foreground/80 hover:text-foreground font-medium"
                                        >
                                            {isLoading('nav-dashboard') && (
                                                <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mr-3"></div>
                                            )}
                                            {session.data.user.role === 'CREATOR' ? 'Creator Dashboard' : 'Dashboard'}
                                        </Button>
                                    )}

                                    {/* Search for Mobile */}
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            setIsSearchOpen(true);
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="w-full justify-start px-4 py-3 rounded-xl hover:bg-muted transition-all duration-300 text-foreground/80 hover:text-foreground font-medium"
                                    >
                                        <Search className="w-4 h-4 mr-3" />
                                        Search
                                    </Button>
                                </div>

                                {/* Mobile Auth Section */}
                                <div className="p-6 border-t border-border bg-muted/30">
                                    <NavigationAuthSection 
                                        isMobile={true} 
                                        onCloseMobileMenu={() => setIsMobileMenuOpen(false)} 
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Search Modal */}
            <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </>
    );
}
