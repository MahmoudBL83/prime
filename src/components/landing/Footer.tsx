'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';

export function Footer() {
    const locale = useLocale();
    const pathname = usePathname();
    const router = useRouter();
    const currentYear = new Date().getFullYear();

    const handleLanguageChange = (newLocale: string) => {
        router.replace(pathname, { locale: newLocale });
    };

    return (
        <footer className="bg-background dark:bg-[#1d1d1f] py-4">
            <div className="max-w-screen-2xl mx-auto px-8">
                <div className="flex flex-col items-start">
                    {/* Copyright */}
                    <div className="text-xs text-muted-foreground dark:text-[#6e6e73] mb-2">
                        Copyright © {currentYear} <span className="font-semibold">Prime Inc.</span> All rights reserved.
                    </div>
                    {/* Footer Links */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-xs">
                        <a href={`/${locale}/terms`} className="text-muted-foreground dark:text-[#6e6e73] hover:underline">
                            Internet Service Terms
                        </a>
                        <span className="text-muted-foreground dark:text-[#6e6e73]">|</span>
                        <a href={`/${locale}/privacy`} className="text-muted-foreground dark:text-[#6e6e73] hover:underline">
                            Prime TV & Privacy
                        </a>
                        <span className="text-muted-foreground dark:text-[#6e6e73]">|</span>
                        <a href={`/${locale}/cookies`} className="text-muted-foreground dark:text-[#6e6e73] hover:underline">
                            Cookie Policy
                        </a>
                        <span className="text-muted-foreground dark:text-[#6e6e73]">|</span>
                        <a href={`/${locale}/support`} className="text-muted-foreground dark:text-[#6e6e73] hover:underline">
                            Support
                        </a>
                        <span className="text-muted-foreground dark:text-[#6e6e73]">|</span>
                        <a href={`/${locale}/about`} className="text-muted-foreground dark:text-[#6e6e73] hover:underline">
                            About
                        </a>
                        <span className="text-muted-foreground dark:text-[#6e6e73]">|</span>
                        <a href={`/${locale}/contact`} className="text-muted-foreground dark:text-[#6e6e73] hover:underline">
                            Contact
                        </a>
                    </div>

                    
                </div>
            </div>
        </footer>
    );
}