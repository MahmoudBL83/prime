'use client';

import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';

export function Footer() {
    const t = useTranslations('footer');
    const tCommon = useTranslations('common');
    const locale = useLocale();
    const currentYear = new Date().getFullYear();

    // Footer translations
    const footerTranslations = {
        about: t('about'),
        help: t('help'),
        terms: t('terms'),
        privacy: t('privacy'),
        contact: t('contact'),
        copyright: `© ${currentYear} Prime. ${t('allRightsReserved')}`
    };

    return (
        <footer className="bg-background border-t border-border/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Main Footer Content */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    {/* Left: Compact Links */}
                    <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm">
                        <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                            {footerTranslations.about}
                        </Link>
                        <Link href="/help" className="text-muted-foreground hover:text-foreground transition-colors">
                            {footerTranslations.help}
                        </Link>
                        <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                            {footerTranslations.terms}
                        </Link>
                        <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                            {footerTranslations.privacy}
                        </Link>
                        <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                            {footerTranslations.contact}
                        </Link>
                    </div>

                    {/* Center: Language Options */}
                    <div className="flex items-center">
                        <LanguageSwitcher />
                    </div>

                    {/* Right: Social Links */}
                    <div className="flex items-center gap-3">
                        <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                            <Facebook className="w-5 h-5" />
                        </a>
                        <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                            <Twitter className="w-5 h-5" />
                        </a>
                        <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                            <Instagram className="w-5 h-5" />
                        </a>
                        <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                            <Youtube className="w-5 h-5" />
                        </a>
                    </div>
                </div>

                {/* Bottom: Copyright */}
                <div className="mt-6 pt-6 border-t border-border/50 text-center">
                    <p className="text-muted-foreground text-sm">
                        {footerTranslations.copyright}
                    </p>
                </div>
            </div>
        </footer>
    );
}