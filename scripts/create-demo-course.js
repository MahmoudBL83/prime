const { PrismaClient } = require('@prisma/client')

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

        // Create first few lessons as a demo
        const demoLessons = [
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
                courseId: demoCourse.id
            },
            {
                title: 'SEO Fundamentals & Keyword Research',
                titleAr: 'أساسيات تحسين محركات البحث وبحث الكلمات المفتاحية',
                description: 'Master the basics of SEO and learn advanced keyword research techniques.',
                descriptionAr: 'اتقن أساسيات تحسين محركات البحث وتعلم تقنيات البحث المتقدمة.',
                order: 3,
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
                    }
                ])
            },
            {
                title: 'Module 1 Quiz: Marketing Fundamentals',
                titleAr: 'اختبار الوحدة 1: أساسيات التسويق',
                description: 'Test your knowledge of digital marketing fundamentals.',
                descriptionAr: 'اختبر معرفتك بأساسيات التسويق الرقمي.',
                order: 4,
                duration: 15,
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
                courseId: demoCourse.id
            },
            {
                title: 'Social Media Strategy Development',
                titleAr: 'تطوير استراتيجية وسائل التواصل الاجتماعي',
                description: 'Learn to create comprehensive social media strategies.',
                descriptionAr: 'تعلم إنشاء استراتيجيات شاملة لوسائل التواصل الاجتماعي.',
                order: 5,
                duration: 33,
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
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
