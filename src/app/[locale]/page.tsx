'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Hero } from '@/components/landing/Hero';
import { NetflixCourseShowcase } from '@/components/landing/NetflixCourseShowcase';
import { StreamingShowcase } from '@/components/landing/StreamingShowcase';
import { useStreamingCourses } from '@/components/landing/streamingCourseData';
import { toast } from 'react-hot-toast';
import { useHomepageCourses } from '@/hooks/useHomepageCourses';
import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { useTranslationsSafe } from '@/hooks/useTranslationsSafe';
import { useNavigationLoading } from '@/hooks/useNavigationLoading';
import { LoadingButton } from '@/components/ui/LoadingButton';
import { Sparkles, BookOpen, Users, Trophy, Globe, Video, Award, MessageCircle } from 'lucide-react';

export default function Home() {
    
    const router = useRouter();
    const params = useParams();
    const { navigateWithLoading, isLoading, resetLoading } = useNavigationLoading();
    const { t } = useTranslationsSafe('landing');
    const { t: tCommon } = useTranslationsSafe('common');
    const { t: tCourses } = useTranslationsSafe('courses');
    const { locale } = useTranslationsSafe('landing');
    
    const currentLocale = params?.locale as string || 'en'
    const lang = currentLocale === 'ar' ? 'ar' : 'en'

    // Signature courses and mentors previews with caching
    const [signatureCourses, setSignatureCourses] = useState<any[]>([])
    const [mentorsPreview, setMentorsPreview] = useState<any[]>([])

    // Fetch real course data from database
    const { data: homepageData, loading, error } = useHomepageCourses();

    // Get static streaming course data as fallback
    const { topCourses: staticTopCourses, newReleases: staticNewReleases, featuredEgyptian } = useStreamingCourses();

    // Optimized data loading with caching and batching
    useEffect(() => {
        let mounted = true
        let loadingPromises: Promise<any>[] = []

        // Cache keys for 5 minutes
        const SIGNATURE_CACHE_KEY = 'signature-courses-preview'
        const MENTORS_CACHE_KEY = 'mentors-preview'
        const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

        const getCached = (key: string) => {
            try {
                const cached = localStorage.getItem(key)
                if (cached) {
                    const { data, timestamp } = JSON.parse(cached)
                    if (Date.now() - timestamp < CACHE_DURATION) {
                        return data
                    }
                }
            } catch (err) {
                // Ignore cache errors
            }
            return null
        }

        const setCache = (key: string, data: any) => {
            try {
                localStorage.setItem(key, JSON.stringify({
                    data,
                    timestamp: Date.now()
                }))
            } catch (err) {
                // Ignore cache errors
            }
        }

        const loadSignature = async () => {
            // Try cache first
            const cached = getCached(SIGNATURE_CACHE_KEY)
            if (cached) {
                if (mounted) setSignatureCourses(cached)
                return
            }

            try {
                const res = await fetch('/api/signature-courses')
                if (!res.ok) return
                const data = await res.json()
                if (!mounted) return
                
                const courses = (data.courses || []).slice(0, 12)
                setSignatureCourses(courses)
                setCache(SIGNATURE_CACHE_KEY, courses)
            } catch (err) {
                console.warn('Failed to load signature courses', err)
            }
        }

        const loadMentors = async () => {
            // Try cache first
            const cached = getCached(MENTORS_CACHE_KEY)
            if (cached) {
                if (mounted) setMentorsPreview(cached)
                return
            }

            try {
                const res = await fetch('/api/instructors')
                if (!res.ok) return
                const data = await res.json()
                if (!mounted) return
                
                const instructors = (data.instructors || []).slice(0, 4).map((ins: any) => ({
                    id: ins.id,
                    name: ins.user?.name || ins.user?.arabicName || 'Instructor',
                    profileImage: ins.user?.profileImage || null,
                    expertise: ins.expertise || '',
                    price: ins.basicMonthlyPrice || 0,
                }))
                setMentorsPreview(instructors)
                setCache(MENTORS_CACHE_KEY, instructors)
            } catch (err) {
                console.warn('Failed to load mentors preview', err)
            }
        }

        // Load data in parallel but only if not cached
        loadingPromises.push(loadSignature())
        loadingPromises.push(loadMentors())

        // Wait for all to complete
        Promise.all(loadingPromises).catch(err => {
            console.warn('Some homepage data failed to load', err)
        })

        return () => { 
            mounted = false 
            // Cancel any pending promises by ignoring their results
        }
    }, [])

    return (
        <div className="min-h-screen bg-black relative overflow-hidden">
            {/* Clean Background with Subtle Accents */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Subtle gradient overlay (lighter & non-interactive) */}
                <div className="absolute inset-0 bg-gradient-to-b from-gray-900/20 via-black/10 to-black/5 pointer-events-none"></div>
                
                {/* Minimal decorative elements */}
                <div className="absolute top-1/4 left-10 w-32 h-32 bg-purple-600/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/3 right-10 w-40 h-40 bg-blue-600/5 rounded-full blur-3xl"></div>
            </div>
            
            {/* Hero Section */}
            <Hero />

            {/* Streaming-Style Course Showcase */}
            <div className="relative py-8 px-4 sm:px-6 lg:px-8">
                {/* Clean section background (lighter overlay for better visibility) */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/5 pointer-events-none" />
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="relative">
                            <div className="absolute inset-0 w-16 h-16 border-4 border-purple-500/30 rounded-full animate-ping"></div>
                            <div className="w-16 h-16 border-4 border-purple-500/50 border-t-purple-400 rounded-full animate-spin mx-auto mb-6"></div>
                        </div>
                        <div className="ml-4">
                            <p className="text-purple-200 text-lg font-medium">Loading courses...</p>
                            <p className="text-gray-400 text-sm mt-1">Discovering amazing content for you</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="flex items-center justify-center py-20">
                        <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-2xl p-6 text-center max-w-md">
                            <div className="text-red-400 text-xl mb-2">⚠️ Unable to Load Courses</div>
                            <div className="text-red-300">Error: {error}</div>
                            <button 
                                onClick={() => window.location.reload()} 
                                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                )}

                {!loading && !error && homepageData && homepageData.totalCourses > 0 && (
                    <>
                        {/* Top Trending Courses - Netflix Style */}
                        {homepageData.topCourses.length > 0 && (
                            <NetflixCourseShowcase
                                title={lang === 'ar' ? 'الدورات الأكثر رواجاً' : 'Trending Now'}
                                courses={homepageData.topCourses.slice(0, 12)}
                                lang={lang}
                                onCourseClick={(id) => router.push(`/${currentLocale}/courses/${id}`)}
                            />
                        )}

                        {/* Featured Courses - Netflix Style */}
                        {homepageData.featuredCourses.length > 0 && (
                            <NetflixCourseShowcase
                                title={lang === 'ar' ? 'الدورات المميزة' : 'Popular on Platform'}
                                courses={homepageData.featuredCourses.slice(0, 12)}
                                lang={lang}
                                onCourseClick={(id) => router.push(`/${currentLocale}/courses/${id}`)}
                            />
                        )}
                    </>
                )}

                {/* Fallback to static data if no database courses */}
                {!loading && !error && (!homepageData || homepageData.totalCourses === 0) && (
                    <>
                        <div className="text-center py-12 mb-8">
                            <div className="bg-gradient-to-r from-yellow-500/16 to-orange-500/16 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-6 max-w-2xl mx-auto">
                                <div className="text-yellow-300 text-2xl mb-2">Demo Mode</div>
                                <p className="text-yellow-300 text-lg font-medium mb-2">Using Sample Course Data</p>
                                <p className="text-gray-400">Connect to database for real courses and content!</p>
                            </div>
                        </div>
                        
                        {/* Static Top Courses - Netflix Style */}
                        <NetflixCourseShowcase
                            title={lang === 'ar' ? 'الدورات الأكثر رواجاً' : 'Trending Now'}
                            courses={staticTopCourses as any}
                            lang={lang}
                            onCourseClick={(id) => router.push(`/${currentLocale}/courses/${id}`)}
                        />

                        {/* Static New Releases - Netflix Style */}
                        <NetflixCourseShowcase
                            title={lang === 'ar' ? 'أحدث الإصدارات' : 'New Releases'}
                            courses={staticNewReleases as any}
                            lang={lang}
                            onCourseClick={(id) => router.push(`/${currentLocale}/courses/${id}`)}
                        />
                    </>
                )}

                {/* Signature Courses Showcase (improved layout) */}
                {signatureCourses.length > 0 && (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 gap-4">
                            <div>
                                <h2 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight">{lang === 'ar' ? 'الدورات المميزة' : 'Signature Programs'}</h2>
                                <p className="text-gray-400 mt-2 max-w-xl">{lang === 'ar' ? 'برامج مُنتقاة وعالية الإنتاج من أفضل الخبراء — مسارات مُصممة لإحداث تغيير حقيقي في مهاراتك.' : 'Curated, high-production programs from top experts — structured pathways designed to deliver real results.'}</p>
                            </div>

                            <div className="flex items-center gap-3">
                                <button onClick={() => router.push(`/${currentLocale}/signature-courses`)} className="px-4 py-2 rounded-full bg-white text-black font-semibold">{lang === 'ar' ? 'عرض جميع البرامج' : 'Explore Signature'}</button>
                                <button onClick={() => router.push(`/${currentLocale}/subscribe`)} className="px-4 py-2 rounded-full border border-white/10 text-white bg-transparent">{lang === 'ar' ? 'اشترك الآن' : 'Subscribe'}</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Featured large card */}
                            {signatureCourses[0] && (
                                <div className="col-span-1 rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-gray-900/90 to-black">
                                    <div className="relative aspect-video">
                                        <img src={signatureCourses[0].thumbnail || '/images/courses/netflix1.jpg'} alt={signatureCourses[0].title} className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/courses/netflix1.jpg' }} />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent pointer-events-none" />
                                        <div className="absolute top-4 left-4">
                                            <span className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full text-xs font-bold">PREMIUM</span>
                                        </div>
                                    </div>
                                    <div className="p-6 bg-[#070707]">
                                        <h3 className="text-2xl font-bold text-white mb-2">{signatureCourses[0].title}</h3>
                                        <p className="text-sm text-gray-400 mb-4 line-clamp-3">{signatureCourses[0].description}</p>
                                        <div className="flex items-center gap-3">
                                            <div className="text-sm text-gray-300">{signatureCourses[0].duration ? (typeof signatureCourses[0].duration === 'number' ? `${Math.floor(signatureCourses[0].duration/60)}h ${signatureCourses[0].duration%60}m` : signatureCourses[0].duration) : ''}</div>
                                            <div className="ml-auto">
                                                <button onClick={() => router.push(`/${currentLocale}/courses/${signatureCourses[0].id}`)} className="px-4 py-2 rounded-full bg-cyan-500 text-white font-semibold">{lang === 'ar' ? 'ابدأ الآن' : 'Start Program'}</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Scrollable list for other signature courses */}
                            <div className="col-span-2">
                                <div id="row-signature" className="flex gap-6 overflow-x-auto scrollbar-hide py-2">
                                    {signatureCourses.slice(1).map((course: any) => (
                                        <div key={course.id} className="flex-shrink-0 w-[320px] sm:w-[360px] rounded-xl overflow-hidden bg-[#0b0b0b] border border-white/6 shadow-lg">
                                            <div className="relative aspect-video">
                                                <img src={course.thumbnail || '/images/courses/netflix1.jpg'} alt={course.title} className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/courses/netflix1.jpg' }} />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent pointer-events-none" />
                                            </div>
                                            <div className="p-4">
                                                <h4 className="text-lg font-semibold text-white line-clamp-2">{course.title}</h4>
                                                <p className="text-sm text-gray-400 mt-2 line-clamp-2">{course.description}</p>
                                                <div className="flex items-center mt-3">
                                                    <div className="text-sm text-gray-300">{course.duration || ''}</div>
                                                    <div className="ml-auto text-sm text-gray-400">{course.enrollmentCount ? `${(course.enrollmentCount/1000).toFixed(1)}K` : ''}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Mentoring Preview - richer feed with CTA panel */}
                {mentorsPreview.length > 0 && (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-3xl font-extrabold text-white">{lang === 'ar' ? 'المرشدون والتوجيه' : 'Mentors & Coaching'}</h2>
                                <p className="text-gray-400 mt-2 max-w-2xl">{lang === 'ar' ? 'تواصل مع خبراء للحصول على إرشاد مخصص، جلسات 1:1 وخطط تعلم مدروسة.' : 'Connect with experts for tailored guidance — 1:1 sessions, structured coaching and real outcomes.'}</p>
                            </div>
                            <div>
                                <button onClick={() => router.push(`/${currentLocale}/mentors`)} className="px-4 py-2 rounded-full bg-white text-black font-semibold">{lang === 'ar' ? 'استعرض المرشدين' : 'Browse Mentors'}</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left: mentor feed (two-thirds) */}
                            <div className="lg:col-span-2 space-y-4">
                                {mentorsPreview.map((m, idx) => (
                                    <div key={m.id} className="p-4 bg-white/[0.02] border border-white/6 rounded-2xl flex items-start gap-4 hover:bg-white/[0.03] transition-colors">
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 overflow-hidden flex items-center justify-center flex-shrink-0">
                                            {m.profileImage ? <img src={m.profileImage} alt={m.name} className="w-full h-full object-cover" /> : <span className="text-white font-bold">{m.name?.[0] || 'M'}</span>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-4">
                                                <div>
                                                    <div className="font-semibold text-white truncate">{m.name}</div>
                                                    <div className="text-sm text-gray-400 truncate">{m.expertise}</div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-sm font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{m.price} EGP</div>
                                                    <button onClick={() => router.push(`/${currentLocale}/mentors/${m.id}`)} className="px-3 py-1 rounded-full bg-transparent border border-white/10 text-sm">{lang === 'ar' ? 'عرض القناة' : 'View'}</button>
                                                    <button onClick={() => toast.success(lang === 'ar' ? 'تم الطلب' : 'Requested')} className="px-3 py-1 rounded-full bg-purple-600 text-white text-sm">{lang === 'ar' ? 'احجز جلسة' : 'Book'}</button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-400 mt-2 line-clamp-2">{m.expertise ? `Offers mentoring in ${m.expertise}` : ''}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Right: CTA / Promo panel */}
                            <div className="lg:col-span-1 bg-gradient-to-br from-gray-900/40 to-black/10 rounded-2xl p-6 border border-white/6">
                                <h4 className="text-xl font-bold text-white mb-2">{lang === 'ar' ? 'هل تبحث عن مرشد؟' : 'Looking for a mentor?'}</h4>
                                <p className="text-gray-400 mb-4">{lang === 'ar' ? 'اطلب جلسة استشارية أولى أو استعرض باقات التدريب المتاحة.' : 'Request an initial consultation or explore coaching packages.'}</p>
                                <div className="flex flex-col gap-3">
                                    <button onClick={() => router.push(`/${currentLocale}/mentors`)} className="w-full px-4 py-3 rounded-full bg-white text-black font-semibold">{lang === 'ar' ? 'استعرض المرشدين' : 'Find a Mentor'}</button>
                                    <button onClick={() => router.push(`/${currentLocale}/mentors`)} className="w-full px-4 py-3 rounded-full border border-white/10 text-white">{lang === 'ar' ? 'اطلب جلسة' : 'Request a Session'}</button>
                                </div>
                                <div className="mt-6 text-sm text-gray-500">
                                    <div className="mb-2">{lang === 'ar' ? 'مزايا:' : 'Perks:'}</div>
                                    <ul className="list-disc list-inside text-gray-400">
                                        <li>{lang === 'ar' ? 'جلسات 1:1' : '1:1 sessions'}</li>
                                        <li>{lang === 'ar' ? 'خطة تعلم مخصصة' : 'Personalized learning plan'}</li>
                                        <li>{lang === 'ar' ? 'دعم مستمر' : 'Ongoing support'}</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Call to Action section removed per request */}
        </div>
    );
}