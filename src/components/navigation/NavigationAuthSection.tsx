'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { User, LogOut, Bell, Crown, ChevronDown, Settings, BookOpen, BarChart3, Shield, UserCog, MessageCircle, FileText, Video, DollarSign, Sparkles } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useTranslationsSafe } from '@/hooks/useTranslationsSafe';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import Image from 'next/image';
import { useAuthModal } from '@/contexts/AuthModalContext';

interface NavigationAuthSectionProps {
    isMobile?: boolean;
    onCloseMobileMenu?: () => void;
}

export function NavigationAuthSection({ isMobile = false, onCloseMobileMenu }: NavigationAuthSectionProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { openAuthModal } = useAuthModal();

    // Safe translation hooks
    const { t } = useTranslationsSafe('auth');
    const { t: tNav } = useTranslationsSafe('navigation');
    const { t: tCommon } = useTranslationsSafe('common');
    const { t: tPayment } = useTranslationsSafe('payment');
    const { locale } = useTranslationsSafe('navigation');

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const closeDropdown = () => {
        setIsDropdownOpen(false);
        if (onCloseMobileMenu) onCloseMobileMenu();
    };

    // Get user avatar initials or image
    const getAvatarContent = () => {
        if (session?.user && (session.user as any)?.image) {
            return (
                <Image
                    src={(session.user as any).image}
                    alt={session.user?.name || 'User'}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover rounded-full"
                />
            );
        }
        const name = session?.user?.name || 'User';
        return (
            <span className="text-sm font-semibold text-foreground">
                {name.charAt(0).toUpperCase()}
            </span>
        );
    };

    // Handle anonymous users (not logged in)
    if (!session) {
        return (
            <div className={isMobile ? 'space-y-2' : 'flex items-center space-x-3'}>
                <Button
                    variant="ghost"
                    size="sm"
                    className={isMobile
                        ? "w-full justify-start text-muted-foreground dark:text-white/70 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-white/10 rounded-lg px-4 py-2.5 transition-colors"
                        : "text-muted-foreground dark:text-white/70 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-white/10 rounded-lg px-4 py-2 transition-colors"
                    }
                    onClick={() => {
                        openAuthModal('signin');
                        if (onCloseMobileMenu) onCloseMobileMenu();
                    }}
                >
                    {t('login')}
                </Button>
            </div>
        );
    }

    // Handle registered users (logged in but not subscribed)
    if (!session.user?.subscriptionStatus || session.user.subscriptionStatus === 'NONE') {
        return (
            <div className={isMobile ? 'space-y-3' : 'flex items-center space-x-4'}>
                {!isMobile && (
                    <div className="flex items-center space-x-3">
                        {/* Messages Icon Button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/${locale}/messaging`)}
                            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl p-2.5 transition-all duration-300 relative"
                            title="Messages"
                        >
                            <MessageCircle className="w-5 h-5" />
                        </Button>

                        {/* Notifications */}
                        <NotificationDropdown />


                    </div>
                )}

                <div className="relative" ref={dropdownRef}>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={isMobile
                            ? "w-full justify-start text-muted-foreground dark:text-white/70 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-white/10 rounded-lg px-4 py-2.5 transition-colors"
                            : "text-muted-foreground dark:text-white/70 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-white/10 rounded-lg p-2 transition-colors flex items-center gap-1"
                        }
                        onClick={toggleDropdown}
                    >
                        <div className="w-8 h-8 bg-[#0a84ff] rounded-full flex items-center justify-center">
                            {getAvatarContent()}
                        </div>
                        {!isMobile && (
                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        )}
                        {isMobile && <span className="ml-3">{tNav('profile')}</span>}
                    </Button>

                    <AnimatePresence>
                        {isDropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                className={`absolute ${isMobile ? 'left-0 right-0 top-full' : 'right-0 top-full'} mt-3 z-50 ${isMobile ? 'mx-4' : 'w-64'
                                    }`}
                            >
                                <div className="bg-background dark:bg-[#1f1f1f] border border-border dark:border-[hsla(0,0%,100%,.16)] rounded-xl shadow-xl overflow-hidden">
                                    {/* User Info Header */}
                                    <div className="px-4 py-4 border-b border-border dark:border-[hsla(0,0%,100%,.16)]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-[#0a84ff] rounded-full flex items-center justify-center">
                                                {getAvatarContent()}
                                            </div>
                                            <div>
                                                <p className="text-foreground font-semibold text-sm">{session.user?.name}</p>
                                                <p className="text-muted-foreground text-xs">{session.user?.email}</p>
                                            </div>
                                            <div className="ml-auto">
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border/50">
                                                    Free
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Upgrade Prompt */}
                                    {isMobile && (
                                        <div className="px-4 py-3 border-b border-border dark:border-[hsla(0,0%,100%,.16)]">
                                            <Button
                                                size="sm"
                                                className="w-full bg-[#0a84ff] hover:bg-[#0a84ff]/90 text-white rounded-full font-semibold transition-all flex items-center justify-center gap-2"
                                                onClick={() => {
                                                    router.push(`/${locale}/subscribe`);
                                                    closeDropdown();
                                                }}
                                            >
                                                <Crown className="w-4 h-4" />
                                                {tPayment('subscribe')}
                                            </Button>
                                        </div>
                                    )}

                                    {/* Menu Items */}
                                    <div className="py-2">
                                        {/* Creator Dashboard - Show for creators or users with applications */}
                                        {(session.user?.isCreator || session.user?.applicationStatus) && (
                                            <button
                                                onClick={() => {
                                                    router.push(`/${locale}/creator/dashboard`);
                                                    closeDropdown();
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground dark:text-white/90 hover:bg-accent dark:hover:bg-white/10 transition-colors"
                                            >
                                                <Sparkles className="w-4 h-4 text-[#0a84ff]" />
                                                <span className="flex-1 text-left">Creator Dashboard</span>
                                                {session.user?.applicationStatus && session.user.applicationStatus !== 'APPROVED' && (
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${session.user.applicationStatus === 'PENDING'
                                                            ? 'bg-blue-500/20 text-blue-400'
                                                            : session.user.applicationStatus === 'UNDER_REVIEW'
                                                                ? 'bg-yellow-500/20 text-yellow-400'
                                                                : session.user.applicationStatus === 'REJECTED'
                                                                    ? 'bg-red-500/20 text-red-400'
                                                                    : 'bg-orange-500/20 text-orange-400'
                                                        }`}>
                                                        {session.user.applicationStatus === 'PENDING' && 'Pending'}
                                                        {session.user.applicationStatus === 'UNDER_REVIEW' && 'Review'}
                                                        {session.user.applicationStatus === 'REJECTED' && 'Rejected'}
                                                        {session.user.applicationStatus === 'RESUBMIT_REQUIRED' && 'Resubmit'}
                                                    </span>
                                                )}
                                            </button>
                                        )}

                                        {/* Learner Dashboard - Always show */}
                                        <button
                                            onClick={() => {
                                                router.push(`/${locale}/dashboard`);
                                                closeDropdown();
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground dark:text-white/90 hover:bg-accent dark:hover:bg-white/10 transition-colors"
                                        >
                                            <BookOpen className="w-4 h-4" />
                                            {(session.user?.isCreator || session.user?.applicationStatus) ? 'Learner Dashboard' : tNav('dashboard')}
                                        </button>
                                        <button
                                            onClick={() => {
                                                router.push(`/${locale}/profile`);
                                                closeDropdown();
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground dark:text-white/90 hover:bg-accent dark:hover:bg-white/10 transition-colors"
                                        >
                                            <UserCog className="w-4 h-4" />
                                            {tNav('profile')}
                                        </button>

                                    </div>

                                    {/* Creator Hub Section - Only for CREATOR role */}
                                    {session.user?.role === 'CREATOR' && (
                                        <>
                                            <div className="border-t border-border dark:border-[hsla(0,0%,100%,.16)]"></div>
                                            <div className="py-2">
                                                <div className="px-4 py-2">
                                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                                        <Sparkles className="w-3 h-3" />
                                                        Creator Hub
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        router.push(`/${locale}/creator/content/posts`);
                                                        closeDropdown();
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                                                >
                                                    <FileText className="w-4 h-4 text-purple-400" />
                                                    Content
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        router.push(`/${locale}/creator/live`);
                                                        closeDropdown();
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                                                >
                                                    <Video className="w-4 h-4 text-red-400" />
                                                    Live Sessions
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        router.push(`/${locale}/creator/earnings`);
                                                        closeDropdown();
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                                                >
                                                    <DollarSign className="w-4 h-4 text-green-400" />
                                                    Earnings
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        router.push(`/${locale}/creator/analytics`);
                                                        closeDropdown();
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                                                >
                                                    <BarChart3 className="w-4 h-4 text-blue-400" />
                                                    Analytics
                                                </button>
                                            </div>
                                        </>
                                    )}

                                    {/* Logout */}
                                    <div className="border-t border-border dark:border-[hsla(0,0%,100%,.16)]">
                                        <button
                                            onClick={() => {
                                                signOut({ callbackUrl: `/${locale}` });
                                                closeDropdown();
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground dark:text-white/90 hover:bg-accent dark:hover:bg-white/10 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            {tNav('logout')}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        );
    }

    // Handle subscribed users (logged in and subscribed)
    return (
        <div className={isMobile ? 'space-y-3' : 'flex items-center space-x-4'}>
            {!isMobile && (
                <div className="flex items-center space-x-3">
                    {/* Messages Icon Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/${locale}/messaging`)}
                        className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl p-2.5 transition-all duration-300 relative"
                        title="Messages"
                    >
                        <MessageCircle className="w-5 h-5" />
                    </Button>

                    {/* Notifications */}
                    <NotificationDropdown />
                </div>
            )}

            {/* User Account Dropdown */}
            <div className="relative" ref={dropdownRef}>
                <Button
                    variant="ghost"
                    size="sm"
                    className={isMobile
                        ? "w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl px-4 py-3 transition-all duration-300"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl p-2 transition-all duration-300 flex items-center gap-1"
                    }
                    onClick={toggleDropdown}
                >
                    <div className="relative">
                        <div className="w-8 h-8 bg-[#0a84ff] rounded-full flex items-center justify-center">
                            {getAvatarContent()}
                        </div>
                        {/* Premium indicator */}
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-background flex items-center justify-center">
                            <Crown className="w-2 h-2 text-white" />
                        </div>
                    </div>
                    {!isMobile && (
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    )}
                    {isMobile && <span className="ml-3">{tNav('profile')}</span>}
                </Button>

                <AnimatePresence>
                    {isDropdownOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className={`absolute ${isMobile ? 'left-0 right-0 top-full' : 'right-0 top-full'} mt-3 z-50 ${isMobile ? 'mx-4' : 'w-64'
                                }`}
                        >
                            <div className="bg-background dark:bg-[#1f1f1f] border border-border dark:border-[hsla(0,0%,100%,.16)] rounded-xl shadow-xl overflow-hidden">
                                {/* User Info Header */}
                                <div className="px-4 py-4 border-b border-border dark:border-[hsla(0,0%,100%,.16)]">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-10 h-10 bg-[#0a84ff] rounded-full flex items-center justify-center">
                                                {getAvatarContent()}
                                            </div>
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-background flex items-center justify-center">
                                                <Crown className="w-2.5 h-2.5 text-white" />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-foreground font-semibold text-sm">{session.user?.name}</p>
                                            <p className="text-muted-foreground text-xs">{session.user?.email}</p>
                                        </div>
                                        <div className="ml-auto">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-[#0a84ff]/10 text-[#0a84ff] border border-[#0a84ff]/20">
                                                <Crown className="w-3 h-3 mr-1" />
                                                Premium
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Notifications section for mobile */}
                                {isMobile && (
                                    <div className="px-4 py-3 border-b border-border dark:border-[hsla(0,0%,100%,.16)]">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl px-3 py-2 transition-all duration-300"
                                        >
                                            <Bell className="w-4 h-4 mr-3" />
                                            Notifications
                                            <span className="ml-auto w-2 h-2 bg-red-500 rounded-full"></span>
                                        </Button>
                                    </div>
                                )}

                                {/* Menu Items */}
                                <div className="py-2">
                                    {/* Creator Dashboard - Show for creators or users with applications */}
                                    {(session.user?.isCreator || session.user?.applicationStatus) && (
                                        <button
                                            onClick={() => {
                                                router.push(`/${locale}/creator/dashboard`);
                                                closeDropdown();
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                                        >
                                            <Sparkles className="w-4 h-4 text-purple-400" />
                                            <span className="flex-1 text-left">Creator Dashboard</span>
                                            {session.user?.applicationStatus && session.user.applicationStatus !== 'APPROVED' && (
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${session.user.applicationStatus === 'PENDING'
                                                        ? 'bg-blue-500/20 text-blue-400'
                                                        : session.user.applicationStatus === 'UNDER_REVIEW'
                                                            ? 'bg-yellow-500/20 text-yellow-400'
                                                            : session.user.applicationStatus === 'REJECTED'
                                                                ? 'bg-red-500/20 text-red-400'
                                                                : 'bg-orange-500/20 text-orange-400'
                                                    }`}>
                                                    {session.user.applicationStatus === 'PENDING' && 'Pending'}
                                                    {session.user.applicationStatus === 'UNDER_REVIEW' && 'Review'}
                                                    {session.user.applicationStatus === 'REJECTED' && 'Rejected'}
                                                    {session.user.applicationStatus === 'RESUBMIT_REQUIRED' && 'Resubmit'}
                                                </span>
                                            )}
                                        </button>
                                    )}

                                    {/* Learner Dashboard - Always show */}
                                    <button
                                        onClick={() => {
                                            router.push(`/${locale}/dashboard`);
                                            closeDropdown();
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                                    >
                                        <BookOpen className="w-4 h-4 text-green-400" />
                                        {(session.user?.isCreator || session.user?.applicationStatus) ? 'Learner Dashboard' : tNav('dashboard')}
                                    </button>
                                    <button
                                        onClick={() => {
                                            router.push(`/${locale}/profile`);
                                            closeDropdown();
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                                    >
                                        <UserCog className="w-4 h-4 text-blue-400" />
                                        {tNav('profile')}
                                    </button>

                                </div>

                                {/* Logout */}
                                <div className="border-t border-border dark:border-[hsla(0,0%,100%,.16)]">
                                    <button
                                        onClick={() => {
                                            signOut({ callbackUrl: `/${locale}` });
                                            closeDropdown();
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        {tNav('logout')}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
