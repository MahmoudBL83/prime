'use client';

import { useRouter, usePathname } from '@/i18n/navigation';
import { routing, localeNames, localeFlags } from '@/i18n/routing';
import { useLocaleSafe } from '@/hooks/useTranslationsSafe';
const { locales } = routing;

export function LanguageSwitcher() {
    const locale = useLocaleSafe();

    // Safe navigation hooks with fallback
    let router, pathname;
    try {
        router = useRouter();
        pathname = usePathname();
    } catch (error) {
        console.warn('Navigation context not available, using fallbacks');
        router = { replace: () => { } }; // Fallback router
        pathname = '/'; // Fallback pathname
    }

    const handleLanguageChange = (newLocale: string) => {
        try {
            // Remove the current locale from the pathname and add the new one
            const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '');
            window.location.href = `/${newLocale}${pathWithoutLocale}`;
        } catch (error) {
            console.error('Language change failed:', error);
        }
    };

    return (
        <div className="py-1">
            {locales.map((loc: string) => (
                <button
                    key={loc}
                    onClick={() => handleLanguageChange(loc)}
                    className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        locale === loc 
                            ? 'text-white bg-white/10' 
                            : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <span className="text-lg">{localeFlags[loc as keyof typeof localeFlags]}</span>
                        <span className="font-medium">{localeNames[loc as keyof typeof localeNames]}</span>
                    </div>
                </button>
            ))}
        </div>
    );
}