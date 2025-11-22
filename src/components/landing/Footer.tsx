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
        <footer className="bg-black border-t border-white/10">
            <div className="max-w-screen-2xl mx-auto px-8 py-12">
                {/* Footer Links */}
                <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 mb-8">
                    <Link href="/about" className="text-sm text-white/60 hover:text-white transition-colors">
                        {footerTranslations.about}
                    </Link>
                    <Link href="/help" className="text-sm text-white/60 hover:text-white transition-colors">
                        {footerTranslations.help}
                    </Link>
                    <Link href="/terms" className="text-sm text-white/60 hover:text-white transition-colors">
                        {footerTranslations.terms}
                    </Link>
                    <Link href="/privacy" className="text-sm text-white/60 hover:text-white transition-colors">
                        {footerTranslations.privacy}
                    </Link>
                    <Link href="/contact" className="text-sm text-white/60 hover:text-white transition-colors">
                        {footerTranslations.contact}
                    </Link>
                </div>

                {/* Language Switcher */}
                <div className="flex justify-center mb-6">
                    <LanguageSwitcher />
                </div>

                {/* Social Links */}
                <div className="flex justify-center gap-6 mb-8">
                    <a href="#" className="text-white/60 hover:text-white transition-colors">
                        <Facebook className="w-5 h-5" />
                    </a>
                    <a href="#" className="text-white/60 hover:text-white transition-colors">
                        <Twitter className="w-5 h-5" />
                    </a>
                    <a href="#" className="text-white/60 hover:text-white transition-colors">
                        <Instagram className="w-5 h-5" />
                    </a>
                    <a href="#" className="text-white/60 hover:text-white transition-colors">
                        <Youtube className="w-5 h-5" />
                    </a>
                </div>

                {/* Copyright */}
                <div className="text-center">
                    <p className="text-xs text-white/40">
                        {footerTranslations.copyright}
                    </p>
                </div>
            </div>
        </footer>
    );
}