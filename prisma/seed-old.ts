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

    // === MORE DEMO CREATORS ===
    const creatorUser4 = await prisma.user.create({
        data: {
            email: 'mohamed.tech@demo.com',
            passwordHash: demoPassword,
            name: 'Mohamed Rashad',
            arabicName: 'محمد رشاد',
            role: UserRole.CREATOR,
            emailVerified: new Date(),
            bio: 'Mobile App Developer and Flutter Expert',
            phone: '+201888999000',
        },
    })

    const creator4 = await prisma.creator.create({
        data: {
            userId: creatorUser4.id,
            kycStatus: KYCStatus.VERIFIED,
            expertise: 'Mobile Development, Flutter, Dart, iOS, Android',
            teachingGoals: 'Empower Egyptian developers to build world-class mobile apps',
            contractSigned: true,
            contractSignedAt: new Date(),
            totalEarnings: 18000,
            totalSubscribers: 520,
        },
    })

    const creatorUser5 = await prisma.user.create({
        data: {
            email: 'amira.design@demo.com',
            passwordHash: demoPassword,
            name: 'Amira Hassan',
            arabicName: 'أميرة حسن',
            role: UserRole.CREATOR,
            emailVerified: new Date(),
            bio: 'UI/UX Designer and Creative Director',
            phone: '+201777666555',
        },
    })

    const creator5 = await prisma.creator.create({
        data: {
            userId: creatorUser5.id,
            kycStatus: KYCStatus.VERIFIED,
            expertise: 'UI/UX Design, Graphic Design, Adobe Creative Suite, Figma',
            teachingGoals: 'Train the next generation of Egyptian designers',
            contractSigned: true,
            contractSignedAt: new Date(),
            totalEarnings: 14500,
            totalSubscribers: 720,
        },
    })

    const creatorUser6 = await prisma.user.create({
        data: {
            email: 'youssef.data@demo.com',
            passwordHash: demoPassword,
            name: 'Youssef Mahmoud',
            arabicName: 'يوسف محمود',
            role: UserRole.CREATOR,
            emailVerified: new Date(),
            bio: 'Data Scientist and AI Engineer',
            phone: '+201666777888',
        },
    })

    const creator6 = await prisma.creator.create({
        data: {
            userId: creatorUser6.id,
            kycStatus: KYCStatus.VERIFIED,
            expertise: 'Data Science, Machine Learning, Python, AI, Statistics',
            teachingGoals: 'Make AI and Data Science accessible to Arabic speakers',
            contractSigned: true,
            contractSignedAt: new Date(),
            totalEarnings: 22000,
            totalSubscribers: 380,
        },
    })

    const creatorUser7 = await prisma.user.create({
        data: {
            email: 'nadia.business@demo.com',
            passwordHash: demoPassword,
            name: 'Nadia Farouk',
            arabicName: 'نادية فاروق',
            role: UserRole.CREATOR,
            emailVerified: new Date(),
            bio: 'Business Consultant and Entrepreneur',
            phone: '+201555444333',
        },
    })

    const creator7 = await prisma.creator.create({
        data: {
            userId: creatorUser7.id,
            kycStatus: KYCStatus.VERIFIED,
            expertise: 'Business Strategy, Entrepreneurship, Leadership, Project Management',
            teachingGoals: 'Support Egyptian entrepreneurs in building successful businesses',
            contractSigned: true,
            contractSignedAt: new Date(),
            totalEarnings: 16800,
            totalSubscribers: 450,
        },
    })

    const creatorUser8 = await prisma.user.create({
        data: {
            email: 'hassan.language@demo.com',
            passwordHash: demoPassword,
            name: 'Hassan Abdel Rahman',
            arabicName: 'حسن عبد الرحمن',
            role: UserRole.CREATOR,
            emailVerified: new Date(),
            bio: 'Language Learning Expert and Polyglot',
            phone: '+201444333222',
        },
    })

    const creator8 = await prisma.creator.create({
        data: {
            userId: creatorUser8.id,
            kycStatus: KYCStatus.VERIFIED,
            expertise: 'French, German, Spanish, Language Learning Methodology',
            teachingGoals: 'Help Egyptians master foreign languages for global opportunities',
            contractSigned: true,
            contractSignedAt: new Date(),
            totalEarnings: 11200,
            totalSubscribers: 620,
        },
    })

    // === COMPREHENSIVE DEMO COURSES ===
    
    // Technology Courses (Category A)
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
            title: 'Flutter Mobile App Development',
            titleAr: 'تطوير تطبيقات الموبايل بـ Flutter',
            description: 'Learn to build beautiful, natively compiled mobile apps for iOS and Android from a single codebase.',
            descriptionAr: 'تعلم بناء تطبيقات موبايل جميلة ومترجمة أصلياً لـ iOS و Android من قاعدة كود واحدة.',
            creatorId: creator4.id,
            category: 'CATEGORY_A',
            skillLevel: 'Intermediate',
            duration: 3000, // 50 hours
            language: 'ar',
            price: 220,
            status: ContentStatus.PUBLISHED,
            publishedAt: new Date(),
            totalViews: 890,
            totalEnrollments: 67,
            rating: 4.9,
            thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=600&fit=crop&crop=center',
            syllabus: {
                modules: [
                    {
                        title: 'أساسيات Flutter و Dart',
                        titleEn: 'Flutter & Dart Fundamentals',
                        lessons: ['مقدمة في Flutter', 'لغة Dart الأساسية', 'أول تطبيق Flutter']
                    },
                    {
                        title: 'واجهات المستخدم المتقدمة',
                        titleEn: 'Advanced UI Development',
                        lessons: ['Widgets المخصصة', 'Animations', 'Responsive Design']
                    }
                ]
            },
        },
    })

    const course3 = await prisma.course.create({
        data: {
            title: 'Data Science & Machine Learning',
            titleAr: 'علوم البيانات والتعلم الآلي',
            description: 'Master Python, pandas, matplotlib, scikit-learn, and TensorFlow. Build AI models that solve real problems.',
            descriptionAr: 'إتقان Python و pandas و matplotlib و scikit-learn و TensorFlow. ابن نماذج ذكاء اصطناعي تحل مشاكل حقيقية.',
            creatorId: creator6.id,
            category: 'CATEGORY_A',
            skillLevel: 'Advanced',
            duration: 3600, // 60 hours
            language: 'ar',
            price: 250,
            status: ContentStatus.PUBLISHED,
            publishedAt: new Date(),
            totalViews: 720,
            totalEnrollments: 45,
            rating: 4.9,
            thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&crop=center',
            syllabus: {
                modules: [
                    {
                        title: 'Python لعلوم البيانات',
                        titleEn: 'Python for Data Science',
                        lessons: ['NumPy و Pandas', 'Data Visualization', 'Statistical Analysis']
                    },
                    {
                        title: 'التعلم الآلي',
                        titleEn: 'Machine Learning',
                        lessons: ['Supervised Learning', 'Unsupervised Learning', 'Deep Learning']
                    }
                ]
            },
        },
    })

    const course4 = await prisma.course.create({
        data: {
            title: 'UI/UX Design Masterclass',
            titleAr: 'كورس تصميم واجهات المستخدم والتجربة',
            description: 'Learn design thinking, user research, wireframing, prototyping, and visual design with Figma and Adobe XD.',
            descriptionAr: 'تعلم التفكير التصميمي وبحث المستخدمين والنماذج الأولية والتصميم المرئي باستخدام Figma و Adobe XD.',
            creatorId: creator5.id,
            category: 'CATEGORY_A',
            skillLevel: 'Intermediate',
            duration: 2700, // 45 hours
            language: 'ar',
            price: 190,
            status: ContentStatus.PUBLISHED,
            publishedAt: new Date(),
            totalViews: 1150,
            totalEnrollments: 78,
            rating: 4.7,
            thumbnail: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&h=600&fit=crop&crop=center',
            syllabus: {
                modules: [
                    {
                        title: 'أساسيات UX Design',
                        titleEn: 'UX Design Fundamentals',
                        lessons: ['User Research', 'Personas & User Journey', 'Information Architecture']
                    },
                    {
                        title: 'UI Design و Prototyping',
                        titleEn: 'UI Design & Prototyping',
                        lessons: ['Visual Design Principles', 'Figma Mastery', 'Interactive Prototypes']
                    }
                ]
            },
        },
    })

    // Business Courses (Category A)
    const course5 = await prisma.course.create({
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

    const course6 = await prisma.course.create({
        data: {
            title: 'Entrepreneurship & Business Strategy',
            titleAr: 'ريادة الأعمال والاستراتيجية التجارية',
            description: 'Learn how to start, grow, and scale a successful business in Egypt. From idea to IPO.',
            descriptionAr: 'تعلم كيفية بدء ونمو وتوسيع أعمال ناجحة في مصر. من الفكرة إلى الاكتتاب العام.',
            creatorId: creator7.id,
            category: 'CATEGORY_A',
            skillLevel: 'Intermediate',
            duration: 2100, // 35 hours
            language: 'ar',
            price: 200,
            status: ContentStatus.PUBLISHED,
            publishedAt: new Date(),
            totalViews: 680,
            totalEnrollments: 52,
            rating: 4.8,
            thumbnail: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=600&fit=crop&crop=center',
            syllabus: {
                modules: [
                    {
                        title: 'أساسيات ريادة الأعمال',
                        titleEn: 'Entrepreneurship Fundamentals',
                        lessons: ['تطوير الفكرة', 'دراسة الجدوى', 'خطة العمل']
                    },
                    {
                        title: 'النمو والتوسع',
                        titleEn: 'Growth & Scaling',
                        lessons: ['استراتيجيات النمو', 'التمويل', 'إدارة الفريق']
                    }
                ]
            },
        },
    })

    // Language Courses (Category A)
    const course7 = await prisma.course.create({
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

    const course8 = await prisma.course.create({
        data: {
            title: 'French Language Complete Course',
            titleAr: 'كورس اللغة الفرنسية الشامل',
            description: 'Learn French from zero to conversational level. Perfect for beginners with Egyptian teaching style.',
            descriptionAr: 'تعلم الفرنسية من الصفر إلى المستوى المحادثة. مثالي للمبتدئين بأسلوب تدريس مصري.',
            creatorId: creator8.id,
            category: 'CATEGORY_A',
            skillLevel: 'Beginner',
            duration: 2400, // 40 hours
            language: 'ar',
            price: 170,
            status: ContentStatus.PUBLISHED,
            publishedAt: new Date(),
            totalViews: 540,
            totalEnrollments: 43,
            rating: 4.6,
            thumbnail: 'https://images.unsplash.com/photo-1493836512294-502baa1986e2?w=800&h=600&fit=crop&crop=center',
            syllabus: {
                modules: [
                    {
                        title: 'الأساسيات الفرنسية',
                        titleEn: 'French Fundamentals',
                        lessons: ['الحروف والأصوات', 'التحيات والتعارف', 'الأرقام والوقت']
                    },
                    {
                        title: 'المحادثة والقواعد',
                        titleEn: 'Conversation & Grammar',
                        lessons: ['المحادثات اليومية', 'القواعد الأساسية', 'المفردات المهمة']
                    }
                ]
            },
        },
    })

    // Additional Popular Courses
    const course9 = await prisma.course.create({
        data: {
            title: 'Python Programming for Beginners',
            titleAr: 'برمجة Python للمبتدئين',
            description: 'Start your programming journey with Python. Learn the fundamentals and build real projects.',
            descriptionAr: 'ابدأ رحلتك في البرمجة مع Python. تعلم الأساسيات وابن مشاريع حقيقية.',
            creatorId: creator1.id,
            category: 'CATEGORY_A',
            skillLevel: 'Beginner',
            duration: 1800, // 30 hours
            language: 'ar',
            price: 160,
            status: ContentStatus.PUBLISHED,
            publishedAt: new Date(),
            totalViews: 920,
            totalEnrollments: 74,
            rating: 4.7,
            thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&h=600&fit=crop&crop=center',
            syllabus: {
                modules: [
                    {
                        title: 'أساسيات Python',
                        titleEn: 'Python Fundamentals',
                        lessons: ['Variables & Data Types', 'Control Structures', 'Functions']
                    },
                    {
                        title: 'مشاريع عملية',
                        titleEn: 'Practical Projects',
                        lessons: ['Calculator App', 'Web Scraper', 'Data Analysis Project']
                    }
                ]
            },
        },
    })

    const course10 = await prisma.course.create({
        data: {
            title: 'Adobe Photoshop & Graphic Design',
            titleAr: 'فوتوشوب والتصميم الجرافيكي',
            description: 'Master Adobe Photoshop and learn graphic design principles. Create stunning visuals and designs.',
            descriptionAr: 'إتقان أدوبي فوتوشوب وتعلم مبادئ التصميم الجرافيكي. أنشئ تصاميم ومرئيات مذهلة.',
            creatorId: creator5.id,
            category: 'CATEGORY_A',
            skillLevel: 'Beginner',
            duration: 2100, // 35 hours
            language: 'ar',
            price: 175,
            status: ContentStatus.PUBLISHED,
            publishedAt: new Date(),
            totalViews: 1020,
            totalEnrollments: 81,
            rating: 4.8,
            thumbnail: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&h=600&fit=crop&crop=center',
            syllabus: {
                modules: [
                    {
                        title: 'أساسيات Photoshop',
                        titleEn: 'Photoshop Fundamentals',
                        lessons: ['واجهة البرنامج', 'الطبقات والأدوات', 'التحديد والقص']
                    },
                    {
                        title: 'التصميم الجرافيكي',
                        titleEn: 'Graphic Design',
                        lessons: ['نظرية الألوان', 'Typography', 'تصميم الشعارات']
                    }
                ]
            },
        },
    })

    const course11 = await prisma.course.create({
        data: {
            title: 'E-commerce Business Setup',
            titleAr: 'إنشاء متجر إلكتروني ناجح',
            description: 'Learn how to start and grow a successful e-commerce business in Egypt and MENA region.',
            descriptionAr: 'تعلم كيفية بدء وتنمية أعمال تجارة إلكترونية ناجحة في مصر ومنطقة الشرق الأوسط.',
            creatorId: creator2.id,
            category: 'CATEGORY_A',
            skillLevel: 'Intermediate',
            duration: 1920, // 32 hours
            language: 'ar',
            price: 185,
            status: ContentStatus.PUBLISHED,
            publishedAt: new Date(),
            totalViews: 650,
            totalEnrollments: 58,
            rating: 4.7,
            thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop&crop=center',
            syllabus: {
                modules: [
                    {
                        title: 'أساسيات التجارة الإلكترونية',
                        titleEn: 'E-commerce Fundamentals',
                        lessons: ['اختيار المنتجات', 'بناء المتجر', 'طرق الدفع']
                    },
                    {
                        title: 'التسويق والنمو',
                        titleEn: 'Marketing & Growth',
                        lessons: ['التسويق الرقمي', 'خدمة العملاء', 'التوسع والنمو']
                    }
                ]
            },
        },
    })

    const course12 = await prisma.course.create({
        data: {
            title: 'German Language Intensive Course',
            titleAr: 'كورس اللغة الألمانية المكثف',
            description: 'Intensive German course for university applications and job opportunities in Germany.',
            descriptionAr: 'كورس ألماني مكثف لطلبات الجامعة وفرص العمل في ألمانيا.',
            creatorId: creator8.id,
            category: 'CATEGORY_A',
            skillLevel: 'Beginner',
            duration: 2700, // 45 hours
            language: 'ar',
            price: 190,
            status: ContentStatus.PUBLISHED,
            publishedAt: new Date(),
            totalViews: 420,
            totalEnrollments: 35,
            rating: 4.8,
            thumbnail: 'https://images.unsplash.com/photo-1527866959252-deab85ef7d1b?w=800&h=600&fit=crop&crop=center',
            syllabus: {
                modules: [
                    {
                        title: 'الألمانية للمبتدئين',
                        titleEn: 'German for Beginners',
                        lessons: ['الحروف والنطق', 'التحيات الأساسية', 'الأرقام والألوان']
                    },
                    {
                        title: 'القواعد والمحادثة',
                        titleEn: 'Grammar & Conversation',
                        lessons: ['قواعد الأفعال', 'المحادثات اليومية', 'كتابة الرسائل']
                    }
                ]
            },
        },
    })

    // === COMPREHENSIVE DEMO LESSONS ===
    await prisma.lesson.createMany({
        data: [
            // Course 1: Web Development lessons
            {
                courseId: course1.id,
                title: 'Introduction to Web Development',
                titleAr: 'مقدمة في تطوير الويب',
                description: 'Overview of web development and career opportunities',
                descriptionAr: 'نظرة عامة على تطوير الويب والفرص المهنية',
                videoUrl: 'https://example.com/video1.mp4',
                duration: 900, // 15 minutes
                order: 1,
            },
            {
                courseId: course1.id,
                title: 'HTML Fundamentals',
                titleAr: 'أساسيات HTML',
                description: 'Learn HTML tags, elements, and structure',
                descriptionAr: 'تعلم علامات وعناصر وهيكل HTML',
                videoUrl: 'https://example.com/video2.mp4',
                duration: 1200, // 20 minutes
                order: 2,
            },
            {
                courseId: course1.id,
                title: 'CSS Styling and Layout',
                titleAr: 'تنسيق وتخطيط CSS',
                description: 'Master CSS for beautiful website styling',
                descriptionAr: 'إتقان CSS لتنسيق مواقع ويب جميلة',
                videoUrl: 'https://example.com/video3.mp4',
                duration: 1500, // 25 minutes
                order: 3,
            },
            
            // Course 2: Flutter lessons
            {
                courseId: course2.id,
                title: 'Flutter Setup and First App',
                titleAr: 'إعداد Flutter وأول تطبيق',
                description: 'Setting up Flutter development environment',
                descriptionAr: 'إعداد بيئة تطوير Flutter',
                videoUrl: 'https://example.com/flutter1.mp4',
                duration: 1800, // 30 minutes
                order: 1,
            },
            {
                courseId: course2.id,
                title: 'Dart Language Basics',
                titleAr: 'أساسيات لغة Dart',
                description: 'Learn Dart programming fundamentals',
                descriptionAr: 'تعلم أساسيات برمجة Dart',
                videoUrl: 'https://example.com/flutter2.mp4',
                duration: 2100, // 35 minutes
                order: 2,
            },
            
            // Course 3: Data Science lessons
            {
                courseId: course3.id,
                title: 'Python for Data Science Introduction',
                titleAr: 'مقدمة Python لعلوم البيانات',
                description: 'Getting started with Python for data analysis',
                descriptionAr: 'البدء مع Python لتحليل البيانات',
                videoUrl: 'https://example.com/datascience1.mp4',
                duration: 1800, // 30 minutes
                order: 1,
            },
            {
                courseId: course3.id,
                title: 'NumPy and Pandas Fundamentals',
                titleAr: 'أساسيات NumPy و Pandas',
                description: 'Essential libraries for data manipulation',
                descriptionAr: 'المكتبات الأساسية للتعامل مع البيانات',
                videoUrl: 'https://example.com/datascience2.mp4',
                duration: 2400, // 40 minutes
                order: 2,
            },
            
            // Course 4: UI/UX Design lessons
            {
                courseId: course4.id,
                title: 'Design Thinking Fundamentals',
                titleAr: 'أساسيات التفكير التصميمي',
                description: 'Understanding user-centered design approach',
                descriptionAr: 'فهم منهج التصميم المتمحور حول المستخدم',
                videoUrl: 'https://example.com/design1.mp4',
                duration: 1500, // 25 minutes
                order: 1,
            },
            {
                courseId: course4.id,
                title: 'User Research Methods',
                titleAr: 'طرق بحث المستخدم',
                description: 'Learn effective user research techniques',
                descriptionAr: 'تعلم تقنيات بحث المستخدم الفعالة',
                videoUrl: 'https://example.com/design2.mp4',
                duration: 1800, // 30 minutes
                order: 2,
            },
            
            // Course 5: Digital Marketing lessons
            {
                courseId: course5.id,
                title: 'Digital Marketing Overview',
                titleAr: 'نظرة عامة على التسويق الرقمي',
                description: 'Introduction to digital marketing strategies',
                descriptionAr: 'مقدمة في استراتيجيات التسويق الرقمي',
                videoUrl: 'https://example.com/marketing1.mp4',
                duration: 1200, // 20 minutes
                order: 1,
            },
            {
                courseId: course5.id,
                title: 'Facebook Ads Mastery',
                titleAr: 'إتقان إعلانات فيسبوك',
                description: 'Create effective Facebook advertising campaigns',
                descriptionAr: 'إنشاء حملات إعلانية فعالة على فيسبوك',
                videoUrl: 'https://example.com/marketing2.mp4',
                duration: 2100, // 35 minutes
                order: 2,
            },
        ],
    })
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
    console.log('📚 Created 3 comprehensive demo courses with lessons')
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
