import { withAuth } from 'next-auth/middleware';
import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

// First path segment (after the locale) of pages that guests may browse
const PUBLIC_SECTIONS = new Set([
    '',
    'courses',
    'signature-courses',
    'mentors',
    'creators',
    'instructors',
    'channels',
    'posts',
    'certificates',
    'auth',
    'login',
    'verify',
    'subscribe',
    'payment-success',
    'leaderboard',
    'about',
    'privacy',
    'terms',
    'help',
    'contact',
]);

// Creator area pages that any signed-in user may open (to apply / finish onboarding)
const CREATOR_OPEN_PAGES = ['/creator/apply', '/creator/onboarding'];

function splitLocale(pathname: string) {
    const segments = pathname.split('/').filter(Boolean);
    const hasLocale = routing.locales.includes(segments[0] as (typeof routing.locales)[number]);
    const locale = hasLocale ? segments[0] : routing.defaultLocale;
    const rest = hasLocale ? segments.slice(1) : segments;
    return { locale, hasLocale, rest, pathWithoutLocale: `/${rest.join('/')}` };
}

export default withAuth(
    function middleware(req) {
        const { pathname, search } = req.nextUrl;
        const token = req.nextauth.token;
        const isAuth = !!token;

        // Admin console lives outside the locale tree
        if (pathname.startsWith('/admin')) {
            if (pathname === '/admin/login') return NextResponse.next();
            if (!isAuth) return NextResponse.redirect(new URL('/admin/login', req.url));
            if (token.role !== 'ADMIN') return NextResponse.redirect(new URL(`/${routing.defaultLocale}/dashboard`, req.url));
            return NextResponse.next();
        }

        // Locale negotiation first: add the locale prefix (redirect) when it is missing
        const intlResponse = intlMiddleware(req);
        if (intlResponse.headers.has('location')) return intlResponse;

        const { locale, rest, pathWithoutLocale } = splitLocale(pathname);
        const section = rest[0] ?? '';

        // Signed-in users don't need the login/register screens
        if (isAuth && (pathWithoutLocale === '/auth/login' || pathWithoutLocale === '/auth/register')) {
            const target = token.role === 'ADMIN' ? '/admin' : `/${locale}/mentors`;
            return NextResponse.redirect(new URL(target, req.url));
        }

        // Everything outside the public sections requires an account
        if (!isAuth && !PUBLIC_SECTIONS.has(section)) {
            const loginUrl = new URL(`/${locale}/auth/login`, req.url);
            loginUrl.searchParams.set('from', `${pathname}${search}`);
            return NextResponse.redirect(loginUrl);
        }

        // Creator studio: verified creators (and admins) only
        if (isAuth && section === 'creator' && !CREATOR_OPEN_PAGES.some((page) => pathWithoutLocale.startsWith(page))) {
            const role = token.role;
            const isVerifiedCreator = role === 'CREATOR' && token.kycStatus === 'VERIFIED';
            if (!isVerifiedCreator && role !== 'ADMIN') {
                return NextResponse.redirect(new URL(`/${locale}/creator/apply`, req.url));
            }
        }

        return intlResponse;
    },
    {
        callbacks: {
            // Never block in withAuth itself; the middleware above decides per route
            authorized() {
                return true;
            },
        },
    }
);

export const config = {
    matcher: [
        // Everything except API routes, Next internals and static files
        '/((?!api|_next|_vercel|.*\\..*).*)',
    ],
};
