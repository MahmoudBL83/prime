import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Course categories with their Arabic translations
const CATEGORIES = [
    {
        en: 'Programming & Development',
        ar: 'البرمجة والتطوير',
        id: 'PROGRAMMING'
    },
    {
        en: 'Design & Creative',
        ar: 'التصميم والإبداع',
        id: 'DESIGN'
    },
    {
        en: 'Business & Entrepreneurship',
        ar: 'الأعمال وريادة الأعمال',
        id: 'BUSINESS'
    },
    {
        en: 'Marketing & Sales',
        ar: 'التسويق والمبيعات',
        id: 'MARKETING'
    },
    {
        en: 'Language Learning',
        ar: 'تعلم اللغات',
        id: 'LANGUAGE'
    },
    {
        en: 'Data Science & AI',
        ar: 'علم البيانات والذكاء الاصطناعي',
        id: 'DATA_SCIENCE'
    },
    {
        en: 'Personal Development',
        ar: 'التطوير الشخصي',
        id: 'PERSONAL_DEVELOPMENT'
    },
    {
        en: 'Photography & Video',
        ar: 'التصوير الفوتوغرافي والفيديو',
        id: 'PHOTOGRAPHY'
    },
    {
        en: 'Music & Audio',
        ar: 'الموسيقى والصوت',
        id: 'MUSIC'
    },
    {
        en: 'Health & Fitness',
        ar: 'الصحة واللياقة',
        id: 'HEALTH'
    }
]

// Skill levels with their Arabic translations
const SKILL_LEVELS = [
    { en: 'Beginner', ar: 'مبتدئ' },
    { en: 'Intermediate', ar: 'متوسط' },
    { en: 'Advanced', ar: 'متقدم' }
]

