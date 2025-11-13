import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🔧 Fixing course categories and thumbnails...')

    // Define proper course data with distinct categories and thumbnails
    const courseUpdates = [
        {
            title: 'Complete Web Development Bootcamp',
            category: 'PROGRAMMING',
            thumbnail: 'https://images.unsplash.com/photo-1593720213428-28a5b9e94613?w=800&h=600&fit=crop&crop=center&auto=format&q=80'
        },
        {
            title: 'Digital Marketing Mastery',
            category: 'BUSINESS',
            thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop&crop=center&auto=format&q=80'
        },
        {
            title: 'IELTS Preparation Complete Guide',
            category: 'BUSINESS', // Language learning can go under business skills
            thumbnail: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&h=600&fit=crop&crop=center&auto=format&q=80'
        },
        {
            title: 'Architecture Design Fundamentals',
            category: 'DESIGN',
            thumbnail: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800&h=600&fit=crop&crop=center&auto=format&q=80'
        },
        {
            title: 'Startup Business Strategy',
            category: 'BUSINESS',
            thumbnail: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop&crop=center&auto=format&q=80'
        }
    ]

    // Update existing courses
    for (const update of courseUpdates) {
        const course = await prisma.course.findFirst({
            where: { title: update.title }
        })

        if (course) {
            await prisma.course.update({
                where: { id: course.id },
                data: {
                    category: update.category,
                    thumbnail: update.thumbnail
                }
            })
            console.log(`✅ Updated ${update.title} - Category: ${update.category}`)
        }
    }

    // Add additional programming courses to have more variety
    const existingProgrammingCourse = await prisma.course.findFirst({
        where: { category: 'PROGRAMMING' }
    })

    if (existingProgrammingCourse) {
        const creator = await prisma.creator.findFirst({
            include: { user: true }
        })

        if (creator) {
            // Add additional programming courses
            const additionalProgrammingCourses = [
                {
                    title: 'Python for Data Science',
                    titleAr: 'بايثون لعلوم البيانات',
                    description: 'Master Python programming for data analysis, machine learning, and scientific computing.',
                    descriptionAr: 'إتقان برمجة بايثون لتحليل البيانات والتعلم الآلي والحوسبة العلمية.',
                    category: 'PROGRAMMING',
                    thumbnail: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&h=600&fit=crop&crop=center&auto=format&q=80',
                    skillLevel: 'Intermediate',
                    duration: 2100,
                    language: 'ar',
                    price: 220,
                    rating: 4.7
                },
                {
                    title: 'React.js Modern Development',
                    titleAr: 'تطوير React.js الحديث',
                    description: 'Build modern web applications with React.js, hooks, and context API.',
                    descriptionAr: 'ابن تطبيقات ويب حديثة باستخدام React.js والـ hooks وسياق API.',
                    category: 'PROGRAMMING',
                    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=600&fit=crop&crop=center&auto=format&q=80',
                    skillLevel: 'Intermediate',
                    duration: 1800,
                    language: 'ar',
                    price: 280,
                    rating: 4.9
                }
            ]

            for (const courseData of additionalProgrammingCourses) {
                const existingCourse = await prisma.course.findFirst({
                    where: { title: courseData.title }
                })

                if (!existingCourse) {
                    await prisma.course.create({
                        data: {
                            ...courseData,
                            creatorId: creator.id,
                            status: 'PUBLISHED',
                            publishedAt: new Date(),
                            totalViews: Math.floor(Math.random() * 1000) + 200,
                            totalEnrollments: Math.floor(Math.random() * 100) + 20,
                            syllabus: {
                                modules: [
                                    {
                                        title: 'المقدمة والأساسيات',
                                        titleEn: 'Introduction and Fundamentals',
                                        lessons: ['الإعداد والتحضير', 'المفاهيم الأساسية', 'أول مشروع']
                                    }
                                ]
                            }
                        }
                    })
                    console.log(`✅ Created ${courseData.title}`)
                }
            }

            // Add additional design courses
            const additionalDesignCourses = [
                {
                    title: 'UI/UX Design Masterclass',
                    titleAr: 'الدورة الشاملة لتصميم UI/UX',
                    description: 'Learn user interface and user experience design principles and create stunning digital products.',
                    descriptionAr: 'تعلم مبادئ تصميم واجهة المستخدم وتجربة المستخدم وأنشئ منتجات رقمية مذهلة.',
                    category: 'DESIGN',
                    thumbnail: 'https://images.unsplash.com/photo-1559028006-448665bd7c7f?w=800&h=600&fit=crop&crop=center&auto=format&q=80',
                    skillLevel: 'Beginner',
                    duration: 2400,
                    language: 'ar',
                    price: 320,
                    rating: 4.8
                },
                {
                    title: 'Graphic Design with Adobe Creative Suite',
                    titleAr: 'التصميم الجرافيكي مع Adobe Creative Suite',
                    description: 'Master Photoshop, Illustrator, and InDesign for professional graphic design work.',
                    descriptionAr: 'إتقان فوتوشوب وإليستريتور وإن ديزاين للعمل الاحترافي في التصميم الجرافيكي.',
                    category: 'DESIGN',
                    thumbnail: 'https://images.unsplash.com/photo-1626785774625-0b1c2c4eab67?w=800&h=600&fit=crop&crop=center&auto=format&q=80',
                    skillLevel: 'Beginner',
                    duration: 3000,
                    language: 'ar',
                    price: 380,
                    rating: 4.6
                }
            ]

            for (const courseData of additionalDesignCourses) {
                const existingCourse = await prisma.course.findFirst({
                    where: { title: courseData.title }
                })

                if (!existingCourse) {
                    await prisma.course.create({
                        data: {
                            ...courseData,
                            creatorId: creator.id,
                            status: 'PUBLISHED',
                            publishedAt: new Date(),
                            totalViews: Math.floor(Math.random() * 1000) + 200,
                            totalEnrollments: Math.floor(Math.random() * 100) + 20,
                            syllabus: {
                                modules: [
                                    {
                                        title: 'المقدمة والأساسيات',
                                        titleEn: 'Introduction and Fundamentals',
                                        lessons: ['الإعداد والتحضير', 'المفاهيم الأساسية', 'أول مشروع']
                                    }
                                ]
                            }
                        }
                    })
                    console.log(`✅ Created ${courseData.title}`)
                }
            }

            // Add additional business courses
            const additionalBusinessCourses = [
                {
                    title: 'E-commerce Business Development',
                    titleAr: 'تطوير أعمال التجارة الإلكترونية',
                    description: 'Build and scale successful online businesses in the Egyptian market.',
                    descriptionAr: 'ابن وطور أعمال ناجحة عبر الإنترنت في السوق المصري.',
                    category: 'BUSINESS',
                    thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop&crop=center&auto=format&q=80',
                    skillLevel: 'Intermediate',
                    duration: 2200,
                    language: 'ar',
                    price: 350,
                    rating: 4.5
                },
                {
                    title: 'Financial Planning for Entrepreneurs',
                    titleAr: 'التخطيط المالي لرواد الأعمال',
                    description: 'Learn financial management, budgeting, and investment strategies for business growth.',
                    descriptionAr: 'تعلم الإدارة المالية والموازنة واستراتيجيات الاستثمار لنمو الأعمال.',
                    category: 'BUSINESS',
                    thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop&crop=center&auto=format&q=80',
                    skillLevel: 'Intermediate',
                    duration: 1600,
                    language: 'ar',
                    price: 290,
                    rating: 4.7
                }
            ]

            for (const courseData of additionalBusinessCourses) {
                const existingCourse = await prisma.course.findFirst({
                    where: { title: courseData.title }
                })

                if (!existingCourse) {
                    await prisma.course.create({
                        data: {
                            ...courseData,
                            creatorId: creator.id,
                            status: 'PUBLISHED',
                            publishedAt: new Date(),
                            totalViews: Math.floor(Math.random() * 1000) + 200,
                            totalEnrollments: Math.floor(Math.random() * 100) + 20,
                            syllabus: {
                                modules: [
                                    {
                                        title: 'المقدمة والأساسيات',
                                        titleEn: 'Introduction and Fundamentals',
                                        lessons: ['الإعداد والتحضير', 'المفاهيم الأساسية', 'أول مشروع']
                                    }
                                ]
                            }
                        }
                    })
                    console.log(`✅ Created ${courseData.title}`)
                }
            }
        }
    }

    // Verify the results
    const programmingCount = await prisma.course.count({ where: { category: 'PROGRAMMING' } })
    const designCount = await prisma.course.count({ where: { category: 'DESIGN' } })
    const businessCount = await prisma.course.count({ where: { category: 'BUSINESS' } })

    console.log('\n🎉 Course categorization complete!')
    console.log(`📚 Programming courses: ${programmingCount}`)
    console.log(`🎨 Design courses: ${designCount}`)
    console.log(`💼 Business courses: ${businessCount}`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })