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

        // Get all existing courses
        const allCourses = await prisma.course.findMany({
            include: {
                creator: {
                    include: {
                        user: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        })

        console.log(`\n📚 Found ${allCourses.length} courses`)

        // Define course assignments based on instructor expertise
        const courseAssignments = [
            {
                instructorName: 'Ahmed Hassan',
                expertise: 'React, JavaScript, Frontend',
                coursePatterns: ['React', 'JavaScript', 'Frontend', 'Advanced React']
            },
            {
                instructorName: 'Fatima Al-Zahra',
                expertise: 'UI/UX Design',
                coursePatterns: ['UI/UX', 'Design', 'Figma']
            },
            {
                instructorName: 'Mohamed Saeed',
                expertise: 'DevOps, Backend',
                coursePatterns: ['Node.js', 'Backend', 'API', 'Server']
            }
        ]

        // Assign existing courses to instructors based on content
        console.log('\n🔗 Assigning existing courses to instructors...')
        
        for (const course of allCourses) {
            let assignedInstructor = null
            
            // Find best matching instructor based on course title/content
            for (const assignment of courseAssignments) {
                for (const pattern of assignment.coursePatterns) {
                    if (course.title.toLowerCase().includes(pattern.toLowerCase())) {
                        assignedInstructor = instructors.find(i => i.user.name === assignment.instructorName)
                        break
                    }
                }
                if (assignedInstructor) break
            }

            // If no specific match, assign to Ahmed Hassan as default (most general expertise)
            if (!assignedInstructor) {
                assignedInstructor = instructors.find(i => i.user.name === 'Ahmed Hassan')
            }

            if (assignedInstructor && course.creatorId !== assignedInstructor.id) {
                await prisma.course.update({
                    where: { id: course.id },
                    data: { creatorId: assignedInstructor.id }
                })
                console.log(`✅ Assigned "${course.title}" to ${assignedInstructor.user.name}`)
            } else if (assignedInstructor) {
                console.log(`✓ "${course.title}" already assigned to ${assignedInstructor.user.name}`)
            }
        }

        // Create additional courses for instructors who need more courses
        console.log('\n🆕 Creating additional courses for instructors...')

        // Check current course distribution
        const instructorCourses = await prisma.creator.findMany({
            include: {
                user: true,
                courses: true
            }
        })

        // Create AI/ML course for Dr. Sarah Ahmed if she has no courses
        const sarahInstructor = instructorCourses.find(i => i.user.name === 'Dr. Sarah Ahmed')
        if (sarahInstructor && sarahInstructor.courses.length === 0) {
            const aiCourse = await prisma.course.create({
                data: {
                    title: 'Machine Learning with Python: Complete Guide',
                    titleAr: 'تعلم الآلة باستخدام Python: دليل شامل',
                    description: 'Master machine learning concepts and implementation using Python. Learn from data preprocessing to model deployment with hands-on projects.',
                    descriptionAr: 'اتقن مفاهيم تعلم الآلة والتطبيق باستخدام Python. تعلم من معالجة البيانات إلى نشر النماذج مع مشاريع عملية.',
                    thumbnail: '/images/courses/ml-python.jpg',
                    price: 149.99,
                    category: 'Data Science',
                    skillLevel: 'INTERMEDIATE',
                    duration: 480, // 8 hours in minutes
                    language: 'English',
                    syllabus: {
                        sections: [
                            {
                                title: "Machine Learning Fundamentals",
                                lessons: ["Introduction to ML", "Types of Learning", "Python Setup"]
                            },
                            {
                                title: "Data Science Tools", 
                                lessons: ["NumPy", "Pandas", "Matplotlib", "Seaborn"]
                            },
                            {
                                title: "Model Building",
                                lessons: ["Data Preprocessing", "Feature Engineering", "Model Selection"]
                            },
                            {
                                title: "Deployment",
                                lessons: ["Model Evaluation", "Production Deployment", "Monitoring"]
                            }
                        ]
                    },
                    creatorId: sarahInstructor.id,
                    status: 'PUBLISHED'
                }
            })
            console.log(`✅ Created "Machine Learning with Python" for Dr. Sarah Ahmed`)

            // Create lessons for AI/ML course
            await prisma.lesson.createMany({
                data: [
                    {
                        title: 'Introduction to Machine Learning',
                        titleAr: 'مقدمة في تعلم الآلة',
                        description: 'Overview of machine learning concepts, types, and real-world applications',
                        videoUrl: '/videos/ml-intro.mp4',
                        duration: 45,
                        courseId: aiCourse.id,
                        order: 1
                    },
                    {
                        title: 'Python for Data Science',
                        titleAr: 'Python لعلوم البيانات',
                        description: 'Essential Python libraries: NumPy, Pandas, and Matplotlib',
                        courseId: aiCourse.id,
                        order: 2,
                        isPublished: true
                    },
                    {
                        title: 'Data Preprocessing and Feature Engineering',
                        titleAr: 'معالجة البيانات وهندسة الخصائص',
                        description: 'Clean, transform, and prepare data for machine learning models',
                        courseId: aiCourse.id,
                        order: 3,
                        isPublished: true
                    },
                    {
                        title: 'Supervised Learning Algorithms',
                        titleAr: 'خوارزميات التعلم المُشرف عليها',
                        description: 'Classification and regression techniques with practical examples',
                        courseId: aiCourse.id,
                        order: 4,
                        isPublished: true
                    },
                    {
                        title: 'Model Evaluation and Deployment',
                        titleAr: 'تقييم ونشر النماذج',
                        description: 'Assess model performance and deploy to production environments',
                        courseId: aiCourse.id,
                        order: 5,
                        isPublished: true
                    }
                ]
            })
        }

        // Create Mobile Development course for Omar Khaled if he has no courses
        const omarInstructor = instructorCourses.find(i => i.user.name === 'Omar Khaled')
        if (omarInstructor && omarInstructor.courses.length === 0) {
            const mobileCourse = await prisma.course.create({
                data: {
                    title: 'React Native: Cross-Platform Mobile Development',
                    titleAr: 'React Native: تطوير تطبيقات الموبايل متعددة المنصات',
                    description: 'Build native mobile apps for iOS and Android using React Native. From setup to app store deployment with real-world projects.',
                    descriptionAr: 'بناء تطبيقات موبايل أصلية لـ iOS و Android باستخدام React Native. من الإعداد إلى نشر التطبيق في المتاجر مع مشاريع حقيقية.',
                    thumbnail: '/images/courses/react-native.jpg',
                    price: 129.99,
                    category: 'Mobile Development',
                    skillLevel: 'INTERMEDIATE',
                    duration: 420, // 7 hours
                    language: 'English',
                    syllabus: {
                        sections: [
                            { title: "Getting Started", lessons: ["Setup", "Environment", "First App"] },
                            { title: "Core Concepts", lessons: ["Components", "Navigation", "State Management"] },
                            { title: "Advanced Features", lessons: ["Native Modules", "Device APIs", "Push Notifications"] },
                            { title: "Deployment", lessons: ["Testing", "Building", "App Store Submission"] }
                        ]
                    },
                    creatorId: omarInstructor.id,
                    status: 'PUBLISHED'
                }
            })
            console.log(`✅ Created "React Native: Cross-Platform Mobile Development" for Omar Khaled`)

            // Create lessons for Mobile course
            await prisma.lesson.createMany({
                data: [
                    {
                        title: 'React Native Setup and Environment',
                        titleAr: 'إعداد React Native والبيئة',
                        description: 'Set up development environment for React Native on Windows, Mac, and Linux',
                        courseId: mobileCourse.id,
                        order: 1,
                        isPublished: true
                    },
                    {
                        title: 'Core Components and Navigation',
                        titleAr: 'المكونات الأساسية والتنقل',
                        description: 'Learn essential React Native components and navigation patterns',
                        courseId: mobileCourse.id,
                        order: 2,
                        isPublished: true
                    },
                    {
                        title: 'State Management and API Integration',
                        titleAr: 'إدارة الحالة ودمج API',
                        description: 'Managing app state and integrating with REST APIs',
                        courseId: mobileCourse.id,
                        order: 3,
                        isPublished: true
                    },
                    {
                        title: 'Native Device Features',
                        titleAr: 'ميزات الجهاز الأصلية',
                        description: 'Access camera, GPS, notifications, and device storage',
                        courseId: mobileCourse.id,
                        order: 4,
                        isPublished: true
                    },
                    {
                        title: 'App Store Deployment',
                        titleAr: 'نشر التطبيق في المتاجر',
                        description: 'Deploy your app to iOS App Store and Google Play Store',
                        courseId: mobileCourse.id,
                        order: 5,
                        isPublished: true
                    }
                ]
            })
        }

        // Create additional DevOps course for Mohamed Saeed
        const mohamedInstructor = instructorCourses.find(i => i.user.name === 'Mohamed Saeed')
        if (mohamedInstructor && mohamedInstructor.courses.length <= 1) {
            const devopsCourse = await prisma.course.create({
                data: {
                    title: 'Docker and Kubernetes Mastery for DevOps',
                    titleAr: 'إتقان Docker و Kubernetes لـ DevOps',
                    description: 'Complete DevOps course covering containerization with Docker and orchestration with Kubernetes. Build, deploy, and scale applications.',
                    descriptionAr: 'دورة DevOps كاملة تغطي الحاويات باستخدام Docker والتنسيق باستخدام Kubernetes. بناء ونشر وتوسيع التطبيقات.',
                    thumbnail: '/images/courses/docker-kubernetes.jpg',
                    price: 159.99,
                    category: 'DevOps',
                    skillLevel: 'ADVANCED',
                    duration: 540, // 9 hours
                    language: 'English',
                    syllabus: {
                        sections: [
                            { title: "Docker Fundamentals", lessons: ["Containers", "Images", "Dockerfile"] },
                            { title: "Docker Compose", lessons: ["Multi-container Apps", "Networking", "Volumes"] },
                            { title: "Kubernetes Basics", lessons: ["Architecture", "Pods", "Services"] },
                            { title: "Advanced K8s", lessons: ["Deployments", "ConfigMaps", "Secrets"] },
                            { title: "CI/CD", lessons: ["GitOps", "Pipelines", "Monitoring"] }
                        ]
                    },
                    creatorId: mohamedInstructor.id,
                    status: 'PUBLISHED'
                }
            })
            console.log(`✅ Created "Docker and Kubernetes Mastery" for Mohamed Saeed`)

            // Create lessons for DevOps course
            await prisma.lesson.createMany({
                data: [
                    {
                        title: 'Docker Fundamentals and Containerization',
                        titleAr: 'أساسيات Docker والحاويات',
                        description: 'Learn containerization concepts and Docker basics',
                        courseId: devopsCourse.id,
                        order: 1,
                        isPublished: true
                    },
                    {
                        title: 'Docker Compose and Multi-Container Applications',
                        titleAr: 'Docker Compose والتطبيقات متعددة الحاويات',
                        description: 'Orchestrate multiple containers with Docker Compose',
                        courseId: devopsCourse.id,
                        order: 2,
                        isPublished: true
                    },
                    {
                        title: 'Kubernetes Architecture and Deployment',
                        titleAr: 'هندسة Kubernetes والنشر',
                        description: 'Understanding Kubernetes architecture and deploying applications',
                        courseId: devopsCourse.id,
                        order: 3,
                        isPublished: true
                    },
                    {
                        title: 'Kubernetes Services and Networking',
                        titleAr: 'خدمات وشبكات Kubernetes',
                        description: 'Configure services, ingress, and networking in Kubernetes',
                        courseId: devopsCourse.id,
                        order: 4,
                        isPublished: true
                    },
                    {
                        title: 'CI/CD Pipelines with Kubernetes',
                        titleAr: 'خطوط CI/CD مع Kubernetes',
                        description: 'Automated deployment pipelines and GitOps workflows',
                        courseId: devopsCourse.id,
                        order: 5,
                        isPublished: true
                    }
                ]
            })
        }

        // Final verification
        console.log('\n✨ Final course distribution:')
        const finalInstructors = await prisma.creator.findMany({
            include: {
                user: true,
                courses: {
                    select: {
                        id: true,
                        title: true,
                        category: true,
                        price: true
                    }
                }
            }
        })

        let totalCourses = 0
        finalInstructors.forEach((instructor) => {
            console.log(`\n📋 ${instructor.user.name} (${instructor.courses.length} courses):`)
            instructor.courses.forEach(course => {
                console.log(`   - ${course.title} (${course.category}) - $${course.price}`)
            })
            totalCourses += instructor.courses.length
        })

        console.log(`\n🎉 Successfully linked ${totalCourses} courses across ${finalInstructors.length} instructors!`)
        console.log('✅ All courses now have proper instructor assignments')

    } catch (error) {
        console.error('❌ Error linking courses to instructors:', error)
    } finally {
        await prisma.$disconnect()
    }
}

linkCoursesToInstructors()