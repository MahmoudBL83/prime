import { redirect } from 'next/navigation';

// Many screens send signed-out users to /login; the sign-in page lives at /auth/login.
export default async function LoginRedirect({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const { locale } = await params;
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(await searchParams)) {
        if (typeof value === 'string') query.set(key, value);
    }
    const qs = query.toString();
    redirect(`/${locale}/auth/login${qs ? `?${qs}` : ''}`);
}