// High-quality course data with engaging titles and descriptions
const COURSE_DATA = [
    {
        title: 'Complete Web Development Bootcamp 2024',
        titleAr: 'معسكر تدريب تطوير الويب الشامل 2024',
        description: 'Master web development from scratch. Learn HTML, CSS, JavaScript, React, Node.js, MongoDB, and more. Build real-world projects and deploy them to the cloud.',
        descriptionAr: 'أتقن تطوير الويب من الصفر. تعلم HTML و CSS و JavaScript و React و Node.js و MongoDB والمزيد. قم ببناء مشاريع واقعية ونشرها على السحابة.',
        category: 'PROGRAMMING',
        skillLevel: 'Beginner',
        duration: 480,
        price: 299,
        thumbnail: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=450&fit=crop'
    },
    {
        title: 'React Native Mobile App Development',
        titleAr: 'تطوير تطبيقات الموبايل بـ React Native',
        description: 'Build professional mobile applications for iOS and Android using React Native. Master navigation, state management, native modules, and app store deployment.',
        descriptionAr: 'ابني تطبيقات محمولة احترافية لنظامي iOS و Android باستخدام React Native. أتقن التنقل وإدارة الحالة والوحدات الأصلية ونشر التطبيقات.',
        category: 'PROGRAMMING',
        skillLevel: 'Intermediate',
        duration: 360,
        price: 249,
        thumbnail: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=450&fit=crop'
    },
    {
        title: 'UI/UX Design Masterclass: From Beginner to Pro',
        titleAr: 'دورة تصميم واجهة وتجربة المستخدم الشاملة: من المبتدئ إلى المحترف',
        description: 'Learn the fundamentals of UI/UX design, user research, wireframing, prototyping, and design thinking. Master Figma and create stunning designs.',
        descriptionAr: 'تعلم أساسيات تصميم واجهة وتجربة المستخدم وبحث المستخدم والإطارات الشبكية والنماذج الأولية والتفكير التصميمي. أتقن Figma وأنشئ تصاميم مذهلة.',
        category: 'DESIGN',
        skillLevel: 'Beginner',
        duration: 300,
        price: 199,
        thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=450&fit=crop'
    },
    {
        title: 'Digital Marketing Complete Course',
        titleAr: 'دورة التسويق الرقمي الشاملة',
        description: 'Master digital marketing strategies including SEO, social media marketing, content marketing, email marketing, and Google Ads. Learn to create campaigns that convert.',
        descriptionAr: 'أتقن استراتيجيات التسويق الرقمي بما في ذلك تحسين محركات البحث والتسويق عبر وسائل التواصل الاجتماعي وتسويق المحتوى والتسويق الإلكتروني وإعلانات جوجل. تعلم إنشاء حملات تحقق التحويلات.',
        category: 'MARKETING',
        skillLevel: 'Intermediate',
        duration: 420,
        price: 279,
        thumbnail: 'https://images.unsplash.com/photo-1557838923-2985c318be48?w=800&h=450&fit=crop'
    },
    {
        title: 'Business Strategy for Entrepreneurs',
        titleAr: 'استراتيجية الأعمال لرواد الأعمال',
        description: 'Learn how to build a successful business from the ground up. Master business planning, market analysis, financial modeling, and growth strategies.',
        descriptionAr: 'تعلم كيفية بناء عمل ناجح من الصفر. أتقن تخطيط الأعمال وتحليل السوق والنمذجة المالية واستراتيجيات النمو.',
        category: 'BUSINESS',
        skillLevel: 'Intermediate',
        duration: 360,
        price: 349,
        thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=450&fit=crop'
    },
    {
        title: 'Complete English Language Course',
        titleAr: 'دورة اللغة الإنجليزية الشاملة',
        description: 'Master English grammar, vocabulary, pronunciation, and conversation skills. Perfect for beginners and intermediate learners who want to become fluent.',
        descriptionAr: 'أتقن قواعد اللغة الإنجليزية والمفردات والنطق ومهارات المحادثة. مثالي للمبتدئين ومتعلمي المستوى المتوسط الذين يرغبون في إتقان اللغة.',
        category: 'LANGUAGE',
        skillLevel: 'Beginner',
        duration: 600,
        price: 199,
        thumbnail: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=450&fit=crop'
    },
    {
        title: 'Data Science and Machine Learning Bootcamp',
        titleAr: 'معسكر تدريب علم البيانات والتعلم الآلي',
        description: 'Learn data science from scratch. Master Python, pandas, NumPy, Matplotlib, scikit-learn, TensorFlow, and build real-world machine learning models.',
        descriptionAr: 'تعلم علم البيانات من الصفر. أتقن Python و pandas و NumPy و Matplotlib و scikit-learn و TensorFlow وابني نماذج تعلم آلي واقعية.',
        category: 'DATA_SCIENCE',
        skillLevel: 'Intermediate',
        duration: 540,
        price: 399,
        thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop'
    },
    {
        title: 'Personal Development and Productivity Masterclass',
        titleAr: 'دورة التطوير الشخصي والإنتاجية الشاملة',
        description: 'Transform your life with proven strategies for goal setting, time management, habit formation, and personal growth. Become the best version of yourself.',
        descriptionAr: 'حول حياتك باستراتيجيات مثبتة لتحديد الأهداف وإدارة الوقت وتكوين العادات والنمو الشخصي. كن أفضل نسخة من نفسك.',
        category: 'PERSONAL_DEVELOPMENT',
        skillLevel: 'Beginner',
        duration: 240,
        price: 149,
        thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=450&fit=crop'
    },
    {
        title: 'Professional Photography: From Beginner to Pro',
        titleAr: 'التصوير الاحترافي: من المبتدئ إلى المحترف',
        description: 'Master the art of photography. Learn camera settings, composition, lighting, editing, and post-processing. Build a portfolio that stands out.',
        descriptionAr: 'أتقن فن التصوير الفوتوغرافي. تعلم إعدادات الكاميرا والتكوين والإضاءة والتحرير والمعالجة اللاحقة. ابني معرض أعمال يلفت الانتباه.',
        category: 'PHOTOGRAPHY',
        skillLevel: 'Beginner',
        duration: 360,
        price: 299,
        thumbnail: 'https://images.unsplash.com/photo-1542038784456-1c8e0b5d3c1c?w=800&h=450&fit=crop'
    },
    {
        title: 'Music Production Complete Course',
        titleAr: 'دورة إنتاج الموسيقى الشاملة',
        description: 'Learn music production from scratch. Master digital audio workstations, sound design, mixing, mastering, and music theory. Create professional tracks.',
        descriptionAr: 'تعلم إنتاج الموسيقى من الصفر. أتقن محطات العمل الصوتية الرقمية وتصميم الصوت والميكس والماسترينج ونظرية الموسيقى. أنشئ مقاطع احترافية.',
        category: 'MUSIC',
        skillLevel: 'Beginner',
        duration: 480,
        price: 349,
        thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=450&fit=crop'
    },
    {
        title: 'Complete Fitness and Nutrition Guide',
        titleAr: 'دليل اللياقة البدنية والتغذية الشامل',
        description: 'Transform your body and health with comprehensive fitness programs and nutrition guidance. Learn workout routines, meal planning, and lifestyle changes.',
        descriptionAr: 'حول جسمك وصحتك ببرامج لياقة شاملة وإرشادات تغذية. تعلم روتين التمارين وتخطيط الوجبات والتغييرات في نمط الحياة.',
        category: 'HEALTH',
        skillLevel: 'Beginner',
        duration: 300,
        price: 199,
        thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=450&fit=crop'
    },
    {
        title: 'Advanced JavaScript and React Development',
        titleAr: 'تطوير JavaScript و React المتقدم',
        description: 'Take your JavaScript skills to the next level. Master advanced concepts, React patterns, state management, performance optimization, and testing.',
        descriptionAr: 'ارفع مستوى مهاراتك في JavaScript. أتقن المفاهيم المتقدمة وأنماط React وإدارة الحالة وتحسين الأداء والاختبار.',
        category: 'PROGRAMMING',
        skillLevel: 'Advanced',
        duration: 420,
        price: 349,
        thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&h=450&fit=crop'
    },
    {
        title: 'Graphic Design Mastery with Adobe Creative Suite',
        titleAr: 'إتقان التصميم الجرافيكي مع Adobe Creative Suite',
        description: 'Master graphic design using industry-standard tools. Learn Photoshop, Illustrator, InDesign, and create professional designs for print and digital media.',
        descriptionAr: 'أتقن التصميم الجرافيكي باستخدام أدوات الصناعة القياسية. تعلم Photoshop و Illustrator و InDesign وأنشئ تصاميم احترافية للطباعة والوسائط الرقمية.',
        category: 'DESIGN',
        skillLevel: 'Intermediate',
        duration: 480,
        price: 299,
        thumbnail: 'https://images.unsplash.com/photo-1568214379698-8aeb8c6c6fac?w=800&h=450&fit=crop'
    },
    {
        title: 'Social Media Marketing Strategy',
        titleAr: 'استراتيجية التسويق عبر وسائل التواصل الاجتماعي',
        description: 'Master social media marketing across all major platforms. Learn content strategy, community management, paid advertising, and analytics.',
        descriptionAr: 'أتقن التسويق عبر وسائل التواصل الاجتماعي عبر جميع المنصات الرئيسية. تعلم استراتيجية المحتوى وإدارة المجتمع والإعلانات المدفوعة والتحليلات.',
        category: 'MARKETING',
        skillLevel: 'Intermediate',
        duration: 300,
        price: 249,
        thumbnail: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&h=450&fit=crop'
    },
    {
        title: 'Financial Planning and Investment',
        titleAr: 'التخطيط المالي والاستثمار',
        description: 'Learn to manage your finances and build wealth. Master budgeting, saving, investing in stocks, real estate, and retirement planning.',
        descriptionAr: 'تعلم إدارة أموالك وبناء الثروة. أتقن الميزانية والادخار والاستثمار في الأسهم والعقارات والتخطيط للتقاعد.',
        category: 'BUSINESS',
        skillLevel: 'Intermediate',
        duration: 360,
        price: 299,
        thumbnail: 'https://images.unsplash.com/photo-1554224154-260325b0536c?w=800&h=450&fit=crop'
    },
    {
        title: 'Spanish Language Complete Course',
        titleAr: 'دورة اللغة الإسبانية الشاملة',
        description: 'Learn Spanish from beginner to advanced level. Master grammar, vocabulary, pronunciation, and conversation skills. Immerse yourself in the culture.',
        descriptionAr: 'تعلم اللغة الإسبانية من المستوى المبتدئ إلى المتقدم. أتقن القواعد والمفردات والنطق ومهارات المحادثة. انغمس في الثقافة.',
        category: 'LANGUAGE',
        skillLevel: 'Beginner',
        duration: 540,
        price: 249,
        thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=450&fit=crop'
    },
    {
        title: 'Python for Data Science and Automation',
        titleAr: 'Python لعلم البيانات والأتمتة',
        description: 'Master Python programming for data science and automation. Learn pandas, NumPy, automation scripts, web scraping, and data visualization.',
        descriptionAr: 'أتقن برمجة Python لعلم البيانات والأتمتة. تعلم pandas و NumPy ونصوص الأتمتة وكشط الويب وتصور البيانات.',
        category: 'DATA_SCIENCE',
        skillLevel: 'Intermediate',
        duration: 420,
        price: 299,
        thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=450&fit=crop'
    },
    {
        title: 'Mindfulness and Meditation Masterclass',
        titleAr: 'دورة اليقظة الذهنية والتأمل الشاملة',
        description: 'Transform your life with mindfulness and meditation. Learn stress reduction, focus improvement, emotional regulation, and inner peace techniques.',
        descriptionAr: 'حول حياتك باليقظة الذهنية والتأمل. تعلم تقنيات تقليل التوتر وتحسين التركيز والتنظيم العاطفي والسلام الداخلي.',
        category: 'PERSONAL_DEVELOPMENT',
        skillLevel: 'Beginner',
        duration: 180,
        price: 149,
        thumbnail: 'https://images.unsplash.com/photo-1506126613408-cca07d5b1561?w=800&h=450&fit=crop'
    },
    {
        title: 'Portrait Photography Masterclass',
        titleAr: 'دورة التصوير الشخصي الشاملة',
        description: 'Master the art of portrait photography. Learn posing, lighting, composition, and editing techniques to create stunning portraits.',
        descriptionAr: 'أتقن فن التصوير الشخصي. تعلم الوضعيات والإضاءة والتكوين وتقنيات التحرير لإنشاء صور شخصية مذهلة.',
        category: 'PHOTOGRAPHY',
        skillLevel: 'Intermediate',
        duration: 300,
        price: 249,
        thumbnail: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&h=450&fit=crop'
    },
    {
        title: 'Electronic Music Production',
        titleAr: 'إنتاج الموسيقى الإلكترونية',
        description: 'Learn to create electronic music from scratch. Master synthesizers, drum machines, MIDI controllers, and digital audio workstations.',
        descriptionAr: 'تعلم إنشاء الموسيقى الإلكترونية من الصفر. أتقن أجهزة المركبات وآلات الطبول ووحدات التحكم MIDI ومحطات العمل الصوتية الرقمية.',
        category: 'MUSIC',
        skillLevel: 'Intermediate',
        duration: 360,
        price: 299,
        thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=450&fit=crop'
    },
    {
        title: 'Yoga and Mindfulness for Beginners',
        titleAr: 'اليوغا واليقظة الذهنية للمبتدئين',
        description: 'Start your journey to wellness with yoga and mindfulness. Learn basic poses, breathing techniques, meditation, and stress management.',
        descriptionAr: 'ابدأ رحلتك نحو العافية مع اليوغا واليقظة الذهنية. تعلم الوضعيات الأساسية وتقنيات التنفس والتأمل وإدارة التوتر.',
        category: 'HEALTH',
        skillLevel: 'Beginner',
        duration: 240,
        price: 149,
        thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=450&fit=crop'
    }
]

