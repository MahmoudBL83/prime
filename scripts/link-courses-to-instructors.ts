import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function linkCoursesToInstructors() {
    try {
        console.log('🔄 Starting course-instructor linking process...\n')

        // Get all instructors
        const instructors = await prisma.creator.findMany({
            include: {
                user: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        })

        console.log(`Found ${instructors.length} instructors:`)
        instructors.forEach((instructor, index) => {
            console.log(`${index + 1}. ${instructor.user.name} (${instructor.expertise})`)
        })

        // Delete duplicate courses first
        console.log('\n🧹 Cleaning up duplicate courses...')
        
        // Get all courses grouped by title
        const allCourses = await prisma.course.findMany({
            orderBy: { createdAt: 'asc' }
        })

        const coursesMap = new Map()
        const duplicateIds: string[] = []

        allCourses.forEach(course => {
            const key = course.title.trim()
            if (coursesMap.has(key)) {
                duplicateIds.push(course.id)
            } else {
                coursesMap.set(key, course)
            }
        })

        if (duplicateIds.length > 0) {
            console.log(`Removing ${duplicateIds.length} duplicate courses...`)
            await prisma.course.deleteMany({
                where: {
                    id: { in: duplicateIds }
                }
            })
        }

        // Get unique courses after cleanup
        const uniqueCourses = await prisma.course.findMany({
            include: {
                creator: {
                    include: {
                        user: true
                    }
                }
            }
        })

        console.log(`\n📚 Found ${uniqueCourses.length} unique courses after cleanup`)

        // Define course assignments based on instructor expertise
        const courseAssignments = [
            {
                instructorName: 'Ahmed Hassan',
                expertise: 'React, JavaScript, Frontend',
                courses: ['Complete React Masterclass 2024', 'Advanced React Development: From Basics to Mastery']
            },
            {
                instructorName: 'Fatima Al-Zahra',
                expertise: 'UI/UX Design',
                courses: ['UI/UX Design Fundamentals']
            },
            {
                instructorName: 'Mohamed Saeed',
                expertise: 'DevOps, Backend',
                courses: ['Node.js Backend Development']
            },
            {
                instructorName: 'Dr. Sarah Ahmed',
                expertise: 'AI/ML, Data Science',
                courses: [] // We'll create AI/ML courses for her
            },
            {
                instructorName: 'Omar Khaled',
                expertise: 'Mobile Development',
                courses: [] // We'll create mobile courses for him
            }
        ]

        // Update existing courses with proper instructors
        for (const assignment of courseAssignments) {
            const instructor = instructors.find(i => i.user.name === assignment.instructorName)
            if (!instructor) {
                console.log(`⚠️  Instructor ${assignment.instructorName} not found`)
                continue
            }

            for (const courseTitle of assignment.courses) {
                const course = uniqueCourses.find(c => c.title === courseTitle)
                if (course) {
                    await prisma.course.update({
                        where: { id: course.id },
                        data: { creatorId: instructor.id }
                    })
                    console.log(`✅ Linked "${courseTitle}" to ${instructor.user.name}`)
                }
            }
        }

        // Create additional courses for instructors who don't have any
        console.log('\n🆕 Creating additional courses for remaining instructors...')

        // Create AI/ML course for Dr. Sarah Ahmed
        const sarahInstructor = instructors.find(i => i.user.name === 'Dr. Sarah Ahmed')
        if (sarahInstructor) {
            const aiCourse = await prisma.course.create({
                data: {
                    title: 'Machine Learning with Python: Complete Guide',
                    titleAr: 'تعلم الآلة باستخدام Python: دليل شامل',
                    description: 'Master machine learning concepts and implementation using Python. Learn from data preprocessing to model deployment.',
                    descriptionAr: 'تعلم مفاهيم تعلم الآلة والتطبيق باستخدام Python. تعلم من معالجة البيانات إلى نشر النماذج.',
                    thumbnail: '/images/courses/ml-python.jpg',
                    price: 149.99,
                    category: 'Data Science',
                    skillLevel: 'INTERMEDIATE',
                    creatorId: sarahInstructor.id,
                    isPublished: true
                }
            })
            console.log(`✅ Created "Machine Learning with Python" for Dr. Sarah Ahmed`)

            // Create lessons for AI/ML course
            await prisma.lesson.createMany({
                data: [
                    {
                        title: 'Introduction to Machine Learning',
                        titleAr: 'مقدمة في تعلم الآلة',
                        description: 'Overview of machine learning concepts and applications',
                        courseId: aiCourse.id,
                        order: 1,
                        isPublished: true
                    },
                    {
                        title: 'Data Preprocessing and Feature Engineering',
                        titleAr: 'معالجة البيانات وهندسة الخصائص',
                        description: 'Learn to clean and prepare data for machine learning models',
                        courseId: aiCourse.id,
                        order: 2,
                        isPublished: true
                    },
                    {
                        title: 'Supervised Learning Algorithms',
                        titleAr: 'خوارزميات التعلم المُشرف عليها',
                        description: 'Classification and regression techniques',
                        courseId: aiCourse.id,
                        order: 3,
                        isPublished: true
                    },
                    {
                        title: 'Model Evaluation and Deployment',
                        titleAr: 'تقييم ونشر النماذج',
                        description: 'Assess model performance and deploy to production',
                        courseId: aiCourse.id,
                        order: 4,
                        isPublished: true
                    }
                ]
            })
        }

        // Create Mobile Development course for Omar Khaled
        const omarInstructor = instructors.find(i => i.user.name === 'Omar Khaled')
        if (omarInstructor) {
            const mobileCourse = await prisma.course.create({
                data: {
                    title: 'React Native: Cross-Platform Mobile Development',
                    titleAr: 'React Native: تطوير تطبيقات الموبايل متعددة المنصات',
                    description: 'Build native mobile apps for iOS and Android using React Native. From setup to app store deployment.',
                    descriptionAr: 'بناء تطبيقات موبايل أصلية لـ iOS و Android باستخدام React Native. من الإعداد إلى نشر التطبيق في المتاجر.',
                    thumbnail: '/images/courses/react-native.jpg',
                    price: 129.99,
                    category: 'Mobile Development',
                    skillLevel: 'INTERMEDIATE',
                    creatorId: omarInstructor.id,
                    isPublished: true
                }
            })
            console.log(`✅ Created "React Native: Cross-Platform Mobile Development" for Omar Khaled`)

            // Create lessons for Mobile course
            await prisma.lesson.createMany({
                data: [
                    {
                        title: 'React Native Setup and Environment',
                        titleAr: 'إعداد React Native والبيئة',
                        description: 'Set up development environment for React Native',
                        courseId: mobileCourse.id,
                        order: 1,
                        isPublished: true
                    },
                    {
                        title: 'Building Your First Mobile App',
                        titleAr: 'بناء أول تطبيق موبايل',
                        description: 'Create a simple mobile app with navigation',
                        courseId: mobileCourse.id,
                        order: 2,
                        isPublished: true
                    },
                    {
                        title: 'Native Device Features Integration',
                        titleAr: 'دمج ميزات الجهاز الأصلية',
                        description: 'Access camera, GPS, notifications, and more',
                        courseId: mobileCourse.id,
                        order: 3,
                        isPublished: true
                    },
                    {
                        title: 'App Store Deployment',
                        titleAr: 'نشر التطبيق في المتاجر',
                        description: 'Deploy your app to iOS App Store and Google Play',
                        courseId: mobileCourse.id,
                        order: 4,
                        isPublished: true
                    }
                ]
            })
        }

        // Create additional DevOps course for Mohamed Saeed
        const mohamedInstructor = instructors.find(i => i.user.name === 'Mohamed Saeed')
        if (mohamedInstructor) {
            const devopsCourse = await prisma.course.create({
                data: {
                    title: 'Docker and Kubernetes Mastery',
                    titleAr: 'إتقان Docker و Kubernetes',
                    description: 'Complete DevOps course covering containerization with Docker and orchestration with Kubernetes.',
                    descriptionAr: 'دورة DevOps كاملة تغطي الحاويات باستخدام Docker والتنسيق باستخدام Kubernetes.',
                    thumbnail: '/images/courses/docker-kubernetes.jpg',
                    price: 159.99,
                    category: 'DevOps',
                    skillLevel: 'ADVANCED',
                    creatorId: mohamedInstructor.id,
                    isPublished: true
                }
            })
            console.log(`✅ Created "Docker and Kubernetes Mastery" for Mohamed Saeed`)

            // Create lessons for DevOps course
            await prisma.lesson.createMany({
                data: [
                    {
                        title: 'Docker Fundamentals',
                        titleAr: 'أساسيات Docker',
                        description: 'Learn containerization with Docker',
                        courseId: devopsCourse.id,
                        order: 1,
                        isPublished: true
                    },
                    {
                        title: 'Docker Compose and Multi-Container Apps',
                        titleAr: 'Docker Compose والتطبيقات متعددة الحاويات',
                        description: 'Orchestrate multiple containers with Docker Compose',
                        courseId: devopsCourse.id,
                        order: 2,
                        isPublished: true
                    },
                    {
                        title: 'Kubernetes Cluster Management',
                        titleAr: 'إدارة مجموعات Kubernetes',
                        description: 'Deploy and manage applications in Kubernetes',
                        courseId: devopsCourse.id,
                        order: 3,
                        isPublished: true
                    },
                    {
                        title: 'CI/CD Pipelines with Kubernetes',
                        titleAr: 'خطوط CI/CD مع Kubernetes',
                        description: 'Automated deployment pipelines',
                        courseId: devopsCourse.id,
                        order: 4,
                        isPublished: true
                    }
                ]
            })
        }

        // Final verification
        console.log('\n✨ Final verification:')
        const finalInstructors = await prisma.creator.findMany({
            include: {
                user: true,
                courses: true
            }
        })

        finalInstructors.forEach((instructor) => {
            console.log(`📋 ${instructor.user.name}: ${instructor.courses.length} courses`)
            instructor.courses.forEach(course => {
                console.log(`   - ${course.title}`)
            })
        })

        console.log('\n🎉 Course-instructor linking completed successfully!')

    } catch (error) {
        console.error('❌ Error linking courses to instructors:', error)
    } finally {
        await prisma.$disconnect()
    }
}

linkCoursesToInstructors()