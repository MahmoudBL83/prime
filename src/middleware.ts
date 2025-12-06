import { withAuth } from 'next-auth/middleware';
import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

export default withAuth(
    function middleware(req) {
        const pathname = req.nextUrl.pathname;
        
        // Skip middleware for API routes entirely
        if (pathname.startsWith('/api')) {
            return null;
        }

        // CRITICAL: Allow admin login page without any checks
        if (pathname === '/admin/login') {
            return null;
        }
        
        // Skip internationalization for admin routes - they don't use locale
        if (!pathname.startsWith('/admin')) {
            const intlResponse = intlMiddleware(req);
            if (intlResponse) return intlResponse;
        }

        // Public routes that don't require authentication
        const publicRoutes = [
            '/courses',
            '/signature-courses',
            '/mentors',
            '/creators',
            '/auth',
            '/verify',
        ];
        
        // Check if current path is public
        const isPublicRoute = publicRoutes.some(route => 
            pathname.includes(route) || pathname === '/' || pathname.match(/^\/(en|ar)?\/?$/)
        );

        // Then handle authentication
        const token = req.nextauth.token;
        const isAuth = !!token;
        const isAuthPage = pathname.includes('/auth');

        // Extract locale from URL or use default locale
        const segments = pathname.split('/').filter(Boolean);

        // Determine if the URL already has a locale
        const hasLocale = routing.locales.includes(segments[0] as any);
        const locale = hasLocale ? segments[0] : routing.defaultLocale;

        // Handle old routes without locale prefix - redirect to locale-based routes
        // EXCEPTION: /admin routes should NOT be redirected (they're separate from locale routes)
        if (!hasLocale && !pathname.startsWith('/admin') && !pathname.startsWith('/api')) {
            // Handle old routes
            if (pathname === '/courses') {
                return NextResponse.redirect(new URL(`/${locale}/courses`, req.url));
            }
            if (pathname === '/dashboard') {
                return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
            }
            if (pathname.startsWith('/auth/')) {
                const authPath = pathname.replace('/auth', '');
                return NextResponse.redirect(new URL(`/${locale}/auth${authPath}`, req.url));
            }
            if (pathname.startsWith('/courses/')) {
                const courseId = pathname.split('/')[2];
                return NextResponse.redirect(new URL(`/${locale}/courses/${courseId}`, req.url));
            }
            if (pathname === '/onboarding') {
                return NextResponse.redirect(new URL(`/${locale}/onboarding`, req.url));
            }
        }

        if (isAuthPage && !pathname.startsWith('/api')) {
            if (isAuth) {
                if (token.role === "ADMIN") {
                    return NextResponse.redirect(new URL('/admin', req.url));
                }
                return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
            }
            return null;
        }

        // Admin routes should not require locale and should not be redirected
        if (pathname.startsWith('/admin')) {
            // Allow access to admin login page - let the page handle sign-out logic
            if (pathname === '/admin/login') {
                // Allow everyone to access the login page
                // The page itself will handle signing out non-admins and redirecting admins
                return null;
            }
            
            // Protect other admin routes
            if (!isAuth) {
                return NextResponse.redirect(new URL('/admin/login', req.url));
            }
            if (token.role !== "ADMIN") {
                return NextResponse.redirect(new URL('/en/dashboard', req.url));
            }
            return null; // Allow access to admin routes
        }

        // Only require authentication for non-public routes
        if (!isAuth && !isPublicRoute) {
            let from = req.nextUrl.pathname;
            if (req.nextUrl.search) {
                from += req.nextUrl.search;
            }
            return NextResponse.redirect(
                new URL(`/${locale}/auth/login?from=${encodeURIComponent(from)}`, req.url)
            );
        }

        if (req.nextUrl.pathname.includes('/creator') && token && (token as any).role !== "CREATOR") {
            return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
        }
    },
    {
        callbacks: {
            async authorized() {
                return true;
            },
        },
    }
);

export const config = {
    matcher: [
        '/((?!api|_next|_vercel|.*\\..*).*)',
        '/(ar|en|de)/:path*',
        '/courses/:path*',
        '/dashboard',
        '/admin/:path*',
        '/onboarding',
        '/verify/:path*'
    ]
};