async function generateDemoCourses() {
    try {
        console.log('🚀 Generating demo courses...')

        // Find or create demo instructors
        const instructors = await getOrCreateInstructors()

        // Create courses
        const createdCourses = []
        for (const courseData of COURSE_DATA) {
            const instructor = instructors[Math.floor(Math.random() * instructors.length)]

            const course = await prisma.course.create({
                data: {
                    title: courseData.title,
                    titleAr: courseData.titleAr,
                    description: courseData.description,
                    descriptionAr: courseData.descriptionAr,
                    thumbnail: courseData.thumbnail,
                    creatorId: instructor.id,
                    category: courseData.category,
                    skillLevel: courseData.skillLevel,
                    duration: courseData.duration,
                    language: 'Arabic,English',
                    price: courseData.price,
                    status: 'PUBLISHED',
                    publishedAt: new Date(),
                    syllabus: generateSyllabus(courseData.title, courseData.titleAr),
                    rating: Math.random() * 2 + 3.8, // Random rating between 3.8 and 5.8
                    totalViews: Math.floor(Math.random() * 5000) + 1000, // Random views between 1000 and 6000
                    totalEnrollments: Math.floor(Math.random() * 1000) + 100, // Random enrollments between 100 and 1100
                }
            })

            // Create 3-5 lessons for each course
            const lessonCount = Math.floor(Math.random() * 3) + 3
            for (let i = 0; i < lessonCount; i++) {
                await prisma.lesson.create({
                    data: {
                        courseId: course.id,
                        title: `Lesson ${i + 1}: ${generateLessonTitle(courseData.title)}`,
                        titleAr: `الدرس ${i + 1}: ${generateLessonTitle(courseData.titleAr)}`,
                        description: `Comprehensive lesson covering key concepts in ${courseData.title}`,
                        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                        duration: Math.floor(Math.random() * 30) + 15, // Random duration between 15 and 45 minutes
                        order: i
                    }
                })
            }

            createdCourses.push(course)
            console.log(`✅ Created course: ${course.titleAr} (${course.title})`)
        }

        console.log(`\n🎉 Successfully created ${createdCourses.length} demo courses!`)
        console.log('\n📚 Course Summary:')
        createdCourses.forEach(course => {
            console.log(`   • ${course.titleAr} (${course.category}) - ${course.skillLevel}`)
        })

    } catch (error) {
        console.error('❌ Error generating demo courses:', error)
    } finally {
        await prisma.$disconnect()
    }
}

