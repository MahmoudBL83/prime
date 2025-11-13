import { notFound } from 'next/navigation';

// Can be imported from a shared config
export const locales = ['ar', 'en', 'de'] as const;
export type Locale = typeof locales[number];

// This is a client-side utility to validate locales
export function isValidLocale(locale: string): locale is Locale {
    return locales.includes(locale as Locale);
}