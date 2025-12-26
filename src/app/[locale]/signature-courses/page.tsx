'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy, memo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

// Icon Components with lazy loading
const IconComponents = {
  Search: lazy(() => import('lucide-react').then(mod => ({ default: mod.Search }))),
  Play: lazy(() => import('lucide-react').then(mod => ({ default: mod.Play }))),
  Info: lazy(() => import('lucide-react').then(mod => ({ default: mod.Info }))),
  Plus: lazy(() => import('lucide-react').then(mod => ({ default: mod.Plus }))),
  Check: lazy(() => import('lucide-react').then(mod => ({ default: mod.Check }))),
  ChevronRight: lazy(() => import('lucide-react').then(mod => ({ default: mod.ChevronRight }))),
  ChevronLeft: lazy(() => import('lucide-react').then(mod => ({ default: mod.ChevronLeft }))),
  Crown: lazy(() => import('lucide-react').then(mod => ({ default: mod.Crown }))),
  Clock: lazy(() => import('lucide-react').then(mod => ({ default: mod.Clock }))),
  Loader2: lazy(() => import('lucide-react').then(mod => ({ default: mod.Loader2 })))
}

// Dynamic Icon Component
const DynamicIcon = memo(({ name, className, ...props }: { name: keyof typeof IconComponents; className?: string;[key: string]: any }) => {
  const IconComponent = IconComponents[name]

  return (
    <Suspense fallback={<div className={`w-5 h-5 bg-gray-600 rounded ${className || ''}`} />}>
      <IconComponent className={className} {...props} />
    </Suspense>
  )
});

// Lazy load heavy components
const CourseDetailModal = lazy(() => import('@/components/signature-courses/CourseDetailModal'));

// Lightweight button component to avoid heavy UI imports
const SimpleButton = memo(({
  onClick,
  children,
  className = "",
  disabled = false,
  ...props
}: {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  [key: string]: any;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 ${className}`}
    {...props}
  >
    {children}
  </button>
));

// Lightweight badge component
const SimpleBadge = memo(({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${className}`}>
    {children}
  </span>
));

// Simple input component
const SimpleInput = memo(({ className = "", ...props }: { className?: string;[key: string]: any }) => (
  <input
    className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
));

interface SignatureCourse {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  instructor: {
    name: string;
    profileImage?: string;
  };
  duration: string;
  enrollmentCount: number;
  rating: number;
  ratingCount: number;
  price: number;
  level: string;
  category: string;
  hasWorkbook: boolean;
  hasCohort: boolean;
  hasExpertQA: boolean;
  hasCapstone: boolean;
  trending?: boolean;
  new?: boolean;
  featured?: boolean;
}

