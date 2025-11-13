'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Users, BookOpen, Star, TrendingUp, Sparkles, Play, Award } from 'lucide-react';
import { useNavigationLoading } from '@/hooks/useNavigationLoading';
import { LoadingButton } from '@/components/ui/LoadingButton';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import Image from 'next/image';

interface Mentor {
    id: string;
    name: string;
    bio: string;
    avatar: string;
    courseCount: number;
    isVerified: boolean;
    expertise: string[];
    rating: number;
    studentsCount: number;
    totalReviews: number;
}

function MentorCard({ mentor, index, locale, isLoading, onNavigate }: {
    mentor: Mentor;
    index: number;
    locale: string;
    isLoading: (key: string) => boolean;
    onNavigate: (key: string, path: string) => void;
}) {
    const t = useTranslations('landing');

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            whileHover={{ scale: 1.08, zIndex: 10 }}
            className="group relative"
        >
            <div className="relative overflow-hidden rounded-2xl transition-all duration-500 cursor-pointer hover:shadow-2xl hover:shadow-purple-500/40">
                {/* Poster-style mentor card */}
                <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900">
                    {/* Background avatar as poster */}
                    <div className="absolute inset-0">
                        <img
                            src={mentor.avatar || `/images/instructors/default-avatar.jpg`}
                            alt={mentor.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                    </div>
                    
                    {/* Gradient overlays for text visibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20 opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
                    
                    {/* Verified badge - top right */}
                    {mentor.isVerified && (
                        <div className="absolute top-4 right-4 z-20">
                            <div className="bg-green-500/90 backdrop-blur-sm rounded-full p-2 shadow-lg ring-2 ring-green-400/30">
                                <CheckCircle className="w-5 h-5 text-foreground" />
                            </div>
                        </div>
                    )}
                    
                    {/* Rating badge - top left */}
                    <div className="absolute top-4 left-4 z-20">
                        <div className="bg-yellow-500/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5">
                            <Star className="w-4 h-4 text-foreground fill-current" />
                            <span className="text-foreground font-bold text-sm">{mentor.rating.toFixed(1)}</span>
                        </div>
                    </div>
                    
                    {/* Hover overlay with play icon */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                        <div className="w-20 h-20 bg-white/25 backdrop-blur-md rounded-full flex items-center justify-center border-3 border-white/50 shadow-2xl">
                            <Play className="w-10 h-10 text-foreground ml-1" fill="white" />
                        </div>
                    </div>
                    
                    {/* Bottom content section */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                        {/* Name and title */}
                        <h3 className="font-bold text-foreground text-lg mb-2 line-clamp-1 leading-tight">
                            {mentor.name}
                        </h3>
                        
                        {/* Expertise tags */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            {mentor.expertise.slice(0, 2).map((skill) => (
                                <Badge 
                                    key={skill}
                                    className="bg-purple-500/80 backdrop-blur-sm text-foreground text-xs font-semibold border-0 px-2 py-0.5 shadow-lg"
                                >
                                    {skill}
                                </Badge>
                            ))}
                            {mentor.expertise.length > 2 && (
                                <Badge className="bg-blue-500/80 backdrop-blur-sm text-foreground text-xs font-semibold border-0 px-2 py-0.5 shadow-lg">
                                    +{mentor.expertise.length - 2}
                                </Badge>
                            )}
                        </div>
                        
                        {/* Stats row - always visible */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className="text-center bg-background/40 backdrop-blur-sm rounded-lg py-2">
                                <div className="flex items-center justify-center space-x-1 mb-0.5">
                                    <BookOpen className="w-3 h-3 text-purple-400" />
                                    <span className="text-sm font-bold text-foreground">{mentor.courseCount}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Courses</p>
                            </div>
                            <div className="text-center bg-background/40 backdrop-blur-sm rounded-lg py-2">
                                <div className="flex items-center justify-center space-x-1 mb-0.5">
                                    <Users className="w-3 h-3 text-blue-400" />
                                    <span className="text-sm font-bold text-foreground">{(mentor.studentsCount / 1000).toFixed(1)}K</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Students</p>
                            </div>
                            <div className="text-center bg-background/40 backdrop-blur-sm rounded-lg py-2">
                                <div className="flex items-center justify-center space-x-1 mb-0.5">
                                    <Award className="w-3 h-3 text-yellow-400" />
                                    <span className="text-sm font-bold text-foreground">{mentor.totalReviews}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Reviews</p>
                            </div>
                        </div>
                        
                        {/* Hover details - Action buttons */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 space-y-2">
                            <LoadingButton
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onNavigate(`mentor-${mentor.id}`, `/${locale}/mentors/${mentor.id}`);
                                }}
                                loading={isLoading(`mentor-${mentor.id}`)}
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-foreground rounded-lg py-2.5 text-sm font-bold transition-all duration-300 hover:scale-105 shadow-lg shadow-purple-500/30 border-0"
                            >
                                {isLoading(`mentor-${mentor.id}`) ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-1.5 inline" />
                                        Subscribe
                                    </>
                                )}
                            </LoadingButton>
                            <LoadingButton
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onNavigate(`mentor-message-${mentor.id}`, `/${locale}/messaging?userId=${mentor.id}`);
                                }}
                                loading={isLoading(`mentor-message-${mentor.id}`)}
                                className="w-full bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/30 hover:border-white/50 text-foreground rounded-lg py-2.5 text-sm font-semibold transition-all duration-300"
                            >
                                {isLoading(`mentor-message-${mentor.id}`) ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Award className="w-4 h-4 mr-1.5 inline" />
                                        Message
                                    </>
                                )}
                            </LoadingButton>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export function MentorSpotlight() {
    const t = useTranslations('landing');
    const locale = useLocale();
    const router = useRouter();
    const { isLoading, navigateWithLoading } = useNavigationLoading();
    const [mentors, setMentors] = useState<Mentor[]>([]);
    const [isLoadingMentors, setIsLoadingMentors] = useState(true);

    const handleNavigation = (key: string, path: string) => {
        navigateWithLoading(path, key);
    };

    useEffect(() => {
        // Fetch real mentors data from API
        const fetchMentors = async () => {
            try {
                const response = await fetch('/api/instructors');
                if (response.ok) {
                    const data = await response.json();
                    // Transform API data to match our Mentor interface
                    const transformedMentors: Mentor[] = data.instructors.slice(0, 4).map((instructor: any) => ({
                        id: instructor.id,
                        name: instructor.user.name,
                        bio: instructor.user.bio || 'Expert educator and mentor',
                        avatar: instructor.user.profileImage || '/images/instructors/default-avatar.jpg',
                        courseCount: instructor.stats.totalCourses,
                        isVerified: instructor.kycStatus === 'APPROVED' || instructor.kycStatus === 'VERIFIED',
                        expertise: instructor.expertise ? instructor.expertise.split(',').map((e: string) => e.trim()).slice(0, 4) : ['Education', 'Mentoring'],
                        rating: instructor.stats.averageRating,
                        studentsCount: instructor.stats.totalStudents,
                        totalReviews: Math.floor(instructor.stats.totalStudents * 0.2) // Estimate reviews as 20% of students
                    }));
                    setMentors(transformedMentors);
                } else {
                    console.error('Failed to fetch mentors');
                }
            } catch (error) {
                console.error('Error fetching mentors:', error);
            } finally {
                setIsLoadingMentors(false);
            }
        };

        fetchMentors();
    }, []);

    if (isLoadingMentors) {
        return (
            <section className="relative py-20 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
                {/* Background effects */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-20 right-1/4 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-300" />
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-12">
                        <div className="w-64 h-8 bg-gray-700/50 rounded-lg mx-auto mb-4 animate-pulse" />
                        <div className="w-96 h-6 bg-gray-700/30 rounded-lg mx-auto animate-pulse" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((index) => (
                            <div key={index} className="bg-gray-800/50 rounded-2xl p-6 animate-pulse">
                                <div className="flex items-center space-x-4 mb-4">
                                    <div className="w-16 h-16 bg-gray-700 rounded-full" />
                                    <div className="flex-1">
                                        <div className="w-24 h-4 bg-gray-700 rounded mb-2" />
                                        <div className="w-16 h-3 bg-gray-700 rounded" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="w-full h-3 bg-gray-700 rounded" />
                                    <div className="w-3/4 h-3 bg-gray-700 rounded" />
                                </div>
                                <div className="flex space-x-2 mt-4">
                                    <div className="w-16 h-6 bg-gray-700 rounded" />
                                    <div className="w-12 h-6 bg-gray-700 rounded" />
                                </div>
                                <div className="grid grid-cols-3 gap-3 mt-4">
                                    <div className="w-12 h-8 bg-gray-700 rounded" />
                                    <div className="w-12 h-8 bg-gray-700 rounded" />
                                    <div className="w-12 h-8 bg-gray-700 rounded" />
                                </div>
                                <div className="w-full h-8 bg-gray-700 rounded mt-4" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="relative py-24 overflow-hidden"
        >
            {/* Enhanced multi-layer background */}
            <div className="absolute inset-0">
                {/* Base gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900 to-black"></div>
                
                {/* Animated gradient orbs */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                    <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-20 right-1/4 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-pink-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
                </div>
                
                {/* Grid pattern overlay */}
                <div className="absolute inset-0 opacity-[0.03]" 
                    style={{
                        backgroundImage: `
                            linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)
                        `,
                        backgroundSize: '50px 50px'
                    }}
                ></div>
                
                {/* Radial gradient spotlight */}
                <div className="absolute inset-0 bg-gradient-radial from-transparent via-purple-900/5 to-black/50"></div>
                
                {/* Noise texture for depth */}
                <div className="absolute inset-0 opacity-[0.015]" 
                    style={{
                        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")'
                    }}
                ></div>
                
                {/* Subtle vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40"></div>
            </div>

            <div className="container mx-auto px-4 relative z-10">
                {/* Enhanced header */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm border border-purple-500/20 rounded-full px-6 py-2 mb-6">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-medium text-purple-300">Expert Mentors</span>
                    </div>
                    
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                        <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                            Learn from the
                        </span>
                        <br />
                        <span className="bg-gradient-to-r from-purple-400 via-purple-300 to-blue-400 bg-clip-text text-transparent">
                            Best Mentors
                        </span>
                    </h2>
                    
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                        Connect with world-class Egyptian studies experts who bring ancient wisdom to modern learning.
                        Get personalized guidance from verified professionals with proven track records.
                    </p>
                </motion.div>

                {/* Mentors grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {mentors.map((mentor, index) => (
                        <MentorCard
                            key={mentor.id}
                            mentor={mentor}
                            index={index}
                            locale={locale}
                            isLoading={isLoading}
                            onNavigate={handleNavigation}
                        />
                    ))}
                </div>

                {/* View all mentors button */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="text-center"
                >
                    <LoadingButton
                        onClick={() => navigateWithLoading(`/${locale}/mentors`, 'view-all-mentors')}
                        loading={isLoading('view-all-mentors')}
                        variant="outline"
                        className="text-purple-300 border-purple-500/50 hover:bg-purple-500/10 hover:border-purple-400 rounded-xl px-8 py-3 text-lg font-semibold transition-all duration-300 hover:scale-105"
                    >
                        {isLoading('view-all-mentors') ? (
                            <div className="w-5 h-5 border-2 border-purple-300/30 border-t-purple-300 rounded-full animate-spin mr-2"></div>
                        ) : (
                            <TrendingUp className="w-5 h-5 mr-2" />
                        )}
                        {t('viewAllMentors')}
                    </LoadingButton>
                </motion.div>
            </div>
        </motion.section>
    );
}
