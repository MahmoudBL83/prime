'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, ArrowRight, BookOpen, Clock3, Play, Star } from 'lucide-react'
import { useLocaleSafe } from '@/hooks/useTranslationsSafe'

type Lesson = {
    id: string
    title: string
    titleAr?: string | null
    titleDe?: string | null
    description?: string | null
    descriptionAr?: string | null
    duration?: number | null
    order: number
}

type Course = {
    id: string
    title: string
    titleAr?: string | null
    titleDe?: string | null
    description: string
    descriptionAr?: string | null
    descriptionDe?: string | null
    thumbnail?: string | null
    category: string
    skillLevel?: string | null
    rating?: number | null
    lessons: Lesson[]
    canPlay: boolean
    canEnroll: boolean
    enrolled: boolean
    creator?: { user?: { name?: string | null; arabicName?: string | null; bio?: string | null; profileImage?: string | null } }
}

export default function CourseDetailPage() {
    const params = useParams()
    const router = useRouter()
    const locale = useLocaleSafe()
    const isArabic = locale === 'ar'
    const isGerman = locale === 'de'
    const { data: session, status } = useSession()
    const id = params.id as string
    const [course, setCourse] = useState<Course | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [enrolling, setEnrolling] = useState(false)

    useEffect(() => {
        if (!id || status === 'loading') return
        const controller = new AbortController()
        setLoading(true)
        fetch(`/api/courses/${encodeURIComponent(id)}`, { signal: controller.signal, cache: 'no-store' })
            .then(response => {
                if (!response.ok) throw new Error(response.status === 404 ? 'Course not found' : 'Could not load this course')
                return response.json()
            })
            .then(data => { setCourse(data); setError(null) })
            .catch(cause => { if (!controller.signal.aborted) setError(cause.message) })
            .finally(() => { if (!controller.signal.aborted) setLoading(false) })
        return () => controller.abort()
    }, [id, status, session?.user?.id])

    const title = course ? (isArabic ? course.titleAr || course.title : isGerman ? course.titleDe || course.title : course.title) : ''
    const description = course ? (isArabic ? course.descriptionAr || course.description : isGerman ? course.descriptionDe || course.description : course.description) : ''
    const lessonTitle = (lesson: Lesson) => isArabic ? lesson.titleAr || lesson.title : isGerman ? lesson.titleDe || lesson.title : lesson.title
    const learnUrl = `/${locale}/courses/${id}/learn`

    const enroll = async () => {
        if (!course || enrolling) return
        setEnrolling(true)
        setError(null)
        try {
            const response = await fetch(`/api/courses/${encodeURIComponent(id)}/enroll`, { method: 'POST' })
            const data = await response.json()
            if (!response.ok) {
                if (response.status === 402) {
                    router.push(`/${locale}/subscribe`)
                    return
                }
                throw new Error(data.message || data.error || 'Could not enroll')
            }
            router.push(learnUrl)
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Could not enroll')
        } finally {
            setEnrolling(false)
        }
    }

    if (loading) return <main className="min-h-screen bg-[#080a10] p-6 text-white"><div className="mx-auto mt-24 max-w-7xl animate-pulse"><div className="mb-5 h-5 w-32 rounded bg-white/10" /><div className="h-14 w-2/3 rounded bg-white/10" /><div className="mt-8 h-64 rounded-3xl bg-white/10" /></div></main>
    if (!course) return <main className="flex min-h-[70vh] flex-col items-center justify-center bg-[#080a10] px-6 text-center text-white"><h1 className="text-3xl font-semibold">{error || 'Course not found'}</h1><Link href={`/${locale}/courses`} className="mt-6 rounded-full bg-white px-6 py-3 font-semibold text-black">Browse courses</Link></main>

    return <main dir={isArabic ? 'rtl' : 'ltr'} className="min-h-screen bg-[#080a10] pb-24 text-white">
        <section className="relative isolate flex min-h-[530px] items-end overflow-hidden bg-gradient-to-br from-sky-950 via-slate-900 to-black px-5 pb-16 pt-28 md:min-h-[640px] md:px-12">
            {course.thumbnail && <Image src={course.thumbnail} alt="" fill priority sizes="100vw" className="-z-20 object-cover opacity-45" />}
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#080a10] via-[#080a10]/70 to-black/20" />
            <div className="mx-auto w-full max-w-7xl">
                <Link href={`/${locale}/courses`} className="mb-8 inline-flex items-center gap-2 text-sm text-white/75 hover:text-white"><ArrowLeft size={16} className={isArabic ? 'rotate-180' : ''} /> {isArabic ? 'جميع الدورات' : isGerman ? 'Alle Kurse' : 'All courses'}</Link>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">{course.category}</p>
                <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">{title}</h1>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/65">
                    {course.creator?.user?.name && <span>{isArabic ? course.creator.user.arabicName || course.creator.user.name : course.creator.user.name}</span>}
                    {course.skillLevel && <span>{course.skillLevel}</span>}
                    <span className="inline-flex items-center gap-1"><BookOpen size={15} /> {course.lessons.length} {isGerman ? 'Lektionen' : 'lessons'}</span>
                    {!!course.rating && course.rating > 0 && <span className="inline-flex items-center gap-1"><Star size={14} /> {course.rating.toFixed(1)}</span>}
                </div>
                <p className="mt-6 max-w-2xl text-base leading-7 text-white/80 md:text-lg">{description}</p>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                    {course.lessons.length > 0 && course.canPlay && <Link href={learnUrl} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 font-semibold text-black hover:bg-sky-100"><Play size={17} fill="currentColor" /> {isGerman ? 'Weiterlernen' : 'Start learning'}</Link>}
                    {course.lessons.length > 0 && !course.canPlay && course.canEnroll && <button onClick={enroll} disabled={enrolling} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 font-semibold text-black hover:bg-sky-100 disabled:opacity-60">{enrolling ? 'Enrolling…' : 'Enroll and start'} <ArrowRight size={17} /></button>}
                    {course.lessons.length > 0 && !course.canEnroll && status === 'unauthenticated' && <Link href={`/${locale}/auth/login?from=${encodeURIComponent(`/${locale}/courses/${id}`)}`} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 font-semibold text-black hover:bg-sky-100">Sign in to enroll <ArrowRight size={17} /></Link>}
                    {course.lessons.length > 0 && !course.canEnroll && status === 'authenticated' && <Link href={`/${locale}/subscribe`} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 font-semibold text-black hover:bg-sky-100">View access plans <ArrowRight size={17} /></Link>}
                    {course.lessons.length === 0 && <p className="rounded-full border border-white/20 px-5 py-3 text-sm text-white/75">Lessons are being prepared</p>}
                </div>
                {error && <p role="alert" className="mt-4 text-sm text-amber-300">{error}</p>}
            </div>
        </section>

        <div className="mx-auto grid max-w-7xl gap-12 px-5 pt-12 md:px-12 lg:grid-cols-[minmax(0,1fr)_280px]">
            <section>
                <div className="mb-6 flex items-end justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">COURSE CONTENT</p><h2 className="mt-2 text-2xl font-bold">{isArabic ? 'الدروس' : isGerman ? 'Lektionen' : 'What you’ll learn'}</h2></div><span className="text-sm text-white/50">{course.lessons.length} lessons</span></div>
                {course.lessons.length === 0 ? <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-white/65">The instructor has not published lessons for this course yet.</div> : <ol className="space-y-3">{course.lessons.map((lesson, index) => <li key={lesson.id} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-white/25 md:p-5"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-400/10 font-semibold text-sky-300">{String(index + 1).padStart(2, '0')}</div><div className="min-w-0 flex-1"><h3 className="font-semibold">{lessonTitle(lesson)}</h3>{(isArabic ? lesson.descriptionAr || lesson.description : lesson.description) && <p className="mt-1 line-clamp-2 text-sm leading-6 text-white/60">{isArabic ? lesson.descriptionAr || lesson.description : lesson.description}</p>}</div>{!!lesson.duration && <span className="hidden items-center gap-1 self-start text-xs text-white/50 sm:inline-flex"><Clock3 size={13} /> {Math.round(lesson.duration / 60)} min</span>}</li>)}</ol>}
            </section>
            <aside className="h-fit rounded-2xl border border-white/10 bg-white/[0.04] p-6"><h2 className="text-lg font-semibold">About this course</h2><p className="mt-3 text-sm leading-6 text-white/65">{description}</p>{course.creator?.user?.name && <div className="mt-6 border-t border-white/10 pt-5"><p className="text-xs uppercase tracking-wider text-white/45">Instructor</p><p className="mt-2 font-semibold">{course.creator.user.name}</p>{course.creator.user.bio && <p className="mt-2 text-sm leading-6 text-white/60">{course.creator.user.bio}</p>}</div>}</aside>
        </div>
    </main>
}