async function getOrCreateInstructors() {
    const instructorEmails = [
        'instructor1@example.com',
        'instructor2@example.com',
        'instructor3@example.com'
    ]

    const instructors = []
    const instructorNames = [
        { en: 'Ahmed Hassan', ar: 'أحمد حسن' },
        { en: 'Sarah Johnson', ar: 'سارة جونسون' },
        { en: 'Mohamed Ali', ar: 'محمد علي' }
    ]

    for (let i = 0; i < instructorEmails.length; i++) {
        let user = await prisma.user.findFirst({
            where: { email: instructorEmails[i] }
        })

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: instructorEmails[i],
                    passwordHash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
                    name: instructorNames[i].en,
                    arabicName: instructorNames[i].ar,
                    role: 'CREATOR',
                    profileImage: `/images/instructors/instructor${i + 1}.jpg`,
                    bio: `Experienced professional passionate about teaching and sharing knowledge with students.`,
                    onboardingCompleted: true
                }
            })
        }

        let creator = await prisma.creator.findFirst({
            where: { userId: user.id }
        })

        if (!creator) {
            creator = await prisma.creator.create({
                data: {
                    userId: user.id,
                    kycStatus: 'VERIFIED',
                    expertise: 'Expert in field with years of practical experience',
                    teachingGoals: 'Help students achieve their learning goals',
                    contractSigned: true,
                    contractSignedAt: new Date()
                }
            })
        }

        instructors.push(creator)
    }

    return instructors
}

function generateSyllabus(title: string, titleAr: string) {
    const modules = [
        { title: 'Introduction', titleAr: 'مقدمة' },
        { title: 'Fundamentals', titleAr: 'الأساسيات' },
        { title: 'Advanced Topics', titleAr: 'مواضيع متقدمة' },
        { title: 'Practical Applications', titleAr: 'تطبيقات عملية' }
    ]

    return JSON.stringify(modules.map(module => ({
        title: module.title,
        titleAr: module.titleAr,
        lessons: Math.floor(Math.random() * 3) + 2
    })))
}

function generateLessonTitle(courseTitle: string): string {
    const lessonTopics = [
        'Getting Started',
        'Core Concepts',
        'Best Practices',
        'Advanced Techniques',
        'Real-world Applications'
    ]

    return lessonTopics[Math.floor(Math.random() * lessonTopics.length)]
}

// Execute the script
generateDemoCourses()