export default function SignatureCoursesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const lang = locale === 'de' ? 'de' : 'en';
  const isRTL = false;

  // Simplified navigation without heavy hooks
  const navigateWithOptimization = useCallback((path: string) => {
    router.push(path);
  }, [router]);

  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<SignatureCourse[]>([]);
  const [hoveredCourse, setHoveredCourse] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<SignatureCourse | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [myList, setMyList] = useState<string[]>([]);
  const [showCategoryNav, setShowCategoryNav] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isNavigating, setIsNavigating] = useState<{ [key: string]: boolean }>({});

  // Cache keys for localStorage
  const CACHE_KEYS = {
    COURSES: 'signature_courses_cache',
    MY_LIST: 'my_list_cache',
    TIMESTAMP: 'signature_courses_timestamp'
  };

  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000;

  // Helper function to get random Netflix image for a course
  const getNetflixImage = (courseId: string) => {
    // Use course ID to generate a consistent but random-looking image number
    const hash = courseId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return `/images/courses/netflix${(hash % 6) + 1}.jpg`;
  };

  // Memoize mock courses to avoid recreation on every render
  const mockCourses = useMemo<SignatureCourse[]>(() => [
    {
      id: 'course-1',
      title: 'Full-Stack Web Development Masterclass',
      description: 'Learn to build modern web applications from scratch using React, Node.js, and MongoDB. Master the complete stack and deploy production-ready applications.',
      thumbnail: '/images/courses/netflix1.jpg',
      instructor: { name: 'Sarah Johnson', profileImage: '/images/avatars/sarah.jpg' },
      duration: '42h',
      enrollmentCount: 12450,
      rating: 4.8,
      ratingCount: 3200,
      price: 299,
      level: 'Intermediate',
      category: 'Technology',
      hasWorkbook: true,
      hasCohort: true,
      hasExpertQA: true,
      hasCapstone: true,
    },
    {
      id: 'course-2',
      title: 'Digital Marketing Strategy 2025',
      description: 'Master modern digital marketing strategies including SEO, social media marketing, email campaigns, and analytics to grow your business.',
      thumbnail: '/images/courses/netflix2.jpg',
      instructor: { name: 'Ahmed Hassan', profileImage: '/images/avatars/ahmed.jpg' },
      duration: '28h',
      enrollmentCount: 8900,
      rating: 4.6,
      ratingCount: 2100,
      price: 249,
      level: 'Beginner',
      category: 'Marketing',
      hasWorkbook: true,
      hasCohort: false,
      hasExpertQA: true,
      hasCapstone: false,
    },
    {
      id: 'course-3',
      title: 'UI/UX Design Fundamentals',
      description: 'Create stunning user interfaces and amazing user experiences. Learn Figma, Adobe XD, and design thinking principles.',
      thumbnail: '/images/courses/netflix3.jpg',
      instructor: { name: 'Maria Garcia', profileImage: '/images/avatars/maria.jpg' },
      duration: '35h',
      enrollmentCount: 15200,
      rating: 4.9,
      ratingCount: 4500,
      price: 279,
      level: 'Beginner',
      category: 'Design',
      hasWorkbook: true,
      hasCohort: true,
      hasExpertQA: true,
      hasCapstone: true,
    },
    {
      id: 'course-4',
      title: 'Data Science with Python',
      description: 'Dive deep into data analysis, machine learning, and AI using Python, pandas, scikit-learn, and TensorFlow.',
      thumbnail: '/images/courses/netflix4.jpg',
      instructor: { name: 'Dr. James Wilson', profileImage: '/images/avatars/james.jpg' },
      duration: '55h',
      enrollmentCount: 9800,
      rating: 4.7,
      ratingCount: 2800,
      price: 349,
      level: 'Advanced',
      category: 'Data Science',
      hasWorkbook: true,
      hasCohort: true,
      hasExpertQA: true,
      hasCapstone: true,
    },
    {
      id: 'course-5',
      title: 'Business Strategy & Leadership',
      description: 'Develop executive-level strategic thinking and leadership skills to drive organizational growth and innovation.',
      thumbnail: '/images/courses/netflix5.jpg',
      instructor: { name: 'Michael Chen', profileImage: '/images/avatars/michael.jpg' },
      duration: '32h',
      enrollmentCount: 6700,
      rating: 4.5,
      ratingCount: 1900,
      price: 399,
      level: 'Advanced',
      category: 'Business',
      hasWorkbook: true,
      hasCohort: false,
      hasExpertQA: true,
      hasCapstone: true,
    },
    {
      id: 'course-6',
      title: 'Mobile App Development with React Native',
      description: 'Build cross-platform mobile apps for iOS and Android using React Native and JavaScript.',
      thumbnail: '/images/courses/netflix6.jpg',
      instructor: { name: 'Emily Rodriguez', profileImage: '/images/avatars/emily.jpg' },
      duration: '38h',
      enrollmentCount: 11300,
      rating: 4.8,
      ratingCount: 3400,
      price: 289,
      level: 'Intermediate',
      category: 'Technology',
      hasWorkbook: true,
      hasCohort: true,
      hasExpertQA: true,
      hasCapstone: true,
    },
    {
      id: 'course-7',
      title: 'Social Media Marketing Mastery',
      description: 'Create viral content and grow massive audiences on Instagram, TikTok, YouTube, and LinkedIn.',
      thumbnail: '/images/courses/netflix1.jpg',
      instructor: { name: 'Alex Thompson', profileImage: '/images/avatars/alex.jpg' },
      duration: '24h',
      enrollmentCount: 14500,
      rating: 4.6,
      ratingCount: 3900,
      price: 199,
      level: 'Beginner',
      category: 'Marketing',
      hasWorkbook: false,
      hasCohort: false,
      hasExpertQA: true,
      hasCapstone: false,
    },
    {
      id: 'course-8',
      title: 'Advanced JavaScript & TypeScript',
      description: 'Master modern JavaScript ES6+, TypeScript, async programming, and advanced design patterns.',
      thumbnail: '/images/courses/netflix2.jpg',
      instructor: { name: 'David Kim', profileImage: '/images/avatars/david.jpg' },
      duration: '46h',
      enrollmentCount: 10200,
      rating: 4.9,
      ratingCount: 2900,
      price: 279,
      level: 'Advanced',
      category: 'Technology',
      hasWorkbook: true,
      hasCohort: true,
      hasExpertQA: true,
      hasCapstone: true,
    },
    {
      id: 'course-9',
      title: 'Graphic Design & Branding',
      description: 'Create professional logos, brand identities, and marketing materials using Adobe Creative Suite.',
      thumbnail: '/images/courses/netflix3.jpg',
      instructor: { name: 'Sophie Martin', profileImage: '/images/avatars/sophie.jpg' },
      duration: '30h',
      enrollmentCount: 8400,
      rating: 4.7,
      ratingCount: 2300,
      price: 259,
      level: 'Intermediate',
      category: 'Design',
      hasWorkbook: true,
      hasCohort: false,
      hasExpertQA: true,
      hasCapstone: true,
    },
    {
      id: 'course-10',
      title: 'Machine Learning A to Z',
      description: 'Complete guide to machine learning algorithms, neural networks, and deep learning with hands-on projects.',
      thumbnail: '/images/courses/netflix4.jpg',
      instructor: { name: 'Dr. Lisa Wong', profileImage: '/images/avatars/lisa.jpg' },
      duration: '62h',
      enrollmentCount: 7900,
      rating: 4.8,
      ratingCount: 2400,
      price: 399,
      level: 'Advanced',
      category: 'Data Science',
      hasWorkbook: true,
      hasCohort: true,
      hasExpertQA: true,
      hasCapstone: true,
    },
    {
      id: 'course-11',
      title: 'Financial Analysis & Investment',
      description: 'Learn financial modeling, stock analysis, portfolio management, and investment strategies.',
      thumbnail: '/images/courses/netflix5.jpg',
      instructor: { name: 'Robert Taylor', profileImage: '/images/avatars/robert.jpg' },
      duration: '40h',
      enrollmentCount: 5600,
      rating: 4.5,
      ratingCount: 1600,
      price: 329,
      level: 'Intermediate',
      category: 'Business',
      hasWorkbook: true,
      hasCohort: false,
      hasExpertQA: true,
      hasCapstone: true,
    },
    {
      id: 'course-12',
      title: 'Cloud Computing with AWS',
      description: 'Master Amazon Web Services, cloud architecture, serverless computing, and DevOps practices.',
      thumbnail: '/images/courses/netflix6.jpg',
      instructor: { name: 'Chris Anderson', profileImage: '/images/avatars/chris.jpg' },
      duration: '48h',
      enrollmentCount: 9100,
      rating: 4.7,
      ratingCount: 2700,
      price: 349,
      level: 'Advanced',
      category: 'Technology',
      hasWorkbook: true,
      hasCohort: true,
      hasExpertQA: true,
      hasCapstone: true,
    },
    {
      id: 'course-13',
      title: 'Content Marketing Excellence',
      description: 'Create compelling content that drives traffic, engagement, and conversions across all channels.',
      thumbnail: '/images/courses/netflix1.jpg',
      instructor: { name: 'Rachel Green', profileImage: '/images/avatars/rachel.jpg' },
      duration: '26h',
      enrollmentCount: 7200,
      rating: 4.6,
      ratingCount: 2000,
      price: 229,
      level: 'Beginner',
      category: 'Marketing',
      hasWorkbook: true,
      hasCohort: false,
      hasExpertQA: true,
      hasCapstone: false,
    },
    {
      id: 'course-14',
      title: 'Motion Graphics & Animation',
      description: 'Create stunning animations and motion graphics using After Effects, Cinema 4D, and Blender.',
      thumbnail: '/images/courses/netflix2.jpg',
      instructor: { name: 'Tom Holland', profileImage: '/images/avatars/tom.jpg' },
      duration: '44h',
      enrollmentCount: 6800,
      rating: 4.8,
      ratingCount: 1900,
      price: 299,
      level: 'Intermediate',
      category: 'Design',
      hasWorkbook: true,
      hasCohort: true,
      hasExpertQA: true,
      hasCapstone: true,
    },
    {
      id: 'course-15',
      title: 'Big Data Analytics',
      description: 'Process and analyze massive datasets using Hadoop, Spark, and modern big data technologies.',
      thumbnail: '/images/courses/netflix3.jpg',
      instructor: { name: 'Dr. Kevin Park', profileImage: '/images/avatars/kevin.jpg' },
      duration: '52h',
      enrollmentCount: 5400,
      rating: 4.7,
      ratingCount: 1500,
      price: 379,
      level: 'Advanced',
      category: 'Data Science',
      hasWorkbook: true,
      hasCohort: true,
      hasExpertQA: true,
      hasCapstone: true,
    },
    {
      id: 'course-16',
      title: 'Entrepreneurship & Startup Launch',
      description: 'Turn your idea into a successful startup with lean methodology, fundraising, and growth strategies.',
      thumbnail: '/images/courses/netflix4.jpg',
      instructor: { name: 'Mark Stevens', profileImage: '/images/avatars/mark.jpg' },
      duration: '36h',
      enrollmentCount: 8700,
      rating: 4.5,
      ratingCount: 2400,
      price: 299,
      level: 'Intermediate',
      category: 'Business',
      hasWorkbook: true,
      hasCohort: true,
      hasExpertQA: true,
      hasCapstone: true,
    },
    {
      id: 'course-17',
      title: 'Cybersecurity Fundamentals',
      description: 'Protect systems and networks from cyber threats with ethical hacking and security best practices.',
      thumbnail: '/images/courses/netflix5.jpg',
      instructor: { name: 'Anna White', profileImage: '/images/avatars/anna.jpg' },
      duration: '41h',
      enrollmentCount: 7600,
      rating: 4.8,
      ratingCount: 2200,
      price: 319,
      level: 'Intermediate',
      category: 'Technology',
      hasWorkbook: true,
      hasCohort: false,
      hasExpertQA: true,
      hasCapstone: true,
    },
    {
      id: 'course-18',
      title: 'Email Marketing Automation',
      description: 'Build automated email campaigns that nurture leads and drive sales using Mailchimp and HubSpot.',
      thumbnail: '/images/courses/netflix6.jpg',
      instructor: { name: 'Jessica Brown', profileImage: '/images/avatars/jessica.jpg' },
      duration: '22h',
      enrollmentCount: 6300,
      rating: 4.6,
      ratingCount: 1800,
      price: 199,
      level: 'Beginner',
      category: 'Marketing',
      hasWorkbook: false,
      hasCohort: false,
      hasExpertQA: true,
      hasCapstone: false,
    },
    {
      id: 'course-19',
      title: '3D Modeling & Game Design',
      description: 'Create 3D models, characters, and environments for games using Unity and Unreal Engine.',
      thumbnail: '/images/courses/netflix1.jpg',
      instructor: { name: 'Jake Miller', profileImage: '/images/avatars/jake.jpg' },
      duration: '58h',
      enrollmentCount: 9400,
      rating: 4.9,
      ratingCount: 2600,
      price: 349,
      level: 'Advanced',
      category: 'Design',
      hasWorkbook: true,
      hasCohort: true,
      hasExpertQA: true,
      hasCapstone: true,
    },
    {
      id: 'course-20',
      title: 'Artificial Intelligence Fundamentals',
      description: 'Understand AI concepts, neural networks, natural language processing, and computer vision.',
      thumbnail: '/images/courses/netflix2.jpg',
      instructor: { name: 'Dr. Susan Lee', profileImage: '/images/avatars/susan.jpg' },
      duration: '50h',
      enrollmentCount: 8200,
      rating: 4.7,
      ratingCount: 2300,
      price: 389,
      level: 'Advanced',
      category: 'Data Science',
      hasWorkbook: true,
      hasCohort: true,
      hasExpertQA: true,
      hasCapstone: true,
    },
  ], []);

  // Load courses on mount with caching
  useEffect(() => {
    const loadCourses = async () => {
      // Try to load from localStorage first
      try {
        const cached = localStorage.getItem(CACHE_KEYS.COURSES);
        const timestamp = localStorage.getItem(CACHE_KEYS.TIMESTAMP);
        const cachedList = localStorage.getItem(CACHE_KEYS.MY_LIST);

        if (cached && timestamp) {
          const age = Date.now() - parseInt(timestamp);
          if (age < CACHE_DURATION) {
            const cachedCourses = JSON.parse(cached);
            setCourses(cachedCourses);
            console.log('📚 Loaded courses from cache');

            // Load my list from cache
            if (cachedList) {
              setMyList(JSON.parse(cachedList));
            }
            return; // Use cached data
          }
        }
      } catch (error) {
        console.warn('Cache load failed:', error);
      }

      // Load mock courses immediately for instant display
      const coursesWithFlags = mockCourses.map((course, index) => ({
        ...course,
        trending: index % 3 === 0,
        new: index % 4 === 0,
        featured: index === 0,
      }));
      setCourses(coursesWithFlags);

      // Cache the courses
      try {
        localStorage.setItem(CACHE_KEYS.COURSES, JSON.stringify(coursesWithFlags));
        localStorage.setItem(CACHE_KEYS.TIMESTAMP, Date.now().toString());
      } catch (error) {
        console.warn('Cache save failed:', error);
      }

      // Try to fetch real courses from API in background (optional)
      try {
        const res = await fetch('/api/signature-courses');
        if (res.ok) {
          const data = await res.json();
          if (data.courses && data.courses.length > 0) {
            // Merge API courses with mock courses
            const allCourses = [...data.courses, ...mockCourses];
            const updatedCourses = allCourses.map((course: SignatureCourse, index: number) => ({
              ...course,
              trending: index % 3 === 0,
              new: index % 4 === 0,
              featured: index === 0,
            }));
            setCourses(updatedCourses);

            // Update cache
            try {
              localStorage.setItem(CACHE_KEYS.COURSES, JSON.stringify(updatedCourses));
              localStorage.setItem(CACHE_KEYS.TIMESTAMP, Date.now().toString());
            } catch (error) {
              console.warn('Cache update failed:', error);
            }
          }
        }
      } catch (error) {
        console.log('API not available, using mock data only');
      }
    };

    loadCourses();
  }, [mockCourses]);

  // Handle scroll for navbar background
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setScrolled(scrollTop > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const categories = useMemo(() => [
    { id: 'all', name: lang === 'de' ? 'Alle' : 'All Courses' },
    { id: 'Technology', name: lang === 'de' ? 'Technologie' : 'Technology' },
    { id: 'Business', name: lang === 'de' ? 'Wirtschaft' : 'Business' },
    { id: 'Design', name: lang === 'de' ? 'Design' : 'Design' },
    { id: 'Marketing', name: lang === 'de' ? 'Marketing' : 'Marketing' },
    { id: 'Data Science', name: lang === 'de' ? 'Datenwissenschaft' : 'Data Science' },
  ], [lang]);

  // Memoize filtered courses to avoid recalculation
  const featuredCourse = useMemo(() => courses.find(c => c.featured) || courses[0], [courses]);
  const trendingCourses = useMemo(() => courses.filter(c => c.trending), [courses]);
  const newCourses = useMemo(() => courses.filter(c => c.new), [courses]);

  const filteredCourses = useMemo(() =>
    selectedCategory === 'all'
      ? courses
      : courses.filter(c => c.category === selectedCategory),
    [courses, selectedCategory]
  );

  const toggleMyList = useCallback((courseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isInList = myList.includes(courseId);
    setMyList(prev => {
      const newList = isInList
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId];

      // Cache the updated list
      try {
        localStorage.setItem(CACHE_KEYS.MY_LIST, JSON.stringify(newList));
      } catch (error) {
        console.warn('Failed to cache my list:', error);
      }

      return newList;
    });

    toast.success(
      isInList
        ? lang === 'de' ? 'Von meiner Liste entfernt' : 'Removed from My List'
        : lang === 'de' ? 'Zu meiner Liste hinzugefügt' : 'Added to My List'
    );
  }, [myList, lang, CACHE_KEYS.MY_LIST]);

  // Simplified navigation handlers
  const handleCourseClick = useCallback(async (courseId: string) => {
    setIsNavigating(prev => ({ ...prev, [`course-${courseId}`]: true }));

    try {
      await navigateWithOptimization(`/${locale}/signature-courses/${courseId}/watch`);
      toast.success('Course loaded!');
    } catch (error) {
      console.error('Course navigation error:', error);
      toast.error('Failed to start course');
    } finally {
      setIsNavigating(prev => ({ ...prev, [`course-${courseId}`]: false }));
    }
  }, [locale, navigateWithOptimization]);

  const handleHomeClick = useCallback(async () => {
    setIsNavigating(prev => ({ ...prev, 'nav-home': true }));

    try {
      await navigateWithOptimization(`/${locale}/`);
    } catch (error) {
      console.error('Home navigation error:', error);
    } finally {
      setIsNavigating(prev => ({ ...prev, 'nav-home': false }));
    }
  }, [locale, navigateWithOptimization]);

  // Modal handlers
  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setSelectedCourse(null);
  }, []);

  const handleAddToList = useCallback(() => {
    if (!selectedCourse) return;
    setMyList(prev => {
      const newList = prev.includes(selectedCourse.id)
        ? prev.filter(id => id !== selectedCourse.id)
        : [...prev, selectedCourse.id];

      // Cache the updated list
      try {
        localStorage.setItem(CACHE_KEYS.MY_LIST, JSON.stringify(newList));
      } catch (error) {
        console.warn('Failed to cache my list:', error);
      }

      return newList;
    });
  }, [selectedCourse?.id, CACHE_KEYS.MY_LIST]);

  const handleStartCourse = useCallback(() => {
    if (!selectedCourse) return;
    setModalOpen(false);
    handleCourseClick(selectedCourse.id);
  }, [selectedCourse?.id, handleCourseClick]);

  const handleModalOpen = useCallback((course: SignatureCourse) => {
    setSelectedCourse(course);
    setModalOpen(true);
  }, []);

  const t = {
    en: {
      myList: 'My List',
      trending: 'Trending Now',
      new: 'New Releases',
      allCourses: 'All Courses',
      startNow: 'Start Now',
      moreInfo: 'More Info',
      students: 'students',
      signature: 'Signature',
      loading: 'Loading...',
      readyToStart: 'Ready to Start Your Learning Journey?',
      joinThousands: 'Join thousands of students and earn globally recognized certificates',
      exploreAll: 'Explore All Courses',
      continueWatching: 'Continue Watching',
      continueWatchingFor: 'Continue Watching for',
    },
    de: {
      myList: 'Meine Liste',
      trending: 'Gerade im Trend',
      new: 'Neuerscheinungen',
      allCourses: 'Alle Kurse',
      startNow: 'Jetzt starten',
      moreInfo: 'Mehr Info',
      students: 'Studenten',
      signature: 'Signatur',
      loading: 'Laden...',
      readyToStart: 'Bereit, Ihre Lernreise zu beginnen?',
      joinThousands: 'Schließen Sie sich Tausenden von Studenten an und erwerben Sie weltweit anerkannte Zertifikate',
      exploreAll: 'Alle Kurse erkunden',
      continueWatching: 'Weiter ansehen',
      continueWatchingFor: 'Weiter ansehen für',
    },
  };

  const currentT = t[lang];

  // Optimized Course Row Component with React.memo
  const CourseRow = memo(({ title, courses, categoryId }: { title: string, courses: SignatureCourse[], categoryId?: string }) => {
    const scroll = (direction: 'left' | 'right') => {
      const container = document.getElementById(`row-${categoryId || title}`);
      if (container) {
        const scrollAmount = direction === 'left' ? -1000 : 1000;
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    };

    const handleCardHover = useCallback((courseId: string, event: React.MouseEvent<HTMLDivElement>) => {
      // Create unique hover ID by combining course ID with category/row ID
      const uniqueHoverId = `${categoryId || title}-${courseId}`;
      setHoveredCourse(uniqueHoverId);

      // Scroll the card into view when hovering
      const card = event.currentTarget;
      const container = document.getElementById(`row-${categoryId || title}`);

      if (container && card) {
        const containerRect = container.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();

        // Calculate if card is partially hidden
        const isPartiallyHiddenLeft = cardRect.left < containerRect.left;
        const isPartiallyHiddenRight = cardRect.right > containerRect.right;

        if (isPartiallyHiddenLeft || isPartiallyHiddenRight) {
          // Scroll to center the card
          const scrollLeft = card.offsetLeft - (containerRect.width / 2) + (cardRect.width / 2);
          container.scrollTo({
            left: scrollLeft,
            behavior: 'smooth'
          });
        }
      }
    }, [categoryId, title]);

    return (
      <div className="mb-32 group/row" style={{ overflow: 'visible', minHeight: '300px' }}>
        <div className="flex items-center justify-between mb-4 px-4 sm:px-12">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white hover:text-gray-300 transition-all duration-300 cursor-pointer">
            {title}
          </h2>
          <button
            onClick={() => setSelectedCategory(categoryId || 'all')}
            className="text-xs sm:text-sm text-gray-400 hover:text-white transition-all duration-300 flex items-center gap-2 group/explore hover:scale-105"
          >
            <span className="hidden sm:inline">{lang === 'de' ? 'Alle erkunden' : 'Explore All'}</span>
            <DynamicIcon name="ChevronRight" className="w-4 h-4 group-hover/explore:translate-x-1 transition-transform duration-300" />
          </button>
        </div>
        <div className="relative group/container" style={{ overflow: 'visible' }}>
          {/* Enhanced Scroll Buttons */}
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-0 z-[60] bg-gradient-to-r from-black via-black/80 to-transparent hover:from-black/90 hover:via-black/70 w-12 flex items-center justify-center opacity-0 group-hover/container:opacity-100 transition-all duration-300 backdrop-blur-sm"
          >
            <DynamicIcon name="ChevronLeft" className="w-8 h-8 text-white drop-shadow-lg" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-0 z-[60] bg-gradient-to-l from-black via-black/80 to-transparent hover:from-black/90 hover:via-black/70 w-12 flex items-center justify-center opacity-0 group-hover/container:opacity-100 transition-all duration-300 backdrop-blur-sm"
          >
            <DynamicIcon name="ChevronRight" className="w-8 h-8 text-white drop-shadow-lg" />
          </button>

          {/* Course Cards Scroll */}
          <div
            id={`row-${categoryId || title}`}
            className="flex gap-1 overflow-x-auto scrollbar-hide px-4 sm:px-12 py-8"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              overflowY: 'visible',
              paddingBottom: '200px',
              marginBottom: '-200px',
            }}
          >
            {courses.map((course, index) => {
              // Create unique hover ID for this course in this specific row
              const uniqueHoverId = `${categoryId || title}-${course.id}`;

              return (
                <div
                  key={`${categoryId || title}-${course.id}-${index}`}
                  className="flex-shrink-0 w-[240px] sm:w-[280px] md:w-[320px]"
                  onMouseEnter={(e) => handleCardHover(course.id, e)}
                  onMouseLeave={() => setHoveredCourse(null)}
                >
                  <div
                    className={`relative transition-all duration-300 ease-in-out ${hoveredCourse === uniqueHoverId ? 'z-[9999]' : 'z-10'
                      }`}
                    style={{
                      transform: hoveredCourse === uniqueHoverId
                        ? 'scale(1.5) translateY(-20px)'
                        : 'scale(1) translateY(0)',
                      transformOrigin: 'center center',
                      transitionDuration: '0.4s',
                      transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    <div
                      className={`relative aspect-video overflow-hidden cursor-pointer transition-all duration-300 ${hoveredCourse === uniqueHoverId ? 'rounded-md shadow-2xl' : 'rounded-md shadow-lg'
                        }`}
                      onClick={() => {
                        setSelectedCourse(course);
                        setModalOpen(true);
                      }}
                    >
                      {/* Netflix-style Thumbnail with Random Images */}
                      <Image
                        src={getNetflixImage(course.id)}
                        alt={course.title}
                        fill
                        className={`object-cover transition-all duration-500 ${hoveredCourse === uniqueHoverId ? 'brightness-110 contrast-110' : 'brightness-100'
                          }`}
                        loading="lazy"
                        sizes="(max-width: 640px) 240px, (max-width: 768px) 280px, 320px"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            const fallback = document.createElement('div');
                            fallback.className = 'absolute inset-0 bg-gradient-to-br from-purple-900 via-black to-pink-900';
                            parent.appendChild(fallback);
                          }
                        }}
                      />

                      {/* Platform Logo - Enhanced Netflix Style */}
                      <div className="absolute top-2 left-2 z-20">
                        <div className="bg-[#E50914] rounded-sm px-1.5 py-0.5 shadow-lg">
                          <span className="text-white font-black text-sm leading-none" style={{ fontFamily: 'Arial Black, sans-serif' }}>N</span>
                        </div>
                      </div>

                      {/* Add to List Button - Enhanced */}
                      <button
                        onClick={(e) => toggleMyList(course.id, e)}
                        className={`absolute top-2 right-2 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all z-10 ${myList.includes(course.id)
                          ? 'bg-white border-white text-black'
                          : 'bg-black/70 hover:bg-black/90 border-gray-500 hover:border-white text-white'
                          } opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100`}
                      >
                        {myList.includes(course.id) ? (
                          <DynamicIcon name="Check" className="w-3.5 h-3.5" />
                        ) : (
                          <DynamicIcon name="Plus" className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Loading overlay */}
                      {isNavigating[`course-${course.id}`] && (
                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-30">
                          <DynamicIcon name="Loader2" className="w-12 h-12 text-white animate-spin" />
                        </div>
                      )}
                    </div>

                    {/* Expanded Info on Hover - Netflix Style */}
                    {hoveredCourse === uniqueHoverId && (
                      <div
                        className="absolute top-full left-0 right-0 bg-[#181818] rounded-b-md shadow-2xl opacity-100 transition-opacity duration-200"
                        style={{ marginTop: '0px' }}
                      >
                        {/* Action Buttons Row - Enhanced */}
                        <div className="flex items-center gap-2 p-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCourseClick(course.id);
                            }}
                            disabled={isNavigating[`course-${course.id}`]}
                            className="w-8 h-8 bg-white hover:bg-gray-200 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 disabled:hover:scale-100 disabled:opacity-70"
                          >
                            {isNavigating[`course-${course.id}`] ? (
                              <DynamicIcon name="Loader2" className="w-4 h-4 text-black animate-spin" />
                            ) : (
                              <DynamicIcon name="Play" className="w-4 h-4 text-black ml-0.5" />
                            )}
                          </button>

                          <button
                            onClick={(e) => toggleMyList(course.id, e)}
                            className={`w-8 h-8 border-2 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${myList.includes(course.id)
                              ? 'bg-white border-white text-black'
                              : 'bg-transparent hover:bg-gray-600 border-gray-500 hover:border-white text-white'
                              }`}
                          >
                            {myList.includes(course.id) ? (
                              <DynamicIcon name="Check" className="w-4 h-4" />
                            ) : (
                              <DynamicIcon name="Plus" className="w-4 h-4" />
                            )}
                          </button>

                          <div className="flex-1"></div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCourse(course);
                              setModalOpen(true);
                            }}
                            className="w-8 h-8 bg-transparent hover:bg-gray-600 border-2 border-gray-500 hover:border-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                          >
                            <DynamicIcon name="ChevronRight" className="w-4 h-4 text-white" />
                          </button>
                        </div>

                        {/* Info Section - Enhanced */}
                        <div className="px-3 pb-3">
                          {/* Stats Row with better styling */}
                          <div className="flex items-center gap-2 mb-2 text-xs">
                            <span className="text-green-400 font-semibold bg-green-400/20 px-2 py-0.5 rounded">
                              {(course.rating * 10).toFixed(0)}% Match
                            </span>
                            <span className="border border-gray-600 px-1.5 py-0.5 text-gray-400 text-[10px] rounded">
                              {course.level}
                            </span>
                            <span className="text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded text-[10px]">
                              {course.duration}
                            </span>
                          </div>

                          {/* Tags with enhanced styling */}
                          <div className="flex flex-wrap gap-1 text-[11px] text-gray-400">
                            <span className="bg-gray-800 px-2 py-0.5 rounded">{course.category}</span>
                            <span>•</span>
                            <span className="hover:text-white transition-colors cursor-pointer">{course.instructor.name}</span>
                            {course.hasWorkbook && (
                              <>
                                <span>•</span>
                                <span className="text-blue-400">{isRTL ? 'كتب عمل' : 'Workbooks'}</span>
                              </>
                            )}
                            {course.hasCohort && (
                              <>
                                <span>•</span>
                                <span className="text-purple-400">{isRTL ? 'مجموعة' : 'Cohort'}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  });

  // Simplified loading component
  const LoadingSpinner = memo(() => (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="flex flex-col items-center gap-4">
        <DynamicIcon name="Loader2" className="w-12 h-12 animate-spin text-red-600" />
        <span className="text-white text-lg">{currentT.loading}</span>
      </div>
    </div>
  ));

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-black text-white" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Netflix-style Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
        ? 'bg-black/95 backdrop-blur-md shadow-lg'
        : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent'
        }`}>
        <div className="flex items-center justify-between px-4 md:px-12 py-4">
          {/* Left - Logo & Menu */}
          <div className="flex items-center gap-8">
            {/* Netflix Logo with enhanced styling */}
            <div
              onClick={handleHomeClick}
              className="text-[#E50914] font-black text-2xl md:text-3xl cursor-pointer hover:scale-110 transition-transform duration-200"
              style={{ fontFamily: 'Arial Black, sans-serif' }}
            >
              NEXUS
            </div>

            {/* Navigation Links - Desktop */}
            <div className="hidden md:flex items-center gap-5 text-sm">
              <button
                onClick={handleHomeClick}
                className="text-white font-semibold hover:text-gray-300 transition-colors duration-200 relative group"
              >
                {isRTL ? 'الرئيسية' : 'Home'}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
              </button>
              <button
                onClick={(e) => e.preventDefault()}
                className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer relative group"
              >
                {isRTL ? 'المسلسلات' : 'TV Shows'}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
              </button>
              <button
                onClick={(e) => e.preventDefault()}
                className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer relative group"
              >
                {isRTL ? 'الأفلام' : 'Movies'}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
              </button>
              <button
                onClick={(e) => e.preventDefault()}
                className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer relative group"
              >
                {isRTL ? 'جديد ورائج' : 'New & Popular'}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
              </button>
              <button
                onClick={(e) => e.preventDefault()}
                className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer relative group"
              >
                {isRTL ? 'قائمتي' : 'My List'}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
              </button>
              <button
                onClick={(e) => e.preventDefault()}
                className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer relative group"
              >
                {isRTL ? 'تصفح حسب اللغة' : 'Browse by Languages'}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
              </button>
            </div>
          </div>

          {/* Right - Search, Notifications, Profile */}
          <div className="flex items-center gap-4 md:gap-6">
            {/* Search Icon with enhanced hover */}
            <button className="text-white hover:text-gray-300 transition-all duration-200 hover:scale-110">
              <DynamicIcon name="Search" className="w-5 h-5" />
            </button>

            {/* Notifications with enhanced styling */}
            <button className="text-white hover:text-gray-300 transition-all duration-200 relative hover:scale-110">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z" />
              </svg>
              {/* Notification dot */}
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            </button>

            {/* Profile Dropdown with enhanced styling */}
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ring-2 ring-transparent group-hover:ring-white/50 transition-all duration-200">
                <span className="text-white text-sm font-bold">
                  {session?.user?.name?.[0] || 'U'}
                </span>
              </div>
              <svg className="w-4 h-4 text-white group-hover:rotate-180 transition-transform duration-300" fill="currentColor" viewBox="0 0 16 16">
                <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z" />
              </svg>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Netflix Billboard Style */}
      <div className="relative w-full mb-0 pt-16" style={{ height: 'calc(75vh + 280px)' }}>
        {/* Background Image with Gradient Overlay - Extended to cover Continue Watching */}
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src="/images/courses/netflix7.jpg"
            alt="Featured Course"
            fill
            priority
            className="object-cover"
            style={{ objectPosition: 'center 40%' }}
            sizes="100vw"
          />
          {/* Strong visible gradient - extended fade to bottom */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, transparent 0%, transparent 30%, rgba(0,0,0,0.05) 35%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.2) 45%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0.72) 65%, rgba(0,0,0,0.82) 70%, rgba(0,0,0,0.90) 75%, rgba(0,0,0,0.95) 80%, rgba(0,0,0,0.97) 85%, rgba(0,0,0,0.99) 90%, #000000 95%, #000000 100%)'
            }}
          />
          {/* Top gradient for navbar */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to top, transparent 70%, rgba(0,0,0,0.2) 85%, rgba(0,0,0,0.5) 95%, rgba(0,0,0,0.7) 100%)'
            }}
          />
          {/* Left side vignette for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex items-center px-4 sm:px-12" style={{ height: '75vh' }}>
          <div className="max-w-2xl">
            {/* Category Badge */}
            <SimpleBadge className="bg-[#E50914] text-white border-0 mb-4">
              <DynamicIcon name="Crown" className="w-3 h-3 mr-1" />
              {currentT.signature}
            </SimpleBadge>

            {/* Title */}
            {featuredCourse && (
              <>
                <h1 className="text-4xl sm:text-6xl font-black mb-4">
                  {featuredCourse.title}
                </h1>

                {/* Description */}
                <p className="text-lg text-gray-300 mb-8 max-w-xl line-clamp-3">
                  {featuredCourse.description}
                </p>

                {/* CTA Buttons with enhanced styling and loading states */}
                <div className="flex gap-4">
                  <SimpleButton
                    onClick={() => handleCourseClick(featuredCourse.id)}
                    disabled={isNavigating[`course-${featuredCourse.id}`]}
                    className="bg-white hover:bg-gray-200 text-black font-bold px-8 py-6 text-lg transition-all duration-200 hover:scale-105 disabled:hover:scale-100 disabled:opacity-70"
                  >
                    {isNavigating[`course-${featuredCourse.id}`] ? (
                      <>
                        <DynamicIcon name="Loader2" className="w-5 h-5 mr-2 animate-spin" />
                        {isRTL ? 'جاري التحميل...' : 'Loading...'}
                      </>
                    ) : (
                      <>
                        <DynamicIcon name="Play" className="w-5 h-5 mr-2" />
                        {currentT.startNow}
                      </>
                    )}
                  </SimpleButton>
                  <SimpleButton
                    onClick={() => handleModalOpen(featuredCourse)}
                    className="bg-gray-700/80 hover:bg-gray-600 text-white font-semibold px-8 py-6 text-lg backdrop-blur-sm transition-all duration-200 hover:scale-105 ring-1 ring-gray-600 hover:ring-gray-400"
                  >
                    <DynamicIcon name="Info" className="w-5 h-5 mr-2" />
                    {currentT.moreInfo}
                  </SimpleButton>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Continue Watching Section - Enhanced styling */}
        <div className="absolute bottom-0 left-0 right-0 z-20 px-4 sm:px-12 pb-8">
          <h3 className="text-white text-xl font-semibold mb-4 flex items-center gap-2">
            <DynamicIcon name="Clock" className="w-5 h-5 text-red-500" />
            {currentT.continueWatchingFor} {session?.user?.name || 'Guest'}
          </h3>
          <div className="flex gap-3">
            {courses.slice(0, 1).map((course) => (
              <div
                key={course.id}
                className="w-[300px] sm:w-[380px] cursor-pointer group relative"
                onClick={() => handleCourseClick(course.id)}
              >
                <div className="relative aspect-video rounded-lg overflow-hidden mb-2 bg-gray-900 ring-2 ring-transparent group-hover:ring-white/30 transition-all duration-300">
                  <Image
                    src={getNetflixImage(course.id)}
                    alt={course.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    sizes="(max-width: 640px) 300px, 380px"
                  />
                  {/* Enhanced progress bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-red-600 shadow-lg"
                      style={{ width: `45%` }}
                    ></div>
                  </div>
                  {/* Enhanced play overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center">
                    {isNavigating[`course-${course.id}`] ? (
                      <DynamicIcon name="Loader2" className="w-16 h-16 text-white animate-spin" />
                    ) : (
                      <DynamicIcon name="Play" className="w-16 h-16 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 drop-shadow-lg" />
                    )}
                  </div>
                  {/* Resume timestamp */}
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    23:45 left
                  </div>
                </div>
                <h4 className="text-white text-sm font-medium group-hover:text-gray-300 transition-colors">{course.title}</h4>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Course Rows - Netflix Style */}
      <div className="relative z-20 py-4 space-y-16 overflow-visible pb-24">
        {/* Trending Now */}
        {trendingCourses.length > 0 && (
          <CourseRow
            title={currentT.trending}
            courses={trendingCourses}
            categoryId="trending"
          />
        )}

        {/* New Releases */}
        {newCourses.length > 0 && (
          <CourseRow
            title={currentT.new}
            courses={newCourses}
            categoryId="new"
          />
        )}

        {/* My List */}
        {myList.length > 0 && (
          <CourseRow
            title={currentT.myList}
            courses={courses.filter(c => myList.includes(c.id))}
            categoryId="mylist"
          />
        )}

        {/* All Courses / Filtered */}
        <CourseRow
          title={selectedCategory === 'all'
            ? currentT.allCourses
            : categories.find(c => c.id === selectedCategory)?.name || ''
          }
          courses={filteredCourses}
          categoryId={selectedCategory}
        />
      </div>

      {/* Course Detail Modal */}
      {selectedCourse && (
        <Suspense fallback={<LoadingSpinner />}>
          <CourseDetailModal
            isOpen={modalOpen}
            onClose={handleCloseModal}
            course={selectedCourse}
            isRTL={isRTL}
            onAddToList={handleAddToList}
            isInList={myList.includes(selectedCourse.id)}
            onStartCourse={handleStartCourse}
          />
        </Suspense>
      )}

      {/* Custom Scrollbar Styles and Enhanced Netflix Effects */}
      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Enhanced Netflix-style animations */
        @keyframes pulse-red {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }

        @keyframes slide-in {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .netflix-pulse {
          animation: pulse-red 2s infinite;
        }

        .netflix-slide-in {
          animation: slide-in 0.3s ease-out;
        }

        /* Custom hover effects */
        .netflix-card:hover {
          filter: brightness(1.1) contrast(1.1);
          transform: scale(1.05);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Gradient text effect */
        .gradient-text {
          background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Enhanced shadow effects */
        .netflix-shadow {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
        }
      `}</style>
    </div>
  );
}