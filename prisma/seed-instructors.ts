import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🧑‍🏫 Creating comprehensive instructor database...')

    // Password hash for all demo accounts
    const passwordHash = await bcrypt.hash('instructor123', 10)

    // 1. Ahmed Hassan - React & Frontend Expert
    const instructor1User = await prisma.user.upsert({
        where: { email: 'ahmed.hassan@edtech.eg' },
        update: {},
        create: {
            email: 'ahmed.hassan@edtech.eg',
            passwordHash,
            name: 'Ahmed Hassan',
            arabicName: 'أحمد حسن',
            role: 'CREATOR',
            bio: 'Senior React Developer with 8+ years of experience building scalable web applications. Former Facebook engineer, passionate about teaching modern JavaScript frameworks.',
            profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
            interests: 'React, JavaScript, Web Development, UI/UX',
            goals: 'Help developers master modern frontend technologies',
            emailVerified: new Date()
        }
    })

    const instructor1 = await prisma.creator.upsert({
        where: { userId: instructor1User.id },
        update: {},
        create: {
            userId: instructor1User.id,
            kycStatus: 'VERIFIED',
            expertise: 'React, JavaScript, TypeScript, Next.js, Redux, GraphQL',
            teachingGoals: 'Empowering developers to build modern, scalable web applications with React and the latest frontend technologies.',
            contractSigned: true,
            contractSignedAt: new Date(),
            totalEarnings: 15420.50,
            totalSubscribers: 1247,
            hourlyRate: 80.0,
            availableForMeetings: true,
            timezone: 'Africa/Cairo',
            languages: 'English, Arabic',
            meetingTypes: JSON.stringify([
                { type: 'CONSULTATION', duration: 30, price: 40 },
                { type: 'CODE_REVIEW', duration: 60, price: 80 },
                { type: 'CAREER_ADVICE', duration: 45, price: 60 },
                { type: 'MOCK_INTERVIEW', duration: 90, price: 120 }
            ]),
            certifications: JSON.stringify([
                {
                    name: 'AWS Certified Developer',
                    issuer: 'Amazon Web Services',
                    year: 2023,
                    credential: 'AWS-CDA-2023-001247'
                },
                {
                    name: 'React Advanced Patterns',
                    issuer: 'Meta (Facebook)',
                    year: 2022,
                    credential: 'META-REACT-2022-5689'
                },
                {
                    name: 'Google Cloud Professional',
                    issuer: 'Google Cloud',
                    year: 2023,
                    credential: 'GCP-PRO-2023-8842'
                }
            ]),
            socialLinks: JSON.stringify({
                github: 'https://github.com/ahmed-hassan-dev',
                linkedin: 'https://linkedin.com/in/ahmed-hassan-dev',
                twitter: 'https://twitter.com/ahmed_codes',
                youtube: 'https://youtube.com/@AhmedReactTutorials',
                website: 'https://ahmedhassan.dev'
            })
        }
    })

    // 2. Fatima Al-Zahra - UI/UX Design Expert
    const instructor2User = await prisma.user.upsert({
        where: { email: 'fatima.alzahra@edtech.eg' },
        update: {},
        create: {
            email: 'fatima.alzahra@edtech.eg',
            passwordHash,
            name: 'Fatima Al-Zahra',
            arabicName: 'فاطمة الزهراء',
            role: 'CREATOR',
            bio: 'Award-winning UI/UX Designer with 6+ years creating beautiful, user-centered digital experiences. Adobe Certified Expert and design mentor.',
            profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
            interests: 'UI/UX Design, Product Design, Design Systems, User Research',
            goals: 'Teach designers to create impactful, user-friendly digital products',
            emailVerified: new Date()
        }
    })

    const instructor2 = await prisma.creator.upsert({
        where: { userId: instructor2User.id },
        update: {},
        create: {
            userId: instructor2User.id,
            kycStatus: 'VERIFIED',
            expertise: 'UI/UX Design, Figma, Adobe Creative Suite, User Research, Prototyping, Design Systems',
            teachingGoals: 'Helping aspiring designers master the art and science of user experience design.',
            contractSigned: true,
            contractSignedAt: new Date(),
            totalEarnings: 12890.75,
            totalSubscribers: 892,
            hourlyRate: 75.0,
            availableForMeetings: true,
            timezone: 'Africa/Cairo',
            languages: 'English, Arabic, French',
            meetingTypes: JSON.stringify([
                { type: 'CONSULTATION', duration: 45, price: 56.25 },
                { type: 'COURSE_HELP', duration: 60, price: 75 },
                { type: 'CAREER_ADVICE', duration: 30, price: 37.5 },
                { type: 'CODE_REVIEW', duration: 90, price: 112.5 } // Portfolio review
            ]),
            certifications: JSON.stringify([
                {
                    name: 'Adobe Certified Expert - XD',
                    issuer: 'Adobe',
                    year: 2023,
                    credential: 'ACE-XD-2023-7854'
                },
                {
                    name: 'Google UX Design Certificate',
                    issuer: 'Google Career Certificates',
                    year: 2022,
                    credential: 'GOOGLE-UX-2022-4521'
                },
                {
                    name: 'Figma Advanced Certification',
                    issuer: 'Figma Academy',
                    year: 2023,
                    credential: 'FIGMA-ADV-2023-1247'
                }
            ]),
            socialLinks: JSON.stringify({
                dribbble: 'https://dribbble.com/fatima-designs',
                behance: 'https://behance.net/fatima-alzahra',
                linkedin: 'https://linkedin.com/in/fatima-alzahra-ux',
                instagram: 'https://instagram.com/fatima.designs',
                website: 'https://fatima-designs.com'
            })
        }
    })

    // 3. Mohamed Saeed - Backend & DevOps Specialist
    const instructor3User = await prisma.user.upsert({
        where: { email: 'mohamed.saeed@edtech.eg' },
        update: {},
        create: {
            email: 'mohamed.saeed@edtech.eg',
            passwordHash,
            name: 'Mohamed Saeed',
            arabicName: 'محمد سعيد',
            role: 'CREATOR',
            bio: 'Senior Backend Engineer and DevOps Expert with 10+ years experience. Former CTO at multiple startups, specialized in scalable architectures and cloud infrastructure.',
            profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
            interests: 'Backend Development, DevOps, Cloud Computing, System Architecture',
            goals: 'Guide developers in building robust, scalable backend systems',
            emailVerified: new Date()
        }
    })

    const instructor3 = await prisma.creator.upsert({
        where: { userId: instructor3User.id },
        update: {},
        create: {
            userId: instructor3User.id,
            kycStatus: 'VERIFIED',
            expertise: 'Node.js, Python, Docker, Kubernetes, AWS, CI/CD, Microservices, Database Design',
            teachingGoals: 'Teaching developers to architect and deploy production-ready backend systems.',
            contractSigned: true,
            contractSignedAt: new Date(),
            totalEarnings: 18750.25,
            totalSubscribers: 1456,
            hourlyRate: 95.0,
            availableForMeetings: true,
            timezone: 'Africa/Cairo',
            languages: 'English, Arabic',
            meetingTypes: JSON.stringify([
                { type: 'CONSULTATION', duration: 60, price: 95 },
                { type: 'CODE_REVIEW', duration: 90, price: 142.5 },
                { type: 'CAREER_ADVICE', duration: 45, price: 71.25 },
                { type: 'MENTORSHIP', duration: 120, price: 190 }
            ]),
            certifications: JSON.stringify([
                {
                    name: 'AWS Solutions Architect Professional',
                    issuer: 'Amazon Web Services',
                    year: 2023,
                    credential: 'AWS-SAP-2023-9876'
                },
                {
                    name: 'Certified Kubernetes Administrator',
                    issuer: 'Cloud Native Computing Foundation',
                    year: 2022,
                    credential: 'CKA-2022-5432'
                },
                {
                    name: 'Google Cloud Professional DevOps',
                    issuer: 'Google Cloud',
                    year: 2023,
                    credential: 'GCP-DEVOPS-2023-7890'
                }
            ]),
            socialLinks: JSON.stringify({
                github: 'https://github.com/mohamed-devops',
                linkedin: 'https://linkedin.com/in/mohamed-saeed-devops',
                medium: 'https://medium.com/@mohamed-backend',
                youtube: 'https://youtube.com/@MohamedDevOpsTips',
                website: 'https://mohamed-devops.tech'
            })
        }
    })

    // 4. Sarah Ahmed - Data Science & AI Expert
    const instructor4User = await prisma.user.upsert({
        where: { email: 'sarah.ahmed@edtech.eg' },
        update: {},
        create: {
            email: 'sarah.ahmed@edtech.eg',
            passwordHash,
            name: 'Dr. Sarah Ahmed',
            arabicName: 'د. سارة أحمد',
            role: 'CREATOR',
            bio: 'PhD in Computer Science, Data Science Lead with 7+ years in AI/ML. Former Google AI researcher, published author in machine learning journals.',
            profileImage: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face',
            interests: 'Machine Learning, Data Science, AI, Python, Deep Learning',
            goals: 'Democratize AI education and make complex concepts accessible',
            emailVerified: new Date()
        }
    })

    const instructor4 = await prisma.creator.upsert({
        where: { userId: instructor4User.id },
        update: {},
        create: {
            userId: instructor4User.id,
            kycStatus: 'VERIFIED',
            expertise: 'Python, Machine Learning, Deep Learning, TensorFlow, PyTorch, Data Analytics, Statistics',
            teachingGoals: 'Empowering students to harness the power of data and artificial intelligence.',
            contractSigned: true,
            contractSignedAt: new Date(),
            totalEarnings: 22340.80,
            totalSubscribers: 1893,
            hourlyRate: 110.0,
            availableForMeetings: true,
            timezone: 'Africa/Cairo',
            languages: 'English, Arabic',
            meetingTypes: JSON.stringify([
                { type: 'CONSULTATION', duration: 60, price: 110 },
                { type: 'CODE_REVIEW', duration: 90, price: 165 },
                { type: 'CAREER_ADVICE', duration: 45, price: 82.5 },
                { type: 'MENTORSHIP', duration: 120, price: 220 }
            ]),
            certifications: JSON.stringify([
                {
                    name: 'TensorFlow Developer Certificate',
                    issuer: 'Google',
                    year: 2023,
                    credential: 'TF-DEV-2023-1122'
                },
                {
                    name: 'AWS Certified Machine Learning',
                    issuer: 'Amazon Web Services',
                    year: 2022,
                    credential: 'AWS-ML-2022-8899'
                },
                {
                    name: 'PhD Computer Science',
                    issuer: 'Cairo University',
                    year: 2020,
                    credential: 'PhD-CS-2020-CAIRO'
                }
            ]),
            socialLinks: JSON.stringify({
                github: 'https://github.com/sarah-ai-researcher',
                linkedin: 'https://linkedin.com/in/dr-sarah-ahmed-ai',
                scholar: 'https://scholar.google.com/citations?user=sarah_ahmed',
                medium: 'https://medium.com/@sarah-ai-insights',
                website: 'https://sarahahmed.ai'
            })
        }
    })

    // 5. Omar Khaled - Mobile Development Expert
    const instructor5User = await prisma.user.upsert({
        where: { email: 'omar.khaled@edtech.eg' },
        update: {},
        create: {
            email: 'omar.khaled@edtech.eg',
            passwordHash,
            name: 'Omar Khaled',
            arabicName: 'عمر خالد',
            role: 'CREATOR',
            bio: 'Mobile Development Specialist with 6+ years building iOS and Android apps. Flutter expert and former Uber mobile engineer.',
            profileImage: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=400&h=400&fit=crop&crop=face',
            interests: 'Mobile Development, Flutter, React Native, iOS, Android',
            goals: 'Help developers build amazing mobile experiences',
            emailVerified: new Date()
        }
    })

    const instructor5 = await prisma.creator.upsert({
        where: { userId: instructor5User.id },
        update: {},
        create: {
            userId: instructor5User.id,
            kycStatus: 'VERIFIED',
            expertise: 'Flutter, React Native, iOS Swift, Android Kotlin, Mobile UI/UX, App Store Optimization',
            teachingGoals: 'Guiding developers to create high-quality, performant mobile applications.',
            contractSigned: true,
            contractSignedAt: new Date(),
            totalEarnings: 14250.60,
            totalSubscribers: 1089,
            hourlyRate: 85.0,
            availableForMeetings: true,
            timezone: 'Africa/Cairo',
            languages: 'English, Arabic',
            meetingTypes: JSON.stringify([
                { type: 'CONSULTATION', duration: 60, price: 85 },
                { type: 'CODE_REVIEW', duration: 75, price: 106.25 },
                { type: 'CAREER_ADVICE', duration: 45, price: 63.75 },
                { type: 'MOCK_INTERVIEW', duration: 90, price: 127.5 }
            ]),
            certifications: JSON.stringify([
                {
                    name: 'Google Flutter Certified',
                    issuer: 'Google Developers',
                    year: 2023,
                    credential: 'FLUTTER-2023-5566'
                },
                {
                    name: 'iOS App Development',
                    issuer: 'Apple Developer Academy',
                    year: 2022,
                    credential: 'IOS-DEV-2022-3344'
                },
                {
                    name: 'Android Associate Developer',
                    issuer: 'Google Developers',
                    year: 2022,
                    credential: 'ANDROID-2022-7788'
                }
            ]),
            socialLinks: JSON.stringify({
                github: 'https://github.com/omar-mobile-dev',
                linkedin: 'https://linkedin.com/in/omar-khaled-mobile',
                medium: 'https://medium.com/@omar-mobile-tips',
                youtube: 'https://youtube.com/@OmarMobileDev',
                website: 'https://omar-mobile.dev'
            })
        }
    })

    console.log('✅ Created 5 comprehensive instructor profiles')

    // Add instructor availability schedules
    const instructors = [instructor1, instructor2, instructor3, instructor4, instructor5]
    
    for (let i = 0; i < instructors.length; i++) {
        const instructor = instructors[i]
        // Create weekly availability (Monday to Friday, 9 AM to 6 PM Cairo time)
        for (let day = 1; day <= 5; day++) { // Monday to Friday
            await prisma.instructorAvailability.create({
                data: {
                    creatorId: instructor.id,
                    dayOfWeek: day,
                    startTime: '09:00',
                    endTime: '18:00',
                    timezone: 'Africa/Cairo',
                    isAvailable: true
                }
            })
        }
        
        // Add some weekend availability for instructors 1 and 3
        if (i === 0 || i === 2) {
            await prisma.instructorAvailability.create({
                data: {
                    creatorId: instructor.id,
                    dayOfWeek: 6, // Saturday
                    startTime: '10:00',
                    endTime: '14:00',
                    timezone: 'Africa/Cairo',
                    isAvailable: true
                }
            })
        }
    }

    console.log('✅ Added instructor availability schedules')

    // Create some sample courses for the new instructors
    const courses = [
        {
            creatorId: instructor1.id,
            title: 'Complete React Masterclass 2024',
            titleAr: 'دورة ريكت الشاملة 2024',
            description: 'Master React from fundamentals to advanced patterns. Build real-world projects, learn hooks, context, performance optimization, and deploy to production.',
            descriptionAr: 'أتقن ريكت من الأساسيات إلى الأنماط المتقدمة. ابني مشاريع حقيقية، تعلم الهوكس والكونتكست وتحسين الأداء والنشر للإنتاج.',
            category: 'CATEGORY_A',
            skillLevel: 'Intermediate',
            duration: 720, // 12 hours
            language: 'English,Arabic',
            price: 299,
            status: 'PUBLISHED' as const,
            publishedAt: new Date(),
            thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop',
            rating: 4.9,
            totalEnrollments: 234,
            totalViews: 1247,
            syllabus: JSON.stringify([
                {
                    title: 'React Fundamentals',
                    titleAr: 'أساسيات ريكت',
                    lessons: ['Introduction to React', 'Components and JSX', 'Props and State', 'Event Handling']
                },
                {
                    title: 'Advanced React Patterns',
                    titleAr: 'أنماط ريكت المتقدمة',
                    lessons: ['Custom Hooks', 'Context API', 'Higher-Order Components', 'Render Props']
                },
                {
                    title: 'Performance Optimization',
                    titleAr: 'تحسين الأداء',
                    lessons: ['React.memo', 'useMemo and useCallback', 'Code Splitting', 'Lazy Loading']
                }
            ])
        },
        {
            creatorId: instructor2.id,
            title: 'UI/UX Design Fundamentals',
            titleAr: 'أساسيات تصميم واجهات المستخدم والتجربة',
            description: 'Learn the complete UI/UX design process from research to prototyping. Master Figma, design systems, and user-centered design principles.',
            descriptionAr: 'تعلم العملية الكاملة لتصميم UI/UX من البحث إلى النماذج الأولية. أتقن فيجما وأنظمة التصميم ومبادئ التصميم المتمحور حول المستخدم.',
            category: 'CATEGORY_A',
            skillLevel: 'Beginner',
            duration: 480, // 8 hours
            language: 'English,Arabic',
            price: 249,
            status: 'PUBLISHED' as const,
            publishedAt: new Date(),
            thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=450&fit=crop',
            rating: 4.8,
            totalEnrollments: 189,
            totalViews: 892,
            syllabus: JSON.stringify([
                {
                    title: 'Design Thinking',
                    titleAr: 'التفكير التصميمي',
                    lessons: ['User Research', 'Problem Definition', 'Ideation', 'User Personas']
                },
                {
                    title: 'UI Design Principles',
                    titleAr: 'مبادئ تصميم الواجهات',
                    lessons: ['Typography', 'Color Theory', 'Layout & Grid', 'Visual Hierarchy']
                },
                {
                    title: 'Prototyping & Testing',
                    titleAr: 'النماذج الأولية والاختبار',
                    lessons: ['Wireframing', 'High-fidelity Prototypes', 'Usability Testing', 'Design Handoff']
                }
            ])
        }
    ]

    for (const courseData of courses) {
        await prisma.course.create({ data: courseData })
    }

    console.log('✅ Created sample courses for new instructors')

    console.log('🎉 Comprehensive instructor database created successfully!')
    console.log('')
    console.log('👥 Created Instructors:')
    console.log('   1. Ahmed Hassan - React & Frontend Expert (ahmed.hassan@edtech.eg)')
    console.log('   2. Dr. Fatima Al-Zahra - UI/UX Design Expert (fatima.alzahra@edtech.eg)')
    console.log('   3. Mohamed Saeed - Backend & DevOps Specialist (mohamed.saeed@edtech.eg)')
    console.log('   4. Dr. Sarah Ahmed - Data Science & AI Expert (sarah.ahmed@edtech.eg)')
    console.log('   5. Omar Khaled - Mobile Development Expert (omar.khaled@edtech.eg)')
    console.log('')
    console.log('🔑 All instructor accounts use password: instructor123')
    console.log('')
    console.log('✨ Features Available:')
    console.log('   ✅ Detailed instructor profiles with certifications')
    console.log('   ✅ Meeting booking system with different consultation types')
    console.log('   ✅ Instructor availability schedules')
    console.log('   ✅ Social media links and portfolios')
    console.log('   ✅ Verified KYC status and professional credentials')
    console.log('   ✅ Ready for follow/unfollow functionality')
    console.log('   ✅ Integrated with existing messaging system')
}

main()
    .catch((e) => {
        console.error('❌ Error creating instructor database:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })