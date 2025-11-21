'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Search,
    Globe,
    Award,
    Menu,
    X,
    BookOpen,
    Users,
    Crown,
    Sparkles,
    ChevronDown,
    Bell,
    MessageCircle,
    TrendingUp,
    Zap
} from 'lucide-react';
import { NavigationAuthSection } from '@/components/navigation/NavigationAuthSection';
import { SearchModal } from '@/components/landing/SearchModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useLocaleSafe } from '@/hooks/useTranslationsSafe';
import { useNavigationLoading } from '@/hooks/useNavigationLoading';
import { motion, AnimatePresence } from 'framer-motion';

export function Navigation() {
    const session = useSession();
    const pathname = usePathname();
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

    // Check if a navigation item is active
    const isActive = (path: string) => {
        if (path === `/${locale}`) {
            return pathname === `/${locale}` || pathname === '/';
        }
        return pathname?.startsWith(path);
    };

    // Navigation items configuration
    const navigationItems = [
        {
            label: 'Courses',
            path: `/${locale}/courses`,
            icon: BookOpen,
            key: 'nav-courses',
            description: 'Explore our course catalog'
        },
        {
            label: 'Signature',
            path: `/${locale}/signature-courses`,
            icon: Award,
            key: 'nav-signature',
            description: 'Exclusive premium courses'
        },
        {
            label: 'Mentors',
            path: `/${locale}/mentors`,
            icon: Crown,
            key: 'nav-mentors',
            description: 'Connect with expert mentors'
        },
        {
            label: 'Study Buddy',
            path: `/${locale}/study-buddy`,
            icon: Users,
            key: 'nav-study-buddy',
            description: 'Find study partners'
        }
    ];

    return (
        <>
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 sm:h-20">
                        {/* Enhanced Logo */}
                        <motion.button
                            onClick={() => navigateWithLoading(`/${locale}`, 'nav-home')}
                            disabled={isLoading('nav-home')}
                            className="flex items-center group relative"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="relative">
                                <div className="w-11 h-11 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:shadow-purple-500/25 transition-all duration-300 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <span className="text-white text-lg font-bold relative z-10">P</span>
                                    <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-yellow-300 opacity-0 group-hover:opacity-100 transition-all duration-300 animate-pulse" />
                                </div>
                            </div>
                            <div className="ml-3 flex flex-col">
                                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:from-purple-500 group-hover:via-blue-500 group-hover:to-indigo-500 transition-all duration-300">
                                    Prime Egypt
                                </span>
                                <span className="text-xs text-muted-foreground -mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    Learn • Grow • Excel
                                </span>
                            </div>
                        </motion.button>

                        {/* Enhanced Desktop Navigation Links */}
                        <div className="hidden lg:flex items-center space-x-1">
                            {navigationItems.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.path);

                                return (
                                    <motion.div
                                        key={item.key}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Button
                                            variant="ghost"
                                            onClick={() => navigateWithLoading(item.path, item.key)}
                                            disabled={isLoading(item.key)}
                                            className={`relative px-4 py-2.5 rounded-xl transition-all duration-300 font-medium group ${
                                                active
                                                    ? 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shadow-sm'
                                                    : 'text-foreground/80 hover:text-foreground hover:bg-muted/80 hover:shadow-sm'
                                            }`}
                                        >
                                            {isLoading(item.key) ? (
                                                <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                                            ) : null}
                                            <span className="relative">
                                                {item.label}
                                            </span>

                                            {/* Active indicator */}
                                            {active && (
                                                <motion.div
                                                    layoutId="activeTab"
                                                    className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                                />
                                            )}

                                            {/* Hover tooltip */}
                                            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-popover text-popover-foreground text-xs rounded-lg shadow-lg border opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-50">
                                                {item.description}
                                                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-popover border-l border-t rotate-45"></div>
                                            </div>
                                        </Button>
                                    </motion.div>
                                );
                            })}

                            {/* Dashboard Navigation */}
                            {session.data && (
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            const dashboardPath = session.data.user.role === 'CREATOR'
                                                ? `/${locale}/creator/dashboard`
                                                : `/${locale}/dashboard`;
                                            navigateWithLoading(dashboardPath, 'nav-dashboard');
                                        }}
                                        disabled={isLoading('nav-dashboard')}
                                        className={`relative px-4 py-2.5 rounded-xl transition-all duration-300 font-medium group ${
                                            isActive(session.data.user.role === 'CREATOR' ? `/${locale}/creator` : `/${locale}/dashboard`)
                                                ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-600 dark:text-green-400 border border-green-500/20 shadow-sm'
                                                : 'text-foreground/80 hover:text-foreground hover:bg-muted/80 hover:shadow-sm'
                                        }`}
                                    >
                                        {isLoading('nav-dashboard') ? (
                                            <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                                        ) : (
                                            <TrendingUp className={`w-4 h-4 mr-2 transition-colors duration-300 ${
                                                isActive(session.data.user.role === 'CREATOR' ? `/${locale}/creator` : `/${locale}/dashboard`)
                                                    ? 'text-green-500'
                                                    : 'text-muted-foreground group-hover:text-foreground'
                                            }`} />
                                        )}
                                        <span className="relative">
                                            {session.data.user.role === 'CREATOR' ? 'Creator' : 'Dashboard'}
                                        </span>

                                        {/* Active indicator for dashboard */}
                                        {isActive(session.data.user.role === 'CREATOR' ? `/${locale}/creator` : `/${locale}/dashboard`) && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                                                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                    </Button>
                                </motion.div>
                            )}
                        </div>

                        {/* Enhanced Right Side Actions */}
                        <div className="flex items-center space-x-2">
                            {/* Search Button */}
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsSearchOpen(true)}
                                    className="hidden sm:flex w-10 h-10 rounded-xl hover:bg-muted/80 hover:shadow-sm transition-all duration-300 text-muted-foreground hover:text-foreground relative group"
                                >
                                    <Search className="w-5 h-5" />
                                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 transition-all duration-300"></div>
                                </Button>
                            </motion.div>

                            {/* Notifications (if logged in) */}
                            {session.data && (
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="hidden sm:flex w-10 h-10 rounded-xl hover:bg-muted/80 hover:shadow-sm transition-all duration-300 text-muted-foreground hover:text-foreground relative group"
                                    >
                                        <Bell className="w-5 h-5" />
                                        {/* Notification dot */}
                                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-background"></div>
                                        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 transition-all duration-300"></div>
                                    </Button>
                                </motion.div>
                            )}

                            {/* Messages (if logged in) */}
                            {session.data && (
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="hidden sm:flex w-10 h-10 rounded-xl hover:bg-muted/80 hover:shadow-sm transition-all duration-300 text-muted-foreground hover:text-foreground relative group"
                                    >
                                        <MessageCircle className="w-5 h-5" />
                                        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 transition-all duration-300"></div>
                                    </Button>
                                </motion.div>
                            )}

                            {/* Theme Toggle */}
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <div className="p-1">
                                    <ThemeToggle />
                                </div>
                            </motion.div>

                            {/* Desktop Auth Section */}
                            <div className="hidden lg:block">
                                <NavigationAuthSection />
                            </div>

                            {/* Enhanced Mobile Menu Button */}
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                    className="lg:hidden w-10 h-10 rounded-xl hover:bg-muted/80 hover:shadow-sm transition-all duration-300 text-muted-foreground hover:text-foreground relative group"
                                >
                                    <div className="relative">
                                        <Menu className={`w-5 h-5 transition-all duration-300 ${isMobileMenuOpen ? 'rotate-180 opacity-0' : 'rotate-0 opacity-100'}`} />
                                        <X className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${isMobileMenuOpen ? 'rotate-0 opacity-100' : '-rotate-180 opacity-0'}`} />
                                    </div>
                                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 transition-all duration-300"></div>
                                </Button>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </motion.nav>

            {/* Enhanced Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-40 lg:hidden"
                    >
                        {/* Enhanced Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-md"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />

                        {/* Enhanced Menu Panel */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 h-full w-80 max-w-[85vw] bg-background/95 backdrop-blur-xl border-l border-border shadow-2xl shadow-purple-500/10"
                        >
                            <div className="flex flex-col h-full">
                                {/* Enhanced Header */}
                                <div className="p-6 border-b border-border/50 bg-gradient-to-r from-purple-500/5 to-blue-500/5">
                                    <div className="flex items-center justify-between">
                                        <motion.div
                                            className="flex items-center"
                                            whileHover={{ scale: 1.02 }}
                                        >
                                            <div className="relative">
                                                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                                    <span className="text-white text-lg font-bold">P</span>
                                                    <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-yellow-300 animate-pulse" />
                                                </div>
                                            </div>
                                            <div className="ml-3">
                                                <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                                    Prime Egypt
                                                </span>
                                                <p className="text-xs text-muted-foreground">Learn • Grow • Excel</p>
                                            </div>
                                        </motion.div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="w-10 h-10 rounded-xl hover:bg-muted/80 transition-all duration-300"
                                        >
                                            <X className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Enhanced Navigation Links */}
                                <div className="flex-1 p-6 space-y-3">
                                    <div className="mb-6">
                                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center">
                                            <Zap className="w-4 h-4 mr-2 text-purple-500" />
                                            Navigation
                                        </h3>

                                        {navigationItems.map((item) => {
                                            const Icon = item.icon;
                                            const active = isActive(item.path);

                                            return (
                                                <motion.div
                                                    key={item.key}
                                                    whileHover={{ scale: 1.02, x: 4 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => {
                                                            navigateWithLoading(item.path, item.key);
                                                            setIsMobileMenuOpen(false);
                                                        }}
                                                        disabled={isLoading(item.key)}
                                                        className={`w-full justify-start px-4 py-3 rounded-xl transition-all duration-300 font-medium mb-2 group relative overflow-hidden ${
                                                            active
                                                                ? 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shadow-sm'
                                                                : 'text-foreground/80 hover:text-foreground hover:bg-muted/80'
                                                        }`}
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 transition-all duration-300"></div>

                                                        {isLoading(item.key) ? (
                                                            <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mr-3 relative z-10"></div>
                                                        ) : (
                                                            <Icon className={`w-4 h-4 mr-3 transition-colors duration-300 relative z-10 ${
                                                                active ? 'text-purple-500' : 'text-muted-foreground group-hover:text-foreground'
                                                            }`} />
                                                        )}

                                                        <span className="relative z-10 flex-1 text-left">
                                                            {item.label}
                                                        </span>

                                                        {/* Active indicator */}
                                                        {active && (
                                                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-purple-500 to-blue-500 rounded-r-full"></div>
                                                        )}
                                                    </Button>
                                                </motion.div>
                                            );
                                        })}

                                        {/* Dashboard Navigation for Mobile */}
                                        {session.data && (
                                            <motion.div
                                                whileHover={{ scale: 1.02, x: 4 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
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
                                                    className={`w-full justify-start px-4 py-3 rounded-xl transition-all duration-300 font-medium mb-2 group relative overflow-hidden ${
                                                        isActive(session.data.user.role === 'CREATOR' ? `/${locale}/creator` : `/${locale}/dashboard`)
                                                            ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-600 dark:text-green-400 border border-green-500/20 shadow-sm'
                                                            : 'text-foreground/80 hover:text-foreground hover:bg-muted/80'
                                                    }`}
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 to-emerald-500/0 group-hover:from-green-500/5 group-hover:to-emerald-500/5 transition-all duration-300"></div>

                                                    {isLoading('nav-dashboard') ? (
                                                        <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin mr-3 relative z-10"></div>
                                                    ) : (
                                                        <TrendingUp className={`w-4 h-4 mr-3 transition-colors duration-300 relative z-10 ${
                                                            isActive(session.data.user.role === 'CREATOR' ? `/${locale}/creator` : `/${locale}/dashboard`)
                                                                ? 'text-green-500'
                                                                : 'text-muted-foreground group-hover:text-foreground'
                                                        }`} />
                                                    )}

                                                    <span className="relative z-10 flex-1 text-left">
                                                        {session.data.user.role === 'CREATOR' ? 'Creator Dashboard' : 'Dashboard'}
                                                    </span>

                                                    {/* Active indicator */}
                                                    {isActive(session.data.user.role === 'CREATOR' ? `/${locale}/creator` : `/${locale}/dashboard`) && (
                                                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-green-500 to-emerald-500 rounded-r-full"></div>
                                                    )}
                                                </Button>
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Quick Actions Section */}
                                    <div className="border-t border-border/50 pt-4">
                                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center">
                                            <Sparkles className="w-4 h-4 mr-2 text-yellow-500" />
                                            Quick Actions
                                        </h3>

                                        <motion.div
                                            whileHover={{ scale: 1.02, x: 4 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <Button
                                                variant="ghost"
                                                onClick={() => {
                                                    setIsSearchOpen(true);
                                                    setIsMobileMenuOpen(false);
                                                }}
                                                className="w-full justify-start px-4 py-3 rounded-xl hover:bg-muted/80 transition-all duration-300 text-foreground/80 hover:text-foreground font-medium group"
                                            >
                                                <Search className="w-4 h-4 mr-3 text-muted-foreground group-hover:text-foreground transition-colors duration-300" />
                                                Search Courses
                                            </Button>
                                        </motion.div>

                                        {session.data && (
                                            <>
                                                <motion.div
                                                    whileHover={{ scale: 1.02, x: 4 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        className="w-full justify-start px-4 py-3 rounded-xl hover:bg-muted/80 transition-all duration-300 text-foreground/80 hover:text-foreground font-medium group"
                                                    >
                                                        <Bell className="w-4 h-4 mr-3 text-muted-foreground group-hover:text-foreground transition-colors duration-300" />
                                                        Notifications
                                                        <div className="ml-auto w-2 h-2 bg-red-500 rounded-full"></div>
                                                    </Button>
                                                </motion.div>

                                                <motion.div
                                                    whileHover={{ scale: 1.02, x: 4 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        className="w-full justify-start px-4 py-3 rounded-xl hover:bg-muted/80 transition-all duration-300 text-foreground/80 hover:text-foreground font-medium group"
                                                    >
                                                        <MessageCircle className="w-4 h-4 mr-3 text-muted-foreground group-hover:text-foreground transition-colors duration-300" />
                                                        Messages
                                                    </Button>
                                                </motion.div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Enhanced Mobile Auth Section */}
                                <div className="p-6 border-t border-border/50 bg-gradient-to-r from-muted/30 to-muted/10">
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
