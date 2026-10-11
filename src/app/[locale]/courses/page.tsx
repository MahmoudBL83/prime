'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Search, Sparkles } from 'lucide-react'
import { useLocaleSafe } from '@/hooks/useTranslationsSafe'

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
    duration?: number | null
    rating?: number | null
    creator?: { user?: { name?: string | null; arabicName?: string | null } }
}

const accents = [
    'from-blue-950 via-slate-900 to-black',
    'from-violet-950 via-slate-900 to-black',
    'from-emerald-950 via-slate-900 to-black',
    'from-amber-950 via-slate-900 to-black',
    'from-rose-950 via-slate-900 to-black',
]

export default function CoursesPage() {
    const locale = useLocaleSafe()
    const isArabic = locale === 'ar'
    const isGerman = locale === 'de'
    const [courses, setCourses] = useState<Course[]>([])
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(false)
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [error, setError] = useState(false)
    const [query, setQuery] = useState('')
    const [category, setCategory] = useState('All')
    const [heroIndex, setHeroIndex] = useState(0)

    useEffect(() => {
        const controller = new AbortController()
        fetch('/api/courses?limit=36&page=1', { signal: controller.signal })
            .then(response => {
                if (!response.ok) throw new Error('Catalog unavailable')
                return response.json()
            })
            .then(data => {
                setCourses(data.courses || [])
                setHasMore(data.pagination?.pages > 1)
                setError(false)
            })
            .catch(() => { if (!controller.signal.aborted) setError(true) })
            .finally(() => { if (!controller.signal.aborted) setLoading(false) })
        return () => controller.abort()
    }, [])

    const loadMore = async () => {
        if (loadingMore || !hasMore) return
        setLoadingMore(true)
        try {
            const nextPage = page + 1
            const response = await fetch(`/api/courses?limit=36&page=${nextPage}`)
            if (!response.ok) throw new Error('Catalog unavailable')
            const data = await response.json()
            setCourses(current => [...current, ...(data.courses || [])])
            setPage(nextPage)
            setHasMore(nextPage < (data.pagination?.pages || 1))
        } catch {
            setError(true)
        } finally {
            setLoadingMore(false)
        }
    }

    const titleOf = (course: Course) => isArabic
        ? course.titleAr || course.title
        : isGerman ? course.titleDe || course.title : course.title
    const descriptionOf = (course: Course) => isArabic
        ? course.descriptionAr || course.description
        : isGerman ? course.descriptionDe || course.description : course.description
    const labels = {
        explore: isArabic ? 'استكشف الدورة' : isGerman ? 'Kurs entdecken' : 'Explore course',
        search: isArabic ? 'ابحث عن دورة' : isGerman ? 'Kurse suchen' : 'Search courses',
        all: isArabic ? 'الكل' : isGerman ? 'Alle' : 'All',
        featured: isArabic ? 'ابدأ التعلم' : isGerman ? 'Lernen beginnt hier' : 'Learning starts here',
        browse: isArabic ? 'تصفح الدورات' : isGerman ? 'Kurse entdecken' : 'Browse courses',
    }

    const categories = useMemo(() => ['All', ...new Set(courses.map(course => course.category).filter(Boolean))], [courses])
    const filtered = useMemo(() => courses.filter(course => {
        if (category !== 'All' && course.category !== category) return false
        const text = `${course.title} ${course.description} ${course.category} ${course.titleAr || ''} ${course.titleDe || ''}`.toLocaleLowerCase()
        return text.includes(query.trim().toLocaleLowerCase())
    }), [courses, category, query])
    const featured = courses.slice(0, 5)
    const hero = featured[heroIndex % Math.max(1, featured.length)]
    const rows = category === 'All' && !query
        ? categories.slice(1).map(name => ({ name, items: filtered.filter(course => course.category === name) }))
        : [{ name: category === 'All' ? labels.browse : category, items: filtered }]

    return (
        <main dir={isArabic ? 'rtl' : 'ltr'} className="min-h-screen bg-[#080a10] pb-24 text-white">
            {hero && !query && category === 'All' && (
                <section className={`relative isolate flex min-h-[540px] items-end overflow-hidden bg-gradient-to-br ${accents[heroIndex % accents.length]} px-5 pb-20 pt-32 md:min-h-[680px] md:px-12`}>
                    {hero.thumbnail && <Image src={hero.thumbnail} alt="" fill priority sizes="100vw" className="-z-20 object-cover opacity-50" />}
                    <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#080a10] via-[#080a10]/65 to-black/20" />
                    <div className="mx-auto w-full max-w-7xl">
                        <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-sky-300"><Sparkles size={15} /> {labels.featured}</p>
                        <p className="mb-3 text-sm text-white/70">{hero.category} {hero.skillLevel ? `· ${hero.skillLevel}` : ''}</p>
                        <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">{titleOf(hero)}</h1>
                        <p className="mt-5 max-w-xl text-base leading-7 text-white/80 md:text-lg">{descriptionOf(hero)}</p>
                        <div className="mt-7 flex flex-wrap items-center gap-4">
                            <Link href={`/${locale}/courses/${hero.id}`} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 font-semibold text-black transition hover:bg-sky-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-400">
                                {labels.explore} <ArrowRight size={17} className={isArabic ? 'rotate-180' : ''} />
                            </Link>
                            <span className="text-sm text-white/70">{hero.creator?.user?.name || ''}</span>
                        </div>
                    </div>
                    {featured.length > 1 && <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2" aria-label="Featured courses">
                        {featured.map((item, index) => <button key={item.id} onClick={() => setHeroIndex(index)} aria-label={`Show ${titleOf(item)}`} aria-current={index === heroIndex} className={`h-2 rounded-full transition-all ${index === heroIndex ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'}`} />)}
                    </div>}
                </section>
            )}

            <div className="mx-auto max-w-7xl px-5 pt-10 md:px-12">
                <div className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">PRIME</p>
                        <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{labels.browse}</h2>
                        <p className="mt-2 text-sm text-white/55">{isArabic ? 'اختر ما تريد تعلمه بعد ذلك' : isGerman ? 'Wähle aus, was du als Nächstes lernen möchtest' : 'Find the next skill you want to build'}</p>
                    </div>
                    <label className="flex min-h-12 w-full items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.06] px-4 text-white/65 focus-within:border-sky-400 md:w-80">
                        <Search size={18} />
                        <input value={query} onChange={event => setQuery(event.target.value)} placeholder={labels.search} aria-label={labels.search} className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/45" />
                    </label>
                </div>

                <div className="mb-10 flex gap-2 overflow-x-auto pb-2" aria-label="Course categories">
                    {categories.map(name => <button key={name} onClick={() => setCategory(name)} aria-pressed={category === name} className={`min-h-10 shrink-0 rounded-full border px-4 text-sm font-medium transition ${category === name ? 'border-white bg-white text-black' : 'border-white/15 bg-white/[0.05] text-white/75 hover:border-white/40 hover:text-white'}`}>{name === 'All' ? labels.all : name}</button>)}
                </div>

                {loading && <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6" aria-label="Loading courses">{Array.from({ length: 12 }, (_, index) => <div key={index} className="aspect-[3/4] animate-pulse rounded-2xl bg-white/10" />)}</div>}
                {!loading && error && courses.length === 0 && <div className="rounded-2xl border border-white/15 bg-white/5 p-10 text-center"><p>Could not load courses right now.</p><button onClick={() => window.location.reload()} className="mt-4 rounded-full bg-white px-5 py-2 text-sm font-semibold text-black">Try again</button></div>}
                {!loading && !error && filtered.length === 0 && <p className="rounded-2xl border border-white/15 bg-white/5 p-10 text-center text-white/70">{courses.length ? 'No courses match your search.' : 'No published courses yet.'}</p>}

                {rows.filter(row => row.items.length > 0).map(row => <section key={row.name} className="mb-12" aria-label={row.name}>
                    <div className="mb-5 flex items-center justify-between"><h3 className="text-xl font-semibold md:text-2xl">{row.name}</h3><span className="text-sm text-white/45">{row.items.length}</span></div>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
                        {row.items.map((course, index) => <Link key={course.id} href={`/${locale}/courses/${course.id}`} className="group block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-400">
                            <div className={`relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${accents[index % accents.length]} transition duration-300 group-hover:-translate-y-1 group-hover:border-white/40 group-hover:shadow-[0_20px_60px_rgba(0,0,0,.45)]`}>
                                {course.thumbnail && <Image src={course.thumbnail} alt="" fill sizes="(min-width: 1280px) 16vw, (min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw" className="object-cover opacity-80 transition duration-500 group-hover:scale-105" />}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
                                <div className="absolute bottom-0 p-4"><p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-sky-200">{course.category}</p><p className="line-clamp-3 text-base font-semibold leading-snug">{titleOf(course)}</p></div>
                            </div>
                            <p className="mt-2 line-clamp-1 text-xs text-white/55">{course.creator?.user?.name || course.skillLevel || course.category}</p>
                        </Link>)}
                    </div>
                </section>)}

                {hasMore && <div className="text-center"><button onClick={loadMore} disabled={loadingMore} className="min-h-12 rounded-full border border-white/25 px-7 text-sm font-semibold transition hover:bg-white/10 disabled:opacity-50">{loadingMore ? 'Loading…' : 'Load more courses'}</button></div>}
                {error && courses.length > 0 && <p className="mt-5 text-center text-sm text-amber-300">More courses could not be loaded. Please try again.</p>}
            </div>
        </main>
    )
}
