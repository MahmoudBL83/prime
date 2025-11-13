'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Play, Info, Star, Clock, Users, Volume2, VolumeX, Sun, Moon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { NetflixCourseShowcase } from '@/components/landing/NetflixCourseShowcase';
import { useTheme } from 'next-themes';
import { useNavigationLoading } from '@/hooks/useNavigationLoading';
import { useLocaleSafe } from '@/hooks/useTranslationsSafe';
import { useSession } from 'next-auth/react';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  instructor: string;
  rating: number;
  students: number;
  duration: string;
  category: string;
  level: string;
}

export default function CoursesPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { navigateWithLoading, isLoading } = useNavigationLoading();
  const locale = useLocaleSafe();
  const { data: session } = useSession();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [featuredCourse, setFeaturedCourse] = useState<Course | null>(null);
  const [courseInteractions, setCourseInteractions] = useState<Record<string, {liked: boolean, inMyList: boolean}>>({});
  const [isMuted, setIsMuted] = useState(true);
  const [loading, setLoading] = useState(false); // Changed to false for instant display
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? theme === 'dark' : true;

  // Memoize theme toggle handler
  const toggleTheme = useCallback(() => {
    if (mounted) {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }
  }, [mounted, theme, setTheme]);

  // Memoize course click handler
  const handleCourseClick = useCallback((courseId: string) => {
    navigateWithLoading(`/${locale}/courses/${courseId}`, 'course-navigation');
  }, [navigateWithLoading, locale]);

  // Batch fetch course interactions
  const fetchCourseInteractions = useCallback(async (courseIds: string[]) => {
    if (courseIds.length === 0 || !session?.user?.email) return;
    
    try {
      const response = await fetch('/api/courses/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseIds })
      });
      
      if (response.ok) {
        const data = await response.json();
        setCourseInteractions(data);
      }
    } catch (error) {
      console.error('Error fetching course interactions:', error);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    fetchCourses();
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchCourses = async () => {
    try {
      // Fetch real courses from API for featured course
      const response = await fetch('/api/courses');
      const data = await response.json();
      
      // Get all real courses from database to display in showcases
      let allCourses: Course[] = [];
      
      if (data.courses && data.courses.length > 0) {
        // Map database courses to match our interface
        allCourses = data.courses.map((course: any) => ({
          id: course.id,
          title: course.title || course.titleAr || 'Untitled Course',
          description: course.description || course.descriptionAr || 'No description available',
          thumbnail: course.thumbnail || course.thumbnailUrl || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400',
          instructor: course.creator?.user?.name || course.creator?.user?.arabicName || 'Instructor',
          rating: course.rating || 4.5,
          students: course.totalEnrollments || 0,
          duration: course.duration || '8 weeks',
          category: 'technology', // Default category for display
          level: course.skillLevel?.toLowerCase() || 'beginner'
        }));
      }
      
      // If we have less than 20 courses, add mock courses to fill the page
      if (allCourses.length < 20) {
        const mockCourses: Course[] = [
          {
            id: 'cm2k3x8y10000z8pq1k2m3n4p',
            title: 'Complete Web Development Bootcamp',
            description: 'Master modern web development from scratch with HTML, CSS, JavaScript, React, Node.js and more',
            thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400',
            instructor: 'Sarah Johnson',
            rating: 4.8,
            students: 15420,
            duration: '12 weeks',
            category: 'technology',
            level: 'beginner'
          },
          {
            id: 'cm2k3x8y10001z8pq5r6s7t8u',
            title: 'Advanced React & TypeScript',
            description: 'Build scalable enterprise applications with React 18, TypeScript, Redux Toolkit and best practices',
            thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400',
            instructor: 'Mike Chen',
            rating: 4.9,
            students: 12350,
            duration: '10 weeks',
            category: 'technology',
            level: 'advanced'
          },
          {
            id: 'cm2k3x8y10002z8pq9v0w1x2y',
            title: 'Python for Data Science',
            description: 'Master Python programming for data analysis, visualization, and machine learning with pandas, numpy',
            thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400',
            instructor: 'James Lee',
            rating: 4.9,
            students: 14500,
            duration: '9 weeks',
            category: 'technology',
            level: 'intermediate'
          },
          {
            id: 'cm2k3x8y10003z8pq3z4a5b6c',
            title: 'Full Stack JavaScript Development',
            description: 'Learn MERN stack development with MongoDB, Express.js, React, and Node.js',
            thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400',
            instructor: 'Alex Kumar',
            rating: 4.7,
            students: 11200,
            duration: '14 weeks',
            category: 'technology',
            level: 'intermediate'
          },
          {
            id: 'cm2k3x8y10004z8pq7d8e9f0g',
            title: 'Mobile App Development with React Native',
            description: 'Build cross-platform mobile apps for iOS and Android using React Native',
            thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400',
            instructor: 'Jennifer Park',
            rating: 4.8,
            students: 9870,
            duration: '11 weeks',
            category: 'technology',
            level: 'intermediate'
          },
          {
            id: 'cm2k3x8y10005z8pq1h2i3j4k',
            title: 'Cloud Computing with AWS',
            description: 'Master Amazon Web Services, deploy scalable applications, and get AWS certified',
            thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400',
            instructor: 'David Zhang',
            rating: 4.6,
            students: 8900,
            duration: '8 weeks',
            category: 'technology',
            level: 'advanced'
          },
          {
            id: 'cm2k3x8y10006z8pq5l6m7n8o',
            title: 'Business Strategy Masterclass',
            description: 'Learn strategic business planning, competitive analysis, and growth strategies from industry experts',
            thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400',
            instructor: 'David Miller',
            rating: 4.7,
            students: 9876,
            duration: '6 weeks',
            category: 'business',
            level: 'intermediate'
          },
          {
            id: 'cm2k3x8y10007z8pq9p0q1r2s',
            title: 'Financial Management & Analysis',
            description: 'Master corporate finance, financial statements, budgeting, and investment analysis',
            thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400',
            instructor: 'Robert Taylor',
            rating: 4.7,
            students: 7890,
            duration: '8 weeks',
            category: 'business',
            level: 'advanced'
          },
          {
            id: 'cm2k3x8y10008z8pq3t4u5v6w',
            title: 'Entrepreneurship & Startup Fundamentals',
            description: 'Launch your startup with business planning, funding strategies, and growth tactics',
            thumbnail: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400',
            instructor: 'Maria Rodriguez',
            rating: 4.8,
            students: 13450,
            duration: '7 weeks',
            category: 'business',
            level: 'beginner'
          },
          {
            id: 'cm2k3x8y10009z8pq7x8y9z0a',
            title: 'Project Management Professional',
            description: 'Master project management methodologies, Agile, Scrum, and prepare for PMP certification',
            thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400',
            instructor: 'Thomas Anderson',
            rating: 4.6,
            students: 10200,
            duration: '9 weeks',
            category: 'business',
            level: 'intermediate'
          },
          {
            id: 'cm2k3x8y10010z8pq1b2c3d4e',
            title: 'Leadership & Management Skills',
            description: 'Develop essential leadership skills, team management, and organizational behavior',
            thumbnail: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400',
            instructor: 'Patricia Wong',
            rating: 4.9,
            students: 11890,
            duration: '6 weeks',
            category: 'business',
            level: 'beginner'
          },
          {
            id: 'cm2k3x8y10011z8pq5f6g7h8i',
            title: 'UI/UX Design Fundamentals',
            description: 'Create beautiful user experiences with design thinking, wireframing, prototyping and user testing',
            thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400',
            instructor: 'Emma Wilson',
            rating: 4.8,
            students: 8765,
            duration: '7 weeks',
            category: 'design',
            level: 'beginner'
          },
          {
            id: 'cm2k3x8y10012z8pq9j0k1l2m',
            title: 'Graphic Design Masterclass',
            description: 'Master Adobe Creative Suite: Photoshop, Illustrator, InDesign for professional design',
            thumbnail: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400',
            instructor: 'Sophie Martinez',
            rating: 4.7,
            students: 12340,
            duration: '10 weeks',
            category: 'design',
            level: 'intermediate'
          },
          {
            id: 'cm2k3x8y10013z8pq3n4o5p6q',
            title: 'Motion Graphics & Animation',
            description: 'Create stunning animations with After Effects, Premiere Pro, and motion design principles',
            thumbnail: 'https://images.unsplash.com/photo-1626785774625-ddcddc3445e9?w=400',
            instructor: 'Lucas Brown',
            rating: 4.6,
            students: 7650,
            duration: '8 weeks',
            category: 'design',
            level: 'intermediate'
          },
          {
            id: 'cm2k3x8y10014z8pq7r8s9t0u',
            title: '3D Design with Blender',
            description: 'Master 3D modeling, texturing, lighting, and rendering with Blender',
            thumbnail: 'https://images.unsplash.com/photo-1633409361554-e97b0219fbc8?w=400',
            instructor: 'Nina Petrov',
            rating: 4.8,
            students: 9200,
            duration: '12 weeks',
            category: 'design',
            level: 'advanced'
          },
          {
            id: 'cm2k3x8y10015z8pq1v2w3x4y',
            title: 'Web Design & Figma',
            description: 'Design modern websites and mobile apps using Figma, design systems, and prototyping',
            thumbnail: 'https://images.unsplash.com/photo-1609921212029-bb5a28e60960?w=400',
            instructor: 'Hannah Lee',
            rating: 4.9,
            students: 10890,
            duration: '6 weeks',
            category: 'design',
            level: 'beginner'
          },
          {
            id: 'cm2k3x8y10016z8pq5z6a7b8c',
            title: 'Digital Marketing Complete Guide',
            description: 'Master digital marketing strategies including SEO, social media, email marketing and analytics',
            thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
            instructor: 'Lisa Anderson',
            rating: 4.6,
            students: 11234,
            duration: '10 weeks',
            category: 'marketing',
            level: 'beginner'
          },
          {
            id: 'cm2k3x8y10017z8pq9d0e1f2g',
            title: 'SEO & Content Marketing',
            description: 'Boost your online presence with search engine optimization and content strategy',
            thumbnail: 'https://images.unsplash.com/photo-1432888622747-4eb9a8f2c293?w=400',
            instructor: 'Anna Martinez',
            rating: 4.6,
            students: 10234,
            duration: '6 weeks',
            category: 'marketing',
            level: 'intermediate'
          },
          {
            id: 'cm2k3x8y10018z8pq3h4i5j6k',
            title: 'Social Media Marketing Mastery',
            description: 'Grow your brand on Facebook, Instagram, Twitter, TikTok, and LinkedIn',
            thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400',
            instructor: 'Chris Evans',
            rating: 4.7,
            students: 14560,
            duration: '7 weeks',
            category: 'marketing',
            level: 'beginner'
          },
          {
            id: 'cm2k3x8y10019z8pq7l8m9n0o',
            title: 'Email Marketing & Automation',
            description: 'Build email campaigns, automate workflows, and increase conversions',
            thumbnail: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400',
            instructor: 'Rachel Green',
            rating: 4.5,
            students: 8900,
            duration: '5 weeks',
            category: 'marketing',
            level: 'intermediate'
          },
          {
            id: 'cm2k3x8y10020z8pq1p2q3r4s',
            title: 'Growth Hacking & Analytics',
            description: 'Learn data-driven marketing, A/B testing, conversion optimization, and growth strategies',
            thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
            instructor: 'Kevin Patel',
            rating: 4.8,
            students: 9750,
            duration: '8 weeks',
            category: 'marketing',
            level: 'advanced'
          },
        ];
        
        // Combine real courses with mock courses
        allCourses = [...allCourses, ...mockCourses];
      }
      
      // Use all courses for showcase
      setCourses(allCourses);
      
      // Batch fetch course interactions for better performance (only if authenticated)
      if (allCourses.length > 0 && session?.user?.email) {
        const courseIds = allCourses.map(course => course.id);
        await fetchCourseInteractions(courseIds);
      }
      
      // Use real course from database as featured (if available)
      if (data.courses && data.courses.length > 0) {
        const featured = data.courses.find((c: Course) => c.rating >= 4.8) || data.courses[0];
        setFeaturedCourse(featured);
      } else {
        // Fallback to first course in allCourses
        setFeaturedCourse(allCourses[0]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching courses:', error);
      // Use mock courses even on error
      const mockCourses: Course[] = [
        {
          id: 'cm2k3x8y10000z8pq1k2m3n4p',
          title: 'Complete Web Development Bootcamp',
          description: 'Master modern web development from scratch',
          thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400',
          instructor: 'Sarah Johnson',
          rating: 4.8,
          students: 15420,
          duration: '12 weeks',
          category: 'technology',
          level: 'beginner'
        },
      ];
      setCourses(mockCourses);
      setFeaturedCourse(mockCourses[0]);
      
      // Fetch interactions for mock courses if user is authenticated
      if (session?.user?.email) {
        await fetchCourseInteractions([mockCourses[0].id]);
      }
      
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'} overflow-x-hidden`}>
      {/* Custom Navbar - Shahid Style */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? (isDark ? 'bg-[#181d25]' : 'bg-white/95 backdrop-blur-lg shadow-md')
          : (isDark ? 'bg-gradient-to-b from-[#181d25] to-transparent' : 'bg-gradient-to-b from-white/80 to-transparent')
      }`}>
        <div className="max-w-[1920px] mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-[72px]">
            {/* Logo */}
            <div className="flex items-center gap-8">
              {/* PRIME Logo */}
              <button 
                onClick={() => navigateWithLoading(`/${locale}`, 'nav-home')}
                disabled={isLoading('nav-home')}
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50"
              >
                <svg width="85" height="32" viewBox="0 0 85 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <text x="0" y="24" fill={isDark ? "#00d9c0" : "#00d9c0"} fontFamily="Arial, sans-serif" fontSize="28" fontWeight="bold">
                    PRIME
                  </text>
                </svg>
                {isLoading('nav-home') && (
                  <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin ml-1"></div>
                )}
              </button>

              {/* Navigation Links */}
              <div className="hidden lg:flex items-center gap-8">
                <button 
                  onClick={() => navigateWithLoading(`/${locale}`, 'nav-home')}
                  disabled={isLoading('nav-home')}
                  className={`${isDark ? 'text-white/90 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors text-[15px] font-medium flex items-center gap-1 disabled:opacity-50`}
                >
                  {isLoading('nav-home') && (
                    <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mr-1"></div>
                  )}
                  Home
                </button>
                <a href="#" className={`${isDark ? 'text-white' : 'text-gray-900'} transition-colors text-[15px] font-semibold flex items-center gap-1`}>
                  <span>Courses</span>
                </a>
                <a href="#" className={`${isDark ? 'text-white/90 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors text-[15px] font-medium`}>
                  New & Top 🔥
                </a>
                <a href="#" className={`${isDark ? 'text-white/90 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors text-[15px] font-medium`}>
                  TV Shows
                </a>
                <a href="#" className={`${isDark ? 'text-white/90 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors text-[15px] font-medium`}>
                  Movies
                </a>
                <a href="#" className={`${isDark ? 'text-white/90 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors text-[15px] font-medium`}>
                  Sports
                </a>
                <a href="#" className={`${isDark ? 'text-white/90 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors text-[15px] font-medium`}>
                  Explore
                </a>
                <a href="#" className={`${isDark ? 'text-white/90 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors text-[15px] font-medium`}>
                  Live TV
                </a>
                <a href="#" className={`${isDark ? 'text-white/90 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors text-[15px] font-medium`}>
                  My List
                </a>
                <a href="#" className={`${isDark ? 'text-white/90 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors text-[15px] font-medium flex items-center gap-1`}>
                  <span className={`${isDark ? 'bg-[#00d9c0] text-black' : 'bg-[#00d9c0] text-black'} px-2 py-0.5 rounded text-xs font-bold`}>kids</span>
                  <span>Kids</span>
                </a>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              <button className={`p-2 ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} rounded-lg transition-colors`}>
                <Search className="w-5 h-5" />
              </button>
              
              {/* Theme Toggle Button */}
              {mounted && (
                <button 
                  onClick={toggleTheme}
                  className={`p-2 ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} rounded-lg transition-all duration-300`}
                  aria-label="Toggle theme"
                >
                  {isDark ? (
                    <Sun className="w-5 h-5 text-yellow-400 transition-transform hover:rotate-180 duration-500" />
                  ) : (
                    <Moon className="w-5 h-5 text-[#00d9c0] transition-transform hover:-rotate-12 duration-500" />
                  )}
                </button>
              )}
              
              <button className={`${isDark ? 'text-white/90 hover:text-white' : 'text-gray-700 hover:text-gray-900'} text-[15px] font-medium hidden lg:block`}>
                My Account
              </button>
              <div className={`w-9 h-9 rounded-full ${isDark ? 'bg-gradient-to-br from-[#00d9c0] to-[#00b4a0] ring-white/20' : 'bg-gradient-to-br from-[#00d9c0] to-[#00b4a0] ring-[#00d9c0]/20'} flex items-center justify-center ring-2`}>
                <span className="text-white text-sm font-semibold">U</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Video Background */}
      <div className="relative h-[85vh] overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0">
          <video
            ref={videoRef}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/videos/demo/course-promo.mp4" type="video/mp4" />
          </video>
          
          {/* Gradient Overlays */}
          <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-r from-black via-black/70 to-transparent' : 'bg-gradient-to-r from-white via-white/70 to-transparent'}`} />
          <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-t from-black via-transparent to-black/50' : 'bg-gradient-to-t from-white via-transparent to-white/50'}`} />
        </div>

        {/* Hero Content */}
        <div className="relative h-full flex items-start justify-start pt-[120px]">
          <div className="max-w-[1920px] mx-auto px-6 lg:px-12 w-full">
            <div className="max-w-xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-4"
              >
                {featuredCourse ? (
                  <>
                    {/* ORIGINALS Badge */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 ${isDark ? 'bg-[#00d9c0]' : 'bg-[#00d9c0]'} rounded-full`}></div>
                        <div className={`w-2 h-2 ${isDark ? 'bg-[#00d9c0]' : 'bg-[#00d9c0]'} rounded-full`}></div>
                        <div className={`w-2 h-2 ${isDark ? 'bg-[#00d9c0]' : 'bg-[#00d9c0]'} rounded-full`}></div>
                      </div>
                      <span className={`${isDark ? 'text-white' : 'text-gray-900'} text-sm font-bold tracking-wider`}>FEATURED COURSE</span>
                    </div>

                    {/* Course Title */}
                    <div className="mb-6">
                      <h1 className={`text-5xl md:text-6xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4 leading-tight`} style={{ textShadow: isDark ? '2px 2px 4px rgba(0,0,0,0.5)' : '2px 2px 4px rgba(255,255,255,0.5)' }}>
                        {featuredCourse.title}
                      </h1>
                    </div>

                    {/* Rating Badge */}
                    <div className={`inline-flex items-center gap-2 ${isDark ? 'bg-gradient-to-r from-[#00d9c0] to-[#00b4a0]' : 'bg-gradient-to-r from-[#00d9c0] to-[#00b4a0]'} px-3 py-1 rounded mb-4`}>
                      <Star className={`w-4 h-4 ${isDark ? 'text-black fill-black' : 'text-black fill-black'}`} />
                      <span className={`${isDark ? 'text-black' : 'text-black'} text-sm font-bold`}>{(featuredCourse.rating || 0).toFixed(1)} Rating</span>
                      {featuredCourse.students && (
                        <span className={`${isDark ? 'text-black' : 'text-white'} text-sm`}>• {featuredCourse.students.toLocaleString()} Students</span>
                      )}
                    </div>

                    {/* Description */}
                    <p className={`${isDark ? 'text-gray-200' : 'text-gray-700'} text-lg mb-6 max-w-2xl leading-relaxed`}>
                      {featuredCourse.description}
                    </p>

                    {/* Watch Now Button */}
                    <div className="pt-4">
                      <button 
                        onClick={() => handleCourseClick(featuredCourse.id)}
                        disabled={isLoading('course-navigation')}
                        className={`group flex items-center gap-4 ${isDark ? 'bg-white/10 hover:bg-white/20 border-white/20' : 'bg-black/10 hover:bg-black/20 border-black/20'} backdrop-blur-xl ${isDark ? 'text-white' : 'text-gray-900'} rounded-full transition-all duration-300 border hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                      >
                        <div className={`w-16 h-16 ${isDark ? 'bg-gradient-to-br from-[#00d9c0] to-[#00b4a0]' : 'bg-gradient-to-br from-[#00d9c0] to-[#00b4a0]'} rounded-full flex items-center justify-center flex-shrink-0 group-hover:shadow-lg transition-shadow duration-300`}>
                          {isLoading('course-navigation') ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Play className="w-7 h-7 ml-0.5 text-white group-hover:scale-110 transition-transform duration-300" fill="white" />
                          )}
                        </div>
                        <div className="text-left pr-6 pl-1">
                          <div className="text-xl font-bold group-hover:translate-x-1 transition-transform duration-300">
                            {isLoading('course-navigation') ? 'Loading...' : 'Start Learning'}
                          </div>
                          <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} group-hover:translate-x-1 transition-transform duration-300`}>
                            {isLoading('course-navigation') ? 'Please wait' : 'Begin Course Now'}
                          </div>
                        </div>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <div className={`inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${isDark ? 'border-[#00d9c0]' : 'border-[#00d9c0]'}`}></div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Mute/Unmute Button */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`absolute bottom-8 right-8 w-12 h-12 ${isDark ? 'bg-black/60 hover:bg-black/80 border-white/20' : 'bg-white/60 hover:bg-white/80 border-gray-300'} backdrop-blur-sm rounded-full flex items-center justify-center border transition-all`}
        >
          {isMuted ? (
            <VolumeX className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-900'}`} />
          ) : (
            <Volume2 className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-900'}`} />
          )}
        </button>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className={`w-6 h-10 border-2 ${isDark ? 'border-white/30' : 'border-gray-400/50'} rounded-full flex items-start justify-center p-2`}
          >
            <div className={`w-1 h-2 ${isDark ? 'bg-white/50' : 'bg-gray-600/50'} rounded-full`} />
          </motion.div>
        </div>
      </div>

      {/* Course Rows - Netflix/Shahid Style */}
      <div className="relative -mt-32 z-10 pb-20">
        {loading ? (
          <div className="text-center py-20">
            <div className={`inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${isDark ? 'border-[#00ca98]' : 'border-[#00d9c0]'}`}></div>
          </div>
        ) : (
          <>
            {/* Technology Courses */}
            {courses.filter(c => c.category === 'technology').length > 0 && (
              <NetflixCourseShowcase
                title="Technology Courses"
                courses={courses.filter(c => c.category === 'technology') as any}
                lang="en"
                onCourseClick={handleCourseClick}
                courseInteractions={courseInteractions}
              />
            )}

            {/* Business Courses */}
            {courses.filter(c => c.category === 'business').length > 0 && (
              <NetflixCourseShowcase
                title="Business & Management"
                courses={courses.filter(c => c.category === 'business') as any}
                lang="en"
                onCourseClick={handleCourseClick}
                courseInteractions={courseInteractions}
              />
            )}

            {/* Design Courses */}
            {courses.filter(c => c.category === 'design').length > 0 && (
              <NetflixCourseShowcase
                title="Design & Creativity"
                courses={courses.filter(c => c.category === 'design') as any}
                lang="en"
                onCourseClick={handleCourseClick}
                courseInteractions={courseInteractions}
              />
            )}

            {/* Marketing Courses */}
            {courses.filter(c => c.category === 'marketing').length > 0 && (
              <NetflixCourseShowcase
                title="Marketing & Growth"
                courses={courses.filter(c => c.category === 'marketing') as any}
                lang="en"
                onCourseClick={handleCourseClick}
                courseInteractions={courseInteractions}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
