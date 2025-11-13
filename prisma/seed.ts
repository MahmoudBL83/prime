import { PrismaClient, UserRole, KYCStatus, ContentStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting Egyptian EdTech Platform demo seed...')

    // Clear existing data for demo
    await prisma.lesson.deleteMany()
    await prisma.enrollment.deleteMany()
    await prisma.course.deleteMany()
    await prisma.creator.deleteMany()
    await prisma.user.deleteMany()

    // Demo password for all accounts (easy to remember for demo)
    const demoPassword = await bcrypt.hash('demo123', 10)

    // === DEMO ADMIN USER ===
    const admin = await prisma.user.create({
        data: {
            email: 'admin@prime.eg',
            passwordHash: demoPassword,
            name: 'Omar Hassan',
            arabicName: 'عمر حسن',
            role: UserRole.ADMIN,
            emailVerified: new Date(),
            bio: 'Platform Administrator for Prime EdTech',
        },
    })

    // === DEMO LEARNER USERS ===
    const learner1 = await prisma.user.create({
        data: {
            email: 'fatma@demo.com',
            passwordHash: demoPassword,
            name: 'Fatma Ahmed',
            arabicName: 'فاطمة أحمد',
            role: UserRole.LEARNER,
            interests: 'Technology,Programming,Business',
            goals: 'Career Change into Tech,Skill Development',
            skillLevel: 'Beginner',
            learningMode: 'Interactive with group',
            emailVerified: new Date(),
            bio: 'Engineering student interested in web development',
            phone: '+201234567890',
        },
    })

    const learner2 = await prisma.user.create({
        data: {
            email: 'ahmed@demo.com',
            passwordHash: demoPassword,
            name: 'Ahmed Mohamed',
            arabicName: 'أحمد محمد',
            role: UserRole.LEARNER,
            interests: 'Business,Marketing,Languages',
            goals: 'Job Promotion,Get Certified',
            skillLevel: 'Intermediate',
            learningMode: 'Self-paced',
            emailVerified: new Date(),
            bio: 'Marketing professional looking to advance career',
            phone: '+201987654321',
        },
    })

    const learner3 = await prisma.user.create({
        data: {
            email: 'nour@demo.com',
            passwordHash: demoPassword,
            name: 'Nour Mahmoud',
            arabicName: 'نور محمود',
            role: UserRole.LEARNER,
            interests: 'Design,Technology,Languages',
            goals: 'Thanaweya Amma Prep,University Entrance',
            skillLevel: 'Beginner',
            learningMode: 'Mixed',
            emailVerified: new Date(),
            bio: 'High school student preparing for university',
            phone: '+201555666777',
        },
    })

    // === DEMO CREATOR USERS ===
    const creatorUser1 = await prisma.user.create({
        data: {
            email: 'dr.sarah@demo.com',
            passwordHash: demoPassword,
            name: 'Dr. Sarah Farouk',
            arabicName: 'د. سارة فاروق',
            role: UserRole.CREATOR,
            emailVerified: new Date(),
            bio: 'Computer Science Professor at Cairo University with 10+ years experience',
            phone: '+201111222333',
            profileImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&h=400&fit=crop&crop=face&auto=format&q=80',
        },
    })

    const creator1 = await prisma.creator.create({
        data: {
            userId: creatorUser1.id,
            kycStatus: KYCStatus.VERIFIED,
            expertise: 'Computer Science, Web Development, AI',
            teachingGoals: 'Empower Egyptian students with cutting-edge technology skills',
            contractSigned: true,
            contractSignedAt: new Date(),
            totalEarnings: 15000,
            totalSubscribers: 450,
        },
    })

    const creatorUser2 = await prisma.user.create({
        data: {
            email: 'khaled@demo.com',
            passwordHash: demoPassword,
            name: 'Khaled Ibrahim',
            arabicName: 'خالد إبراهيم',
            role: UserRole.CREATOR,
            emailVerified: new Date(),
            bio: 'Digital Marketing Expert and Entrepreneur',
            phone: '+201444555666',
            profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=400&fit=crop&crop=face&auto=format&q=80',
        },
    })

    const creator2 = await prisma.creator.create({
        data: {
            userId: creatorUser2.id,
            kycStatus: KYCStatus.VERIFIED,
            expertise: 'Digital Marketing, E-commerce, Business Strategy',
            teachingGoals: 'Help young Egyptians build successful online businesses',
            contractSigned: true,
            contractSignedAt: new Date(),
            totalEarnings: 8500,
            totalSubscribers: 320,
        },
    })

    const creatorUser3 = await prisma.user.create({
        data: {
            email: 'maya@demo.com',
            passwordHash: demoPassword,
            name: 'Maya Adel',
            arabicName: 'مايا عادل',
            role: UserRole.CREATOR,
            emailVerified: new Date(),
            bio: 'English Language Teacher and IELTS Instructor',
            phone: '+201777888999',
            profileImage: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&h=400&fit=crop&crop=face&auto=format&q=80',
        },
    })

    const creator3 = await prisma.creator.create({
        data: {
            userId: creatorUser3.id,
            kycStatus: KYCStatus.VERIFIED,
            expertise: 'English Language, IELTS, Communication Skills',
            teachingGoals: 'Improve English proficiency for Egyptian students and professionals',
            contractSigned: true,
            contractSignedAt: new Date(),
            totalEarnings: 12000,
            totalSubscribers: 680,
        },
    })

    const creatorUser4 = await prisma.user.create({
        data: {
            email: 'ahmed.mahmoud@demo.com',
            passwordHash: demoPassword,
            name: 'Ahmed Mahmoud',
            arabicName: 'د. أحمد محمود',
            role: UserRole.CREATOR,
            emailVerified: new Date(),
            bio: 'Architecture Professor and Urban Planning Expert with 20+ years experience',
            phone: '+201222333444',
            profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop&crop=face&auto=format&q=80',
        },
    })

    const creator4 = await prisma.creator.create({
        data: {
            userId: creatorUser4.id,
            kycStatus: KYCStatus.VERIFIED,
            expertise: 'Architecture, Urban Planning, Design',
            teachingGoals: 'Train next generation of Egyptian architects and urban planners',
            contractSigned: true,
            contractSignedAt: new Date(),
            totalEarnings: 18000,
            totalSubscribers: 450,
        },
    })

    const creatorUser5 = await prisma.user.create({
        data: {
            email: 'yousef.khaled@demo.com',
            passwordHash: demoPassword,
            name: 'Yousef Khaled',
            arabicName: 'أ. يوسف خالد',
            role: UserRole.CREATOR,
            emailVerified: new Date(),
            bio: 'Entrepreneur and Business Coach specializing in startups and investment',
            phone: '+201333444555',
            profileImage: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&h=400&fit=crop&crop=face&auto=format&q=80',
        },
    })

    const creator5 = await prisma.creator.create({
        data: {
            userId: creatorUser5.id,
            kycStatus: KYCStatus.VERIFIED,
            expertise: 'Entrepreneurship, Business Strategy, Investment',
            teachingGoals: 'Empower young Egyptian entrepreneurs to build successful businesses',
            contractSigned: true,
            contractSignedAt: new Date(),
            totalEarnings: 10500,
            totalSubscribers: 250,
        },
    })

    // === DEMO COURSES (Category A - All-Access Library) ===
    const course1 = await prisma.course.create({
        data: {
            title: 'Complete Web Development Bootcamp',
            titleAr: 'دورة تطوير الويب الشاملة',
            description: 'Master HTML, CSS, JavaScript, React, and Node.js. Build real-world projects and land your first tech job.',
            descriptionAr: 'إتقان HTML و CSS و JavaScript و React و Node.js. ابن مشاريع حقيقية واحصل على أول وظيفة في التكنولوجيا.',
            creatorId: creator1.id,
            category: 'CATEGORY_A',
            skillLevel: 'Beginner',
            duration: 2400, // 40 hours
            language: 'ar',
            price: 200,
            status: ContentStatus.PUBLISHED,
            publishedAt: new Date(),
            totalViews: 1250,
            totalEnrollments: 89,
            rating: 4.8,
            thumbnail: 'https://images.unsplash.com/photo-1593720213428-28a5b9e94613?w=800&h=600&fit=crop&crop=center',
            syllabus: {
                modules: [
                    {
                        title: 'HTML و CSS الأساسيات',
                        titleEn: 'HTML & CSS Fundamentals',
                        lessons: ['مقدمة في HTML', 'التعامل مع CSS', 'بناء صفحة ويب كاملة']
                    },
                    {
                        title: 'JavaScript المتقدم',
                        titleEn: 'Advanced JavaScript',
                        lessons: ['المتغيرات والدوال', 'DOM Manipulation', 'Async Programming']
                    },
                    {
                        title: 'React Framework',
                        titleEn: 'React Framework',
                        lessons: ['Components و Props', 'State Management', 'Building Real Apps']
                    }
                ]
            },
        },
    })

    const course2 = await prisma.course.create({
        data: {
            title: 'Digital Marketing Mastery',
            titleAr: 'إتقان التسويق الرقمي',
            description: 'Learn Facebook Ads, Google Ads, SEO, and content marketing. Perfect for Egyptian market.',
            descriptionAr: 'تعلم إعلانات فيسبوك وجوجل والسيو وتسويق المحتوى. مثالي للسوق المصري.',
            creatorId: creator2.id,
            category: 'CATEGORY_A',
            skillLevel: 'Intermediate',
            duration: 1800, // 30 hours
            language: 'ar',
            price: 180,
            status: ContentStatus.PUBLISHED,
            publishedAt: new Date(),
            totalViews: 950,
            totalEnrollments: 67,
            rating: 4.6,
            thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop&crop=center',
            syllabus: {
                modules: [
                    {
                        title: 'أساسيات التسويق الرقمي',
                        titleEn: 'Digital Marketing Fundamentals',
                        lessons: ['مفهوم التسويق الرقمي', 'أنواع القنوات', 'استراتيجية المحتوى']
                    },
                    {
                        title: 'إعلانات فيسبوك وإنستجرام',
                        titleEn: 'Facebook & Instagram Ads',
                        lessons: ['إنشاء الحملات', 'استهداف الجمهور', 'تحليل النتائج']
                    }
                ]
            },
        },
    })

    const course3 = await prisma.course.create({
        data: {
            title: 'IELTS Preparation Complete Guide',
            titleAr: 'دليل التحضير الشامل لامتحان الآيلتس',
            description: 'Comprehensive IELTS preparation covering all four skills. Achieve your target band score.',
            descriptionAr: 'تحضير شامل لامتحان الآيلتس يغطي المهارات الأربع. احصل على الدرجة المطلوبة.',
            creatorId: creator3.id,
            category: 'CATEGORY_A',
            skillLevel: 'Intermediate',
            duration: 1500, // 25 hours
            language: 'ar',
            price: 150,
            status: ContentStatus.PUBLISHED,
            publishedAt: new Date(),
            totalViews: 780,
            totalEnrollments: 56,
            rating: 4.9,
            thumbnail: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&h=600&fit=crop&crop=center',
            syllabus: {
                modules: [
                    {
                        title: 'IELTS Reading Skills',
                        titleEn: 'IELTS Reading Skills',
                        lessons: ['Skimming & Scanning', 'Question Types', 'Time Management']
                    },
                    {
                        title: 'IELTS Writing Tasks',
                        titleEn: 'IELTS Writing Tasks',
                        lessons: ['Task 1 Strategies', 'Task 2 Essays', 'Grammar & Vocabulary']
                    }
                ]
            },
        },
    })

    const course4 = await prisma.course.create({
        data: {
            title: 'Architecture Design Fundamentals',
            titleAr: 'أساسيات التصميم المعماري',
            description: 'Learn the principles of architectural design, from concept to construction. Master CAD software and design thinking.',
            descriptionAr: 'تعلم مبادئ التصميم المعماري من الفكرة إلى التنفيذ. إتقان برامج الكاد وفكر التصميم.',
            creatorId: creator4.id,
            category: 'CATEGORY_A',
            skillLevel: 'Beginner',
            duration: 2000, // 33 hours
            language: 'ar',
            price: 300,
            status: ContentStatus.PUBLISHED,
            publishedAt: new Date(),
            totalViews: 920,
            totalEnrollments: 67,
            rating: 4.9,
            thumbnail: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800&h=600&fit=crop&crop=center',
            syllabus: {
                modules: [
                    {
                        title: 'Design Principles',
                        titleEn: 'Design Principles',
                        lessons: ['Form & Function', 'Space Planning', 'Material Selection']
                    },
                    {
                        title: 'CAD Software Mastery',
                        titleEn: 'CAD Software Mastery',
                        lessons: ['AutoCAD Basics', '3D Modeling', 'Technical Drawings']
                    }
                ]
            },
        },
    })

    const course5 = await prisma.course.create({
        data: {
            title: 'Startup Business Strategy',
            titleAr: 'استراتيجية الأعمال للشركات الناشئة',
            description: 'Build and scale your startup from idea to IPO. Learn fundraising, marketing, and team building.',
            descriptionAr: 'ابن وطور شركتك الناشئة من الفكرة إلى الطرح العام. تعلم جمع التمويل والتسويق وبناء الفريق.',
            creatorId: creator5.id,
            category: 'CATEGORY_A',
            skillLevel: 'Intermediate',
            duration: 1800, // 30 hours
            language: 'ar',
            price: 250,
            status: ContentStatus.PUBLISHED,
            publishedAt: new Date(),
            totalViews: 650,
            totalEnrollments: 45,
            rating: 4.8,
            thumbnail: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop&crop=center',
            syllabus: {
                modules: [
                    {
                        title: 'Business Model Canvas',
                        titleEn: 'Business Model Canvas',
                        lessons: ['Value Proposition', 'Customer Segments', 'Revenue Streams']
                    },
                    {
                        title: 'Fundraising & Investment',
                        titleEn: 'Fundraising & Investment',
                        lessons: ['Pitch Deck Creation', 'Angel Investors', 'VC Negotiations']
                    }
                ]
            },
        },
    })

    // === DEMO LESSONS ===
    await prisma.lesson.createMany({
        data: [
            // Course 1 lessons
            {
                courseId: course1.id,
                title: 'Introduction to Web Development',
                titleAr: 'مقدمة في تطوير الويب',
                description: 'Overview of web development and career opportunities',
                videoUrl: 'https://example.com/video1.mp4',
                duration: 900, // 15 minutes
                order: 1,
            },
            {
                courseId: course1.id,
                title: 'HTML Fundamentals',
                titleAr: 'أساسيات HTML',
                description: 'Learn HTML tags, elements, and structure',
                videoUrl: 'https://example.com/video2.mp4',
                duration: 1200, // 20 minutes
                order: 2,
            },
            // Course 2 lessons
            {
                courseId: course2.id,
                title: 'Digital Marketing Overview',
                titleAr: 'نظرة عامة على التسويق الرقمي',
                description: 'Understanding the digital marketing landscape',
                videoUrl: 'https://example.com/video3.mp4',
                duration: 800, // 13 minutes
                order: 1,
            },
            // Course 3 lessons
            {
                courseId: course3.id,
                title: 'IELTS Test Format',
                titleAr: 'تنسيق اختبار الآيلتس',
                description: 'Understanding the IELTS test structure',
                videoUrl: 'https://example.com/video4.mp4',
                duration: 600, // 10 minutes
                order: 1,
            },
        ],
    })

    // === DEMO ENROLLMENTS ===
    await prisma.enrollment.createMany({
        data: [
            {
                userId: learner1.id,
                courseId: course1.id,
                progress: 25,
            },
            {
                userId: learner2.id,
                courseId: course2.id,
                progress: 60,
            },
            {
                userId: learner3.id,
                courseId: course3.id,
                progress: 10,
            },
        ],
    })

    console.log('🎉 Demo seed data created successfully!')
    console.log('👤 Demo User Accounts:')
    console.log('📧 Admin: admin@prime.eg / demo123')
    console.log('🎓 Learner 1: fatma@demo.com / demo123 (Fatma Ahmed - فاطمة أحمد)')
    console.log('🎓 Learner 2: ahmed@demo.com / demo123 (Ahmed Mohamed - أحمد محمد)')
    console.log('🎓 Learner 3: nour@demo.com / demo123 (Nour Mahmoud - نور محمود)')
    console.log('👨‍🏫 Creator 1: dr.sarah@demo.com / demo123 (Dr. Sarah Farouk - د. سارة فاروق)')
    console.log('👨‍🏫 Creator 2: khaled@demo.com / demo123 (Khaled Ibrahim - خالد إبراهيم)')
    console.log('👨‍🏫 Creator 3: maya@demo.com / demo123 (Maya Adel - مايا عادل)')
    console.log('👨‍🏫 Creator 4: ahmed.mahmoud@demo.com / demo123 (Ahmed Mahmoud - د. أحمد محمود)')
    console.log('👨‍🏫 Creator 5: yousef.khaled@demo.com / demo123 (Yousef Khaled - أ. يوسف خالد)')
    console.log('📚 Created 5 comprehensive demo courses with lessons')
    console.log('🔗 Created sample enrollments and progress data')
    console.log('Creator login: creator@test.com / creator123')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
