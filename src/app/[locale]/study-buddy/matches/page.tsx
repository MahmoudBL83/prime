import { redirect } from 'next/navigation'

// Matches are shown in the Study Buddy sidebar (desktop) / Matches tab (mobile)
export default async function StudyBuddyMatchesRedirect({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    redirect(`/${locale}/study-buddy?tab=matches`)
}
