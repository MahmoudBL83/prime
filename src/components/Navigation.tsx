'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe, Menu, X, BookOpen, Crown, Heart, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { NavigationAuthSection } from '@/components/navigation/NavigationAuthSection';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { useLocaleSafe } from '@/hooks/useTranslationsSafe';
import GlobalSearch from '@/components/search/GlobalSearch';

function ThemeButton({ className }: { className?: string }) {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const isDark = !mounted || resolvedTheme !== 'light';

    return (
        <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={className}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Light mode' : 'Dark mode'}
        >
            {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
        </button>
    );
}

export function Navigation() {
    const pathname = usePathname();
    const locale = useLocaleSafe();
    const isGerman = locale === 'de';

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
    const languageMenuRef = useRef<HTMLDivElement>(null);

    // Close menus on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
        setIsLanguageMenuOpen(false);
    }, [pathname]);

    // Close mobile menu when window is resized to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) setIsMobileMenuOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Close the language menu on outside click
    useEffect(() => {
        if (!isLanguageMenuOpen) return;
        const handleClick = (event: MouseEvent) => {
            if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
                setIsLanguageMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isLanguageMenuOpen]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileMenuOpen]);

    const navigationItems = [
        { label: isGerman ? 'Kurse' : 'Courses', path: `/${locale}/courses`, icon: BookOpen, key: 'nav-courses' },
        { label: 'Mentors', path: `/${locale}/mentors`, icon: Crown, key: 'nav-mentors' },
        { label: isGerman ? 'Lernpartner' : 'Study Buddy', path: `/${locale}/study-buddy`, icon: Heart, key: 'nav-study-buddy' },
    ];

    const isActive = (path: string) => pathname === path || pathname?.startsWith(`${path}/`);

    const iconButtonClass =
        'flex items-center justify-center w-9 h-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06] transition-colors';

    return (
        <>
            {/* Apple TV style top bar: translucent, blurred, hairline divider */}
            <nav
                className="fixed top-0 inset-x-0 z-50 h-[52px] bg-background/75 backdrop-blur-xl backdrop-saturate-150 border-b border-border/60"
                dir="ltr"
            >
                <div className="max-w-screen-2xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
                    {/* Left: wordmark */}
                    <Link
                        href={`/${locale}/mentors`}
                        className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity"
                        aria-label="Prime home"
                    >
                        <span className="text-[22px] font-semibold tracking-[-0.03em] text-foreground">Prime</span>
                    </Link>

                    {/* Center: primary tabs */}
                    <div className="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
                        {navigationItems.map((item) => {
                            const active = isActive(item.path);
                            return (
                                <Link
                                    key={item.key}
                                    href={item.path}
                                    aria-current={active ? 'page' : undefined}
                                    className={`px-4 py-1.5 rounded-full text-[14px] font-semibold tracking-[-0.01em] transition-colors ${active
                                        ? 'text-foreground bg-foreground/[0.08]'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right: search, theme, language, account */}
                    <div className="flex items-center gap-1 sm:gap-2">
                        <div className="hidden md:block">
                            <GlobalSearch placeholder={isGerman ? 'Suchen…' : 'Search'} />
                        </div>

                        <ThemeButton className={`hidden lg:flex ${iconButtonClass}`} />

                        <div className="relative hidden lg:block" ref={languageMenuRef}>
                            <button
                                onClick={() => setIsLanguageMenuOpen((open) => !open)}
                                className="flex items-center gap-1.5 h-9 px-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06] transition-colors"
                                aria-label="Language"
                                aria-expanded={isLanguageMenuOpen}
                            >
                                <Globe className="w-[18px] h-[18px]" />
                                <span className="text-xs font-semibold uppercase tracking-wide">{locale}</span>
                            </button>
                            {isLanguageMenuOpen && (
                                <div className="absolute top-full mt-2 right-0 min-w-[180px] z-50 rounded-xl overflow-hidden border border-border bg-popover/95 backdrop-blur-xl shadow-2xl animate-in-fade">
                                    <LanguageSwitcher locales={['en', 'de']} />
                                </div>
                            )}
                        </div>

                        <div className="hidden lg:block">
                            <NavigationAuthSection isMobile={false} />
                        </div>

                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className={`lg:hidden ${iconButtonClass}`}
                            aria-label="Open menu"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile menu */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-[60] lg:hidden">
                    <div
                        className="absolute inset-0 bg-background/90 backdrop-blur-xl animate-in-fade"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    <div className="relative max-h-[100dvh] overflow-y-auto bg-background border-b border-border animate-in-slide-down">
                        <div className="px-5 pt-3 pb-6">
                            <div className="flex items-center justify-between h-[40px] mb-4">
                                <Link href={`/${locale}/mentors`} className="text-[22px] font-semibold tracking-[-0.03em] text-foreground">
                                    Prime
                                </Link>
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={iconButtonClass}
                                    aria-label="Close menu"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="md:hidden mb-4">
                                <GlobalSearch placeholder={isGerman ? 'Suchen…' : 'Search'} />
                            </div>

                            <div className="space-y-1">
                                {navigationItems.map((item) => {
                                    const active = isActive(item.path);
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.key}
                                            href={item.path}
                                            className={`flex items-center gap-3 px-3 py-3 rounded-xl text-[17px] font-semibold transition-colors ${active
                                                ? 'text-foreground bg-foreground/[0.06]'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]'
                                                }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </div>

                            <div className="mt-5 pt-5 border-t border-border">
                                <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground mb-2 px-1">
                                    {isGerman ? 'Sprache & Design' : 'Language & Appearance'}
                                </p>
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex-1 rounded-xl border border-border overflow-hidden">
                                        <LanguageSwitcher locales={['en', 'de']} />
                                    </div>
                                    <ThemeButton className={`border border-border ${iconButtonClass} w-11 h-11`} />
                                </div>
                            </div>

                            <div className="mt-5 pt-5 border-t border-border">
                                <NavigationAuthSection isMobile={true} onCloseMobileMenu={() => setIsMobileMenuOpen(false)} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
