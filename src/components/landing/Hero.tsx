import { motion } from 'framer-motion';
import { Play, Plus, Star, Info, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useTranslationsSafe } from '@/hooks/useTranslationsSafe';
import { useRouter } from 'next/navigation';
import { useNavigationLoading } from '@/hooks/useNavigationLoading';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';

export function Hero() {
    const { ref, inView, animationProps } = useScrollAnimation();
    const { t } = useTranslationsSafe('landing');
    const { t: tCourses } = useTranslationsSafe('courses');
    const { t: tCommon } = useTranslationsSafe('common');
    const { locale } = useTranslationsSafe('landing');
    const router = useRouter();
    const { navigateWithLoading, isLoading } = useNavigationLoading();
    const [isMuted, setIsMuted] = useState(true);
    const [trailerOpen, setTrailerOpen] = useState(false);
    const [bgVideoPlayable, setBgVideoPlayable] = useState(true);
    const [promoVideoPlayable, setPromoVideoPlayable] = useState(true);
    const [hoverPreviewPlayable, setHoverPreviewPlayable] = useState<Record<number, boolean>>({});
    const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const trailerRef = useRef<HTMLVideoElement>(null);

    // Hero no longer shows a course; this component highlights platform features.
    const featuredCourse = null

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.play().catch(error => {
                console.log('Auto-play prevented:', error);
            });
        }
    }, []);

    // Close trailer modal on Escape
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && trailerOpen) setTrailerOpen(false)
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [trailerOpen])

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
            setIsMuted(!isMuted);
        }
    };

    return (
        <section ref={ref} className="relative h-screen w-full flex items-center overflow-hidden">
            {/* Full Screen Background with Parallax */}
            <div className="absolute inset-0 z-0">
                {/* Video Element with Scale Animation */}
                <motion.div
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 10, ease: "easeOut" }}
                    className="absolute inset-0"
                >
                    {bgVideoPlayable ? (
                        <video
                            ref={videoRef}
                            className="absolute inset-0 w-full h-full object-cover"
                            autoPlay
                            loop
                            muted={isMuted}
                            playsInline
                            poster={featuredCourse?.thumbnailUrl || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920'}
                            onError={() => setBgVideoPlayable(false)}
                            onCanPlay={() => setBgVideoPlayable(true)}
                        >
                            <source src="/videos/demo/course-promo.mp4" type="video/mp4" />
                        </video>
                    ) : (
                        <div className="absolute inset-0 w-full h-full -z-10">
                            <Image
                                src={featuredCourse?.thumbnailUrl || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920'}
                                alt={featuredCourse?.title || 'Featured Course'}
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                    )}
                </motion.div>

                {/* Cinematic Vignette - lighter, non-blocking gradient layers */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/20 to-black/10 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-black/10 to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/10 pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/20 via-black/30 to-transparent pointer-events-none" />
                
                {/* Animated Purple Glow Effect */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-purple-500/12 via-transparent to-pink-500/12 pointer-events-none"
                    animate={{
                        opacity: [0.12, 0.22, 0.12],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            </div>

            {/* Enhanced Control Buttons */}
            <div className="absolute top-24 right-6 z-20 flex gap-3">
                <motion.button
                    onClick={toggleMute}
                    className="p-3 bg-background/50 hover:bg-background/70 backdrop-blur-xl border border-purple-500/30 hover:border-purple-500/60 rounded-xl transition-all duration-300 shadow-lg shadow-purple-500/10"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                >
                    {isMuted ? (
                        <VolumeX className="w-5 h-5 text-foreground" />
                    ) : (
                        <Volume2 className="w-5 h-5 text-purple-400" />
                    )}
                </motion.button>
            </div>

            {/* Enhanced Content Section - Centered */}
            <motion.div
                className="relative z-10 w-full px-6 sm:px-8 lg:px-12"
                {...animationProps}
            >
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                        {/* Left: headline + features */}
                        <div>
                            <motion.h1
                                className="text-5xl sm:text-6xl lg:text-6xl font-extrabold text-white leading-tight mb-4"
                                initial={{ opacity: 0, y: 20 }}
                                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                                transition={{ duration: 0.6 }}
                            >
                                A whole new way to learn — gamified, cinematic, and social.
                            </motion.h1>

                            <motion.p className="text-lg text-gray-300 mb-6 max-w-xl" initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : { opacity: 0 }} transition={{ delay: 0.15 }}>
                                Turn learning into a story: signature programs, 1:1 mentoring, and bite-sized quests with real rewards. Watch trailers, track XP, and level up on our platform.
                            </motion.p>

                            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                                <button onClick={() => navigateWithLoading(`/${locale}/subscribe`, 'hero-cta-join')} className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold shadow-lg">Join Now</button>
                                <button onClick={() => navigateWithLoading(`/${locale}/signature-courses`, 'hero-cta-features')} className="px-6 py-3 rounded-full border border-white/10 text-white">Explore Features</button>
                            </div>

                            {/* Feature cards with hover preview */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {[
                                            { title: 'Gamified Paths', desc: 'Quests, XP, leaderboards and achievements that keep learners hooked.' , preview: '/videos/demo/feature-preview.mp4', thumb: 'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?w=800' },
                                            { title: 'Cinematic Signature Programs', desc: 'High-production courses designed as multi-episode learning journeys.', preview: '/videos/demo/feature-preview.mp4', thumb: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800' },
                                            { title: 'Mentors & 1:1 Coaching', desc: 'Book sessions with expert mentors, get personal plans and real outcomes.', preview: '/videos/demo/feature-preview.mp4', thumb: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800' },
                                        ].map((f, i) => (
                                            <motion.div
                                                key={f.title}
                                                onMouseEnter={() => setHoveredFeature(i)}
                                                onMouseLeave={() => setHoveredFeature(null)}
                                                className="relative p-4 bg-white/5 rounded-xl border border-white/6 overflow-hidden"
                                                whileHover={{ y: -6 }}
                                            >
                                                <div className="font-bold text-white">{f.title}</div>
                                                <div className="text-sm text-gray-300 mt-1">{f.desc}</div>

                                                {hoveredFeature === i && (
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                                                        {hoverPreviewPlayable[i] !== false ? (
                                                            <video
                                                                className="w-full h-full object-cover opacity-100"
                                                                src={f.preview}
                                                                muted
                                                                autoPlay
                                                                loop
                                                                playsInline
                                                                onError={() => setHoverPreviewPlayable(prev => ({...prev, [i]: false}))}
                                                                onCanPlay={() => setHoverPreviewPlayable(prev => ({...prev, [i]: true}))}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full">
                                                                <Image src={f.thumb} alt={f.title} fill className="object-cover" />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                            </div>

                            {/* Animated stats */}
                            <div className="flex items-center gap-6 mt-6">
                                <Stat number={42000} label="Learners" />
                                <Stat number={1200} label="Courses" />
                                <Stat number={350} label="Mentors" />
                            </div>
                        </div>

                        {/* Right: decorative placeholder (promo image removed) */}
                        <div className="relative">
                            <div className="w-full h-64 rounded-3xl overflow-hidden shadow-2xl border border-white/6 bg-gradient-to-br from-purple-700/10 to-pink-600/6" aria-hidden="true" />
                        </div>
                    </div>
                </div>
            </motion.div>
                {/* Featured mini card on the right for large screens (fresh UX idea) */}
                <div className="hidden lg:block absolute right-12 top-24 z-20">
                    <div className="w-80 rounded-2xl overflow-hidden shadow-2xl bg-black/40 border border-white/6 backdrop-blur-sm">
                        <img
                            src={featuredCourse?.thumbnailUrl || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200'}
                            alt={featuredCourse?.title || 'Featured'}
                            className="w-full h-48 object-cover"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/courses/netflix1.jpg' }}
                        />
                        <div className="p-4 bg-gradient-to-t from-black/40 to-transparent">
                            <div className="text-sm text-white font-semibold line-clamp-2 mb-3">{featuredCourse?.title}</div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => navigateWithLoading(featuredCourse ? `/${locale}/courses/${featuredCourse.id}` : `/${locale}/courses`, 'hero-mini-play')}
                                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white px-3 py-2 rounded-full font-semibold text-sm transition-all shadow-md"
                                >
                                    <Play className="w-4 h-4" />
                                    <span>Play</span>
                                </button>
                                <button
                                    onClick={() => navigateWithLoading(featuredCourse ? `/${locale}/courses/${featuredCourse.id}` : `/${locale}/courses`, 'hero-mini-start')}
                                    className="px-3 py-2 rounded-full border border-white/10 text-white text-sm"
                                >Start</button>
                            </div>
                            <div className="mt-3 text-sm">
                                <button
                                    onClick={() => setTrailerOpen(true)}
                                    className="text-purple-300 hover:underline"
                                >
                                    {t('hero.watchTrailer') || 'Watch trailer'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Trailer Modal */}
                {trailerOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setTrailerOpen(false)} />
                        <div className="relative w-full max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl z-50">
                            <video
                                ref={trailerRef}
                                className="w-full h-auto bg-black"
                                controls
                                autoPlay
                                playsInline
                            >
                                <source src={featuredCourse?.trailerUrl || '/videos/demo/course-trailer.mp4'} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                            <button
                                onClick={() => {
                                    try { trailerRef.current?.pause() } catch (e) {}
                                    setTrailerOpen(false)
                                }}
                                className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/60 flex items-center justify-center text-white border border-white/10"
                                aria-label="Close trailer"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}

            {/* Scroll Indicator */}
            <motion.div
                className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
                    <motion.div
                        className="w-1.5 h-2 bg-background rounded-full"
                        animate={{ y: [0, 12, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                </div>
            </motion.div>
        </section>
    );
}

function Stat({ number, label }: { number: number; label: string }) {
    const [count, setCount] = useState(0)

    useEffect(() => {
        let start = 0
        const duration = 900
        const stepTime = Math.max(Math.floor(duration / number), 20)
        const timer = setInterval(() => {
            start += Math.max(1, Math.floor(number / (duration / stepTime)))
            if (start >= number) {
                start = number
                clearInterval(timer)
            }
            setCount(start)
        }, stepTime)

        return () => clearInterval(timer)
    }, [number])

    return (
        <div className="text-center">
            <div className="text-2xl font-extrabold text-white">{count.toLocaleString()}</div>
            <div className="text-sm text-gray-400">{label}</div>
        </div>
    )
}
