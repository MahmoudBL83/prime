import { redirect } from 'next/navigation'

// Swiping lives on the main Study Buddy screen (one Tinder-style experience)
export default async function StudyBuddySwipeRedirect({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    redirect(`/${locale}/study-buddy`)
}
