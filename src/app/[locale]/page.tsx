import { redirect } from 'next/navigation';

// The mentors feed is the landing experience. Redirect on the server so the
// browser goes straight there instead of rendering a "Loading..." shell first.
export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    redirect(`/${locale}/mentors`);
}
