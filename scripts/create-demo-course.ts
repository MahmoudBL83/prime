import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createDemoCourse() {
    try {
        // Check if demo course already exists
        const existingCourse = await prisma.course.findFirst({
            where: { title: { contains: 'Complete Digital Marketing Mastery' } }
        })

        if (existingCourse) {
            console.log('Demo course already exists!')
            console.log(`Course ID: ${existingCourse.id}`)
            console.log(`Access URL: http://localhost:3001/courses/${existingCourse.id}`)
            return
        }

        // Find any existing creator user and their creator profile
        const demoUser = await prisma.user.findFirst({
            where: { role: 'CREATOR' },
            include: { creator: true }
        })

        if (!demoUser) {
            console.log('No creator users found. Please create a creator user first.')
            return
        }

        let demoCreator = demoUser.creator

        // Create creator profile if it doesn't exist
        if (!demoCreator) {
            demoCreator = await prisma.creator.create({
                data: {
                    userId: demoUser.id,
                    kycStatus: 'VERIFIED',
                    expertise: 'Digital Marketing Expert',
                    teachingGoals: 'Help students master digital marketing skills',
                    contractSigned: true
                }
            })
        }

        // Create a comprehensive demo course
        const demoCourse = await prisma.course.create({
            data: {
                title: 'Complete Digital Marketing Mastery',
                titleAr: 'إتقان التسويق الرقمي الشامل',
                description: 'Master digital marketing from fundamentals to advanced strategies. Learn SEO, social media marketing, content creation, email marketing, and analytics. Perfect for beginners and professionals looking to enhance their digital marketing skills.',
                descriptionAr: 'اتقن التسويق الرقمي من الأساسيات إلى الاستراتيجيات المتقدمة. تعلم تحسين محركات البحث والتسويق عبر وسائل التواصل الاجتماعي وإنشاء المحتوى والتسويق الإلكتروني والتحليلات. مثالي للمبتدئين والمحترفين الذين يتطلعون إلى تعزيز مهاراتهم في التسويق الرقمي.',
                thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
                creatorId: demoCreator.id,
                category: 'CATEGORY_A',
                skillLevel: 'Intermediate',
                duration: 480, // 8 hours total
                language: 'ar',
                price: 299,
                syllabus: {
                    modules: [
                        {
                            title: 'Digital Marketing Fundamentals',
                            titleAr: 'أساسيات التسويق الرقمي',
                            lessons: 4
                        },
                        {
                            title: 'SEO & Content Strategy',
                            titleAr: 'تحسين محركات البحث واستراتيجية المحتوى',
                            lessons: 3
                        },
                        {
                            title: 'Social Media Marketing',
                            titleAr: 'التسويق عبر وسائل التواصل الاجتماعي',
                            lessons: 4
                        },
                        {
                            title: 'Analytics & Performance',
                            titleAr: 'التحليلات والأداء',
                            lessons: 2
                        }
                    ]
                },
                status: 'PUBLISHED'
            }
        })

        // Create comprehensive demo lessons with quizzes and resources
        const demoLessons = [
            // Module 1: Digital Marketing Fundamentals
            {
                title: 'Introduction to Digital Marketing',
                titleAr: 'مقدمة في التسويق الرقمي',
                description: 'Understanding the digital marketing landscape, key channels, and how to build a comprehensive strategy.',
                descriptionAr: 'فهم مشهد التسويق الرقمي والقنوات الرئيسية وكيفية بناء استراتيجية شاملة.',
                order: 1,
                duration: 35,
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                courseId: demoCourse.id,
                resources: JSON.stringify([
                    {
                        title: 'Digital Marketing Strategy Template',
                        titleAr: 'قالب استراتيجية التسويق الرقمي',
                        type: 'pdf',
                        url: '#',
                        size: '2.5 MB'
                    },
                    {
                        title: 'Industry Statistics Report',
                        titleAr: 'تقرير إحصائيات الصناعة',
                        type: 'pdf',
                        url: '#',
                        size: '1.8 MB'
                    }
                ])
            },
            {
                title: 'Understanding Your Target Audience',
                titleAr: 'فهم جمهورك المستهدف',
                description: 'Learn how to research, define, and create detailed buyer personas for effective targeting.',
                descriptionAr: 'تعلم كيفية البحث وتحديد وإنشاء شخصيات مشتري مفصلة للاستهداف الفعال.',
                order: 2,
                duration: 28,
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
                courseId: demoCourse.id,
                resources: JSON.stringify([
                    {
                        title: 'Buyer Persona Worksheet',
                        titleAr: 'ورقة عمل شخصية المشتري',
                        type: 'doc',
                        url: '#',
                        size: '500 KB'
                    }
                ])
            },
            {
                title: 'Digital Marketing Channels Overview',
                titleAr: 'نظرة عامة على قنوات التسويق الرقمي',
                description: 'Explore all major digital marketing channels and learn when and how to use each effectively.',
                descriptionAr: 'استكشف جميع قنوات التسويق الرقمي الرئيسية وتعلم متى وكيفية استخدام كل منها بفعالية.',
                order: 3,
                duration: 42,
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                courseId: demoCourse.id
            },
            {
                title: 'Module 1 Quiz: Marketing Fundamentals',
                titleAr: 'اختبار الوحدة 1: أساسيات التسويق',
                description: 'Test your knowledge of digital marketing fundamentals with this comprehensive quiz.',
                descriptionAr: 'اختبر معرفتك بأساسيات التسويق الرقمي مع هذا الاختبار الشامل.',
                order: 4,
                duration: 15,
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4', // Placeholder for quiz
                courseId: demoCourse.id
            },

            // Module 2: SEO & Content Strategy
            {
                title: 'SEO Fundamentals & Keyword Research',
                titleAr: 'أساسيات تحسين محركات البحث وبحث الكلمات المفتاحية',
                description: 'Master the basics of SEO and learn advanced keyword research techniques to drive organic traffic.',
                descriptionAr: 'اتقن أساسيات تحسين محركات البحث وتعلم تقنيات البحث المتقدمة للكلمات المفتاحية لجذب الزيارات العضوية.',
                order: 5,
                duration: 45,
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
                courseId: demoCourse.id,
                resources: JSON.stringify([
                    {
                        title: 'SEO Checklist',
                        titleAr: 'قائمة مراجعة تحسين محركات البحث',
                        type: 'pdf',
                        url: '#',
                        size: '1.2 MB'
                    },
                    {
                        title: 'Keyword Research Tools List',
                        titleAr: 'قائمة أدوات البحث عن الكلمات المفتاحية',
                        type: 'pdf',
                        url: '#',
                        size: '800 KB'
                    }
                ])
            },
            {
                title: 'Content Strategy & Creation',
                titleAr: 'استراتيجية المحتوى والإنشاء',
                description: 'Develop a winning content strategy and learn to create engaging content that converts.',
                descriptionAr: 'طور استراتيجية محتوى رابحة وتعلم إنشاء محتوى جذاب يحقق التحويلات.',
                order: 6,
                duration: 38,
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
                courseId: demoCourse.id,
                resources: JSON.stringify([
                    {
                        title: 'Content Calendar Template',
                        titleAr: 'قالب تقويم المحتوى',
                        type: 'xls',
                        url: '#',
                        size: '1.5 MB'
                    }
                ])
            },
            {
                title: 'Technical SEO & Website Optimization',
                titleAr: 'تحسين محركات البحث التقني وتحسين الموقع',
                description: 'Deep dive into technical SEO aspects and website optimization for better search rankings.',
                descriptionAr: 'انغمس في الجوانب التقنية لتحسين محركات البحث وتحسين الموقع للحصول على ترتيب أفضل في البحث.',
                order: 7,
                duration: 52,
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
                courseId: demoCourse.id
            },

            // Module 3: Social Media Marketing
            {
                title: 'Social Media Strategy Development',
                titleAr: 'تطوير استراتيجية وسائل التواصل الاجتماعي',
                description: 'Learn to create comprehensive social media strategies that align with business goals.',
                descriptionAr: 'تعلم إنشاء استراتيجيات شاملة لوسائل التواصل الاجتماعي تتماشى مع أهداف العمل.',
                order: 8,
                duration: 33,
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
                courseId: demoCourse.id
            },
            {
                title: 'Facebook & Instagram Marketing',
                titleAr: 'التسويق عبر فيسبوك وإنستغرام',
                description: 'Master Facebook and Instagram marketing including ads, content creation, and audience building.',
                descriptionAr: 'اتقن التسويق عبر فيسبوك وإنستغرام بما في ذلك الإعلانات وإنشاء المحتوى وبناء الجمهور.',
                order: 9,
                duration: 48,
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
                courseId: demoCourse.id,
                resources: JSON.stringify([
                    {
                        title: 'Facebook Ads Setup Guide',
                        titleAr: 'دليل إعداد إعلانات فيسبوك',
                        type: 'pdf',
                        url: '#',
                        size: '3.2 MB'
                    }
                ])
            },
            {
                title: 'LinkedIn & Professional Networking',
                titleAr: 'لينكدإن والشبكات المهنية',
                description: 'Leverage LinkedIn for B2B marketing and professional brand building.',
                descriptionAr: 'استفد من لينكدإن للتسويق بين الشركات وبناء العلامة التجارية المهنية.',
                order: 10,
                duration: 29,
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
                courseId: demoCourse.id
            },
            {
                title: 'Social Media Quiz & Campaign Planning',
                titleAr: 'اختبار وسائل التواصل الاجتماعي وتخطيط الحملات',
                description: 'Test your social media knowledge and plan your first campaign.',
                descriptionAr: 'اختبر معرفتك بوسائل التواصل الاجتماعي وخطط لحملتك الأولى.',
                order: 11,
                duration: 20,
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4', // Quiz placeholder
                courseId: demoCourse.id
            },

            // Module 4: Analytics & Performance
            {
                title: 'Google Analytics Mastery',
                titleAr: 'إتقان جوجل أناليتكس',
                description: 'Learn to set up, configure, and interpret Google Analytics for actionable insights.',
                descriptionAr: 'تعلم إعداد وتكوين وتفسير جوجل أناليتكس للحصول على رؤى قابلة للتطبيق.',
                order: 12,
                duration: 41,
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
                courseId: demoCourse.id,
                resources: JSON.stringify([
                    {
                        title: 'Google Analytics Setup Checklist',
                        titleAr: 'قائمة مراجعة إعداد جوجل أناليتكس',
                        type: 'pdf',
                        url: '#',
                        size: '1.1 MB'
                    },
                    {
                        title: 'Custom Dashboard Templates',
                        titleAr: 'قوالب لوحة المعلومات المخصصة',
                        type: 'json',
                        url: '#',
                        size: '200 KB'
                    }
                ])
            },
            {
                title: 'ROI Measurement & Campaign Optimization',
                titleAr: 'قياس العائد على الاستثمار وتحسين الحملات',
                description: 'Learn to measure marketing ROI and optimize campaigns for better performance.',
                descriptionAr: 'تعلم قياس العائد على الاستثمار التسويقي وتحسين الحملات لأداء أفضل.',
                order: 13,
                duration: 37,
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4',
                courseId: demoCourse.id
            }
        ]

        for (const lessonData of demoLessons) {
            await prisma.lesson.create({
                data: lessonData
            })
        }

        console.log('Comprehensive demo course created successfully!')
        console.log(`Course ID: ${demoCourse.id}`)
        console.log(`Course Title: ${demoCourse.title}`)
        console.log(`Total Lessons: ${demoLessons.length}`)
        console.log(`Access URL: http://localhost:3001/courses/${demoCourse.id}`)

    } catch (error) {
        console.error('Error creating demo course:', error)
    } finally {
        await prisma.$disconnect()
    }
}

createDemoCourse()