'use client';

import { useTranslations, useLocale } from 'next-intl';

// Fallback translations for each namespace (now in English as Arabic is removed)
const fallbackTranslations: Record<string, Record<string, string>> = {
    navigation: {
        home: 'Home',
        courses: 'Courses',
        dashboard: 'Dashboard',
        profile: 'Profile',
        settings: 'Settings',
        logout: 'Logout',
        login: 'Login',
        register: 'Register',
        admin: 'Admin',
        creators: 'Mentors',
        studyBuddy: 'Study Buddy',
        subscribe: 'Subscribe'
    },
    auth: {
        login: 'Login',
        register: 'Register',
        email: 'Email',
        password: 'Password',
        forgotPassword: 'Forgot Password?',
        rememberMe: 'Remember Me'
    },
    common: {
        loading: 'Loading...',
        error: 'An error occurred',
        save: 'Save',
        cancel: 'Cancel',
        edit: 'Edit',
        delete: 'Delete',
        search: 'Search',
        viewMore: 'View More'
    },
    payment: {
        subscribe: 'Subscribe',
        upgrade: 'Upgrade',
        plan: 'Plan',
        choosePlan: 'Choose Plan',
        flexiblePlans: 'Flexible plans to suit your needs',
        mostPopular: 'Most Popular',
        checkEligibility: 'Check Eligibility',
        getStarted: 'Get Started',
        subscribeNow: 'Subscribe to Prime',
        paymentMethods: 'Payment Methods',
        moneyBackGuarantee: 'Money Back Guarantee',
        cancelAnytime: 'Cancel Anytime',
        securePayment: 'Secure Payment'
    },
    footer: {
        about: 'About',
        help: 'Help',
        terms: 'Terms',
        privacy: 'Privacy',
        contact: 'Contact Us',
        allRightsReserved: 'All rights reserved'
    },
    mentors: {
        title: 'Mentors',
        learnFromTopMentors: 'Learn from top mentors',
        exclusiveChannels: 'Exclusive channels from experts in their fields',
        viewChannel: 'View Channel',
        followers: 'Followers',
        viewAllMentors: 'View all mentors',
        specialty: 'Specialty',
        rating: 'Rating',
        subscribers: 'Subscribers',
        channelPrice: 'Channel Price',
        subscribe: 'Subscribe',
        description: 'Description'
    },
    courses: {
        title: 'Courses',
        featuredCourses: 'Featured Courses',
        allCourses: 'All Courses',
        myCourses: 'My Courses',
        instructor: 'Instructor',
        duration: 'Duration'
    },
    coursePage: {
        courseNotFound: 'Course not found',
        discountBanner: 'Get up to 70% off annual subscription with code 60',
        getDiscount: 'Get Discount',
        aboutCourse: 'About the Course',
        showMore: 'Show More',
        showLess: 'Show Less',
        instructor: 'Course Instructor',
        courseInstructor: 'Instructor',
        lessonsCount: 'Lessons Count',
        lessons: 'Lessons',
        courseDuration: 'Course Duration',
        hours: 'Hours',
        minutes: 'Minutes',
        rating: 'Rating',
        stars: 'Stars',
        subscribeNow: 'Subscribe Now',
        addToFavorites: 'Add to Favorites',
        share: 'Share',
        whatYouGet: 'What you get:',
        lifetimeAccess: 'Lifetime access to course',
        certificate: 'Certified completion certificate',
        directSupport: 'Direct technical support',
        practicalProjects: 'Practical projects',
        skillsYouLearn: 'Skills you will learn:',
        relatedCourses: 'Related courses',
        loadingPlayer: 'Loading course player...',
        courseLoadError: 'Error loading course'
    },
    landing: {
        'hero.title': 'Egyptian Digital Learning Platform',
        'hero.subtitle': 'Discover a world of knowledge with top educational courses from Egypt',
        'hero.cta': 'Start your learning journey today',
        'hero.exploreCourses': 'Explore Courses',
        'hero.year': '2024',
        'hero.duration': '25 Hours',
        'hero.lessons': '45 Lessons',
        'hero.category': 'Programming',
        'hero.addToList': 'Add to List',
        'hero.startWatching': 'Start Watching',
        'hero.moreInfo': 'More Info'
    }
};

export function useTranslationsSafe(namespace: string) {
    try {
        const t = useTranslations(namespace);
        const locale = useLocale();
        return { t, locale, isReady: true };
    } catch (error) {
        console.warn(`Translation context not available for namespace: ${namespace}, using fallbacks`);

        const fallbackT = (key: string) => {
            // Handle nested keys like 'hero.title'
            const keys = key.split('.');
            let value: any = fallbackTranslations[namespace];

            for (const k of keys) {
                value = value?.[k];
            }

            return value || key;
        };

        return {
            t: fallbackT,
            locale: 'en',
            isReady: false
        };
    }
}

export function useLocaleSafe() {
    try {
        return useLocale();
    } catch (error) {
        console.warn('Locale context not available, using fallback');
        return 'en';
    }
}
