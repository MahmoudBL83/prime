'use client';

import { useTransition } from 'react';
import { useRouter, usePathname } from '@/i18n/navigation';
import { routing, localeNames, localeFlags } from '@/i18n/routing';
import { useLocaleSafe } from '@/hooks/useTranslationsSafe';

const { locales: routingLocales } = routing;

interface LanguageSwitcherProps {
    locales?: string[];
}

export function LanguageSwitcher({ locales }: LanguageSwitcherProps = {}) {
    const locale = useLocaleSafe();
    const router = useRouter();
    // next-intl's usePathname returns the path without the locale prefix
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const handleLanguageChange = (newLocale: string) => {
        if (newLocale === locale) return;
        const query = typeof window !== 'undefined' ? window.location.search : '';
        startTransition(() => {
            router.replace(`${pathname}${query}`, { locale: newLocale as (typeof routingLocales)[number] });
        });
    };

    const availableLocales = locales && locales.length > 0 ? locales : routingLocales;

    return (
        <div className={`py-1 ${isPending ? 'opacity-60 pointer-events-none' : ''}`}>
            {availableLocales.map((loc: string) => (
                <button
                    key={loc}
                    onClick={() => handleLanguageChange(loc)}
                    aria-current={locale === loc ? 'true' : undefined}
                    className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${locale === loc
                        ? 'text-foreground bg-foreground/[0.08]'
                        : 'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]'
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
