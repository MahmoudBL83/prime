import { PrismaClient, UserRole, KYCStatus, ContentStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Sample data arrays for generating realistic content
const firstNamesArabic = [
    'أحمد', 'محمد', 'علي', 'عبدالله', 'عمر', 'خالد', 'يوسف', 'إبراهيم', 'حسن', 'محمود',
    'فاطمة', 'عائشة', 'خديجة', 'زينب', 'مريم', 'سارة', 'نورا', 'دينا', 'رنا', 'ريم',
    'منى', 'هبة', 'ندى', 'أميرة', 'ياسمين', 'شيماء', 'إيمان', 'سمر', 'نادية', 'لطيفة'
]

const firstNamesEnglish = [
    'Ahmed', 'Mohamed', 'Ali', 'Abdullah', 'Omar', 'Khaled', 'Youssef', 'Ibrahim', 'Hassan', 'Mahmoud',
    'Fatma', 'Aisha', 'Khadija', 'Zeinab', 'Mariam', 'Sarah', 'Nora', 'Dina', 'Rana', 'Reem',
    'Mona', 'Heba', 'Nada', 'Amira', 'Yasmin', 'Shimaa', 'Iman', 'Samar', 'Nadia', 'Latifa'
]

const lastNamesArabic = [
    'أحمد', 'محمد', 'علي', 'حسن', 'إبراهيم', 'محمود', 'عبدالرحمن', 'الشربيني', 'المصري', 'السيد',
    'عبدالعزيز', 'فاروق', 'عثمان', 'الخطيب', 'النجار', 'الحداد', 'العطار', 'البحيري', 'القاضي', 'الطحان'
]

const lastNamesEnglish = [
    'Ahmed', 'Mohamed', 'Ali', 'Hassan', 'Ibrahim', 'Mahmoud', 'Abdulrahman', 'El-Sherbini', 'El-Masri', 'El-Sayed',
    'Abdulaziz', 'Farouk', 'Othman', 'El-Khatib', 'El-Najjar', 'El-Haddad', 'El-Attar', 'El-Behairy', 'El-Qadi', 'El-Tahan'
]

const courseCategories = [
    'Technology', 'Business', 'Design', 'Marketing', 'Languages', 'Science', 'Engineering', 'Medicine', 'Law', 'Education'
]

const expertiseAreas = [
    'Web Development', 'Mobile Development', 'Data Science', 'Machine Learning', 'Cybersecurity',
    'Digital Marketing', 'Social Media Marketing', 'E-commerce', 'Business Strategy', 'Entrepreneurship',
    'Graphic Design', 'UI/UX Design', 'Photography', 'Video Editing', 'Animation',
    'English Language', 'Arabic Language', 'French Language', 'German Language', 'Translation',
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
    'Civil Engineering', 'Mechanical Engineering', 'Electrical Engineering', 'Chemical Engineering',
    'Medicine', 'Pharmacy', 'Dentistry', 'Nursing', 'Public Health',
    'Law', 'Economics', 'Finance', 'Accounting', 'Human Resources'
]

const learningInterests = [
    'Programming', 'Web Development', 'Mobile Apps', 'Data Analysis', 'Artificial Intelligence',
    'Digital Marketing', 'Social Media', 'E-commerce', 'Business Management', 'Entrepreneurship',
    'Graphic Design', 'UI/UX Design', 'Photography', 'Video Production', 'Content Creation',
    'English Language', 'German Language', 'French Language', 'Spanish Language', 'IELTS Preparation',
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Medicine',
    'Engineering', 'Architecture', 'Construction', 'Project Management', 'Quality Control',
    'Finance', 'Accounting', 'Economics', 'Investment', 'Banking',
    'Psychology', 'Education', 'Training', 'Coaching', 'Personal Development'
]

const learningGoals = [
    'Career Change', 'Job Promotion', 'Skill Development', 'University Entrance', 'Certification',
    'Freelancing', 'Starting a Business', 'Side Income', 'Personal Growth', 'Academic Excellence'
]

const cities = ['Cairo', 'Alexandria', 'Giza', 'Shubra El Kheima', 'Port Said', 'Suez', 'Luxor', 'Aswan', 'Mansoura', 'Tanta']

function getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)]
}

function getRandomElements<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, Math.min(count, array.length))
}

function generateEmail(firstName: string, lastName: string): string {
    const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'demo.com']
    const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '')
    const cleanLast = lastName.toLowerCase().replace(/[^a-z]/g, '')
    const domain = getRandomElement(domains)
    return `${cleanFirst}.${cleanLast}@${domain}`
}

function generatePhone(): string {
    const prefix = '+2010'
    const number = Math.floor(Math.random() * 90000000) + 10000000
    return prefix + number.toString()
}

async function main() {
    console.log('🌱 Starting comprehensive demo database seeding...')

    // Clear existing data
    console.log('🧹 Cleaning existing data...')
    
    try {
        // Delete in proper order to respect foreign key constraints
        await prisma.messageReaction.deleteMany()
        await prisma.messageAttachment.deleteMany()
        await prisma.message.deleteMany()
        await prisma.conversationParticipant.deleteMany()
        await prisma.conversation.deleteMany()
        await prisma.groupChannel.deleteMany()
        await prisma.groupMember.deleteMany()
        await prisma.group.deleteMany()
        await prisma.notification.deleteMany()
        await prisma.notificationSetting.deleteMany()
        await prisma.review.deleteMany()
        await prisma.quizAnswer.deleteMany()
        await prisma.quizAttempt.deleteMany()
        await prisma.question.deleteMany()
        await prisma.quiz.deleteMany()
        await prisma.assignmentSubmission.deleteMany()
        await prisma.assignment.deleteMany()
        await prisma.lessonProgress.deleteMany()
        await prisma.videoAnalytics.deleteMany()
        await prisma.videoProgress.deleteMany()
        await prisma.playlistItem.deleteMany()
        await prisma.videoAsset.deleteMany()
        await prisma.lesson.deleteMany()
        await prisma.enrollment.deleteMany()
        await prisma.course.deleteMany()
        await prisma.channelPost.deleteMany()
        await prisma.subscription.deleteMany()
        await prisma.creatorChannel.deleteMany()
        await prisma.payout.deleteMany()
        await prisma.instructorAvailability.deleteMany()
        await prisma.meeting.deleteMany()
        await prisma.instructorFollow.deleteMany()
        await prisma.studyBuddyMatch.deleteMany()
        await prisma.creator.deleteMany()
        await prisma.session.deleteMany()
        await prisma.user.deleteMany()
        
        console.log('✅ Existing data cleaned successfully')
    } catch (error) {
        console.log('⚠️ Some cleanup operations failed, continuing...')
    }

    const demoPassword = await bcrypt.hash('demo123', 10)

    console.log('👤 Creating admin user...')
    // === ADMIN USER ===
    const admin = await prisma.user.upsert({
        where: { email: 'admin@prime.eg' },
        update: {},
        create: {
            email: 'admin@prime.eg',
            passwordHash: demoPassword,
            name: 'Omar Hassan',
            arabicName: 'عمر حسن',
            role: UserRole.ADMIN,
            emailVerified: new Date(),
            bio: 'Platform Administrator for Prime EdTech',
            onboardingCompleted: true,
        },
    })

    console.log('🎓 Creating 200 student users...')
    // === CREATE 200 STUDENTS ===
    const students = []
    for (let i = 0; i < 200; i++) {
        const firstName = getRandomElement(firstNamesEnglish)
        const firstNameAr = getRandomElement(firstNamesArabic)
        const lastName = getRandomElement(lastNamesEnglish)
        const lastNameAr = getRandomElement(lastNamesArabic)
        
        const student = await prisma.user.create({
            data: {
                email: generateEmail(firstName, lastName) + i.toString(), // Add index to ensure uniqueness
                passwordHash: demoPassword,
                name: `${firstName} ${lastName}`,
                arabicName: `${firstNameAr} ${lastNameAr}`,
                role: UserRole.LEARNER,
                emailVerified: new Date(),
                phoneVerified: Math.random() > 0.5 ? new Date() : null,
                phone: generatePhone(),
                bio: `Student interested in ${getRandomElements(learningInterests, 2).join(' and ')}`,
                interests: getRandomElements(learningInterests, Math.floor(Math.random() * 5) + 2).join(','),
                goals: getRandomElements(learningGoals, Math.floor(Math.random() * 3) + 1).join(','),
                skillLevel: getRandomElement(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
                learningMode: getRandomElement(['online', 'offline', 'hybrid']),
                onboardingCompleted: true,
            },
        })
        students.push(student)
    }

    console.log('👨‍🏫 Creating 50 mentor/creator users...')
    // === CREATE 50 MENTORS/CREATORS ===
    const mentors = []
    for (let i = 0; i < 50; i++) {
        const firstName = getRandomElement(firstNamesEnglish)
        const firstNameAr = getRandomElement(firstNamesArabic)
        const lastName = getRandomElement(lastNamesEnglish)
        const lastNameAr = getRandomElement(lastNamesArabic)
        
        const mentorUser = await prisma.user.create({
            data: {
                email: generateEmail(firstName, lastName) + `_mentor${i}`,
                passwordHash: demoPassword,
                name: `${firstName} ${lastName}`,
                arabicName: `${firstNameAr} ${lastNameAr}`,
                role: UserRole.CREATOR,
                emailVerified: new Date(),
                phoneVerified: new Date(),
                phone: generatePhone(),
                bio: `Expert in ${getRandomElements(expertiseAreas, 2).join(' and ')} with ${Math.floor(Math.random() * 15) + 3}+ years of experience`,
                profileImage: `https://images.unsplash.com/photo-${1500000000 + Math.floor(Math.random() * 100000000)}?w=400&h=400&fit=crop&crop=face&auto=format&q=80`,
                onboardingCompleted: true,
            },
        })

        const mentor = await prisma.creator.create({
            data: {
                userId: mentorUser.id,
                kycStatus: Math.random() > 0.1 ? KYCStatus.VERIFIED : KYCStatus.PENDING,
                expertise: getRandomElements(expertiseAreas, Math.floor(Math.random() * 3) + 1).join(', '),
                teachingGoals: `Empower Egyptian students with ${getRandomElement(expertiseAreas)} skills`,
                contractSigned: true,
                contractSignedAt: new Date(),
                totalEarnings: Math.floor(Math.random() * 50000) + 5000,
                totalSubscribers: Math.floor(Math.random() * 1000) + 50,
                hourlyRate: Math.floor(Math.random() * 200) + 50,
                availableForMeetings: Math.random() > 0.3,
                languages: getRandomElements(['Arabic', 'English', 'French', 'German'], Math.floor(Math.random() * 3) + 1).join(', '),
            },
        })

        mentors.push({ user: mentorUser, creator: mentor })
    }

    console.log('📚 Creating 150 diverse courses...')
    // === CREATE 150 COURSES ===
    const courseTemplates = [
        {
            titles: ['Complete Web Development Bootcamp', 'دورة تطوير الويب الشاملة'],
            descriptions: [
                'Master HTML, CSS, JavaScript, React, and Node.js. Build real-world projects and land your first tech job.',
                'إتقان HTML و CSS و JavaScript و React و Node.js. ابن مشاريع حقيقية واحصل على أول وظيفة في التكنولوجيا.'
            ],
            category: 'Technology',
            skillLevels: ['Beginner', 'Intermediate'],
        },
        {
            titles: ['Digital Marketing Mastery', 'إتقان التسويق الرقمي'],
            descriptions: [
                'Learn Facebook Ads, Google Ads, SEO, and content marketing strategies for the Egyptian market.',
                'تعلم إعلانات فيسبوك وجوجل والسيو وتسويق المحتوى للسوق المصري.'
            ],
            category: 'Marketing',
            skillLevels: ['Beginner', 'Intermediate'],
        },
        {
            titles: ['IELTS Preparation Complete Guide', 'دليل التحضير الشامل لامتحان الآيلتس'],
            descriptions: [
                'Comprehensive IELTS preparation covering all four skills. Achieve your target band score.',
                'تحضير شامل لامتحان الآيلتس يغطي المهارات الأربع. احصل على الدرجة المطلوبة.'
            ],
            category: 'Languages',
            skillLevels: ['Intermediate', 'Advanced'],
        },
        {
            titles: ['Data Science with Python', 'علم البيانات بلغة بايثون'],
            descriptions: [
                'Learn data analysis, visualization, and machine learning using Python and popular libraries.',
                'تعلم تحليل البيانات والتصور والذكاء الاصطناعي باستخدام بايثون.'
            ],
            category: 'Technology',
            skillLevels: ['Intermediate', 'Advanced'],
        },
        {
            titles: ['Graphic Design Fundamentals', 'أساسيات التصميم الجرافيكي'],
            descriptions: [
                'Master Adobe Creative Suite and learn professional design principles and techniques.',
                'إتقان حزمة أدوبي التصميمية وتعلم مبادئ التصميم المهنية.'
            ],
            category: 'Design',
            skillLevels: ['Beginner', 'Intermediate'],
        },
    ]

    const courses = []
    for (let i = 0; i < 150; i++) {
        const template = getRandomElement(courseTemplates)
        const mentor = getRandomElement(mentors)
        const skillLevel = getRandomElement(template.skillLevels)
        
        const course = await prisma.course.create({
            data: {
                title: `${template.titles[0]} ${i + 1}`,
                titleAr: `${template.titles[1]} ${i + 1}`,
                description: template.descriptions[0],
                descriptionAr: template.descriptions[1],
                creatorId: mentor.creator.id,
                category: template.category,
                skillLevel: skillLevel,
                duration: Math.floor(Math.random() * 3000) + 600, // 10-60 hours
                language: 'ar',
                price: Math.floor(Math.random() * 400) + 100, // 100-500 EGP
                status: Math.random() > 0.1 ? ContentStatus.PUBLISHED : ContentStatus.DRAFT,
                publishedAt: Math.random() > 0.1 ? new Date() : null,
                totalViews: Math.floor(Math.random() * 5000) + 100,
                totalEnrollments: Math.floor(Math.random() * 200) + 10,
                rating: Math.random() * 2 + 3, // 3.0-5.0 rating
                thumbnail: `https://images.unsplash.com/photo-${1500000000 + Math.floor(Math.random() * 100000000)}?w=800&h=600&fit=crop&crop=center&auto=format&q=80`,
                syllabus: {
                    modules: [
                        {
                            title: `Module 1: Introduction`,
                            titleEn: `Module 1: Introduction`,
                            lessons: ['Lesson 1', 'Lesson 2', 'Lesson 3']
                        },
                        {
                            title: `Module 2: Advanced Concepts`,
                            titleEn: `Module 2: Advanced Concepts`,
                            lessons: ['Lesson 1', 'Lesson 2', 'Lesson 3', 'Lesson 4']
                        }
                    ]
                },
            },
        })
        courses.push(course)
    }

    console.log('📖 Creating lessons for courses...')
    // === CREATE LESSONS FOR COURSES ===
    const lessons = []
    for (const course of courses.slice(0, 100)) { // Add lessons to first 100 courses
        const lessonCount = Math.floor(Math.random() * 15) + 5; // 5-20 lessons per course
        
        for (let i = 0; i < lessonCount; i++) {
            const lesson = await prisma.lesson.create({
                data: {
                    courseId: course.id,
                    title: `Lesson ${i + 1}: ${getRandomElement(['Introduction', 'Fundamentals', 'Advanced Concepts', 'Practical Application', 'Case Study', 'Project Work'])}`,
                    titleAr: `الدرس ${i + 1}: ${getRandomElement(['مقدمة', 'الأساسيات', 'المفاهيم المتقدمة', 'التطبيق العملي', 'دراسة حالة', 'مشروع عملي'])}`,
                    description: `Detailed explanation of key concepts and practical applications.`,
                    descriptionAr: `شرح مفصل للمفاهيم الأساسية والتطبيقات العملية.`,
                    videoUrl: `https://example.com/videos/${course.id}_lesson_${i + 1}.mp4`,
                    duration: Math.floor(Math.random() * 1800) + 300, // 5-35 minutes
                    order: i + 1,
                    resources: {
                        slides: `slides_${i + 1}.pdf`,
                        exercises: `exercises_${i + 1}.pdf`,
                        code: i % 3 === 0 ? `code_${i + 1}.zip` : null
                    }
                },
            })
            lessons.push(lesson)
        }
    }

    console.log('📝 Creating enrollments and progress...')
    // === CREATE ENROLLMENTS ===
    const enrollments = []
    for (let i = 0; i < 1000; i++) { // 1000 enrollments
        const student = getRandomElement(students)
        const course = getRandomElement(courses.filter(c => c.status === ContentStatus.PUBLISHED))
        
        try {
            const enrollment = await prisma.enrollment.create({
                data: {
                    userId: student.id,
                    courseId: course.id,
                    progress: Math.floor(Math.random() * 100),
                    lastAccessedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Last 30 days
                    completedAt: Math.random() > 0.7 ? new Date() : null, // 30% completion rate
                },
            })
            enrollments.push(enrollment)
        } catch (error) {
            // Skip duplicates
        }
    }

    console.log('🤝 Creating study buddy matches...')
    // === CREATE STUDY BUDDY MATCHES ===
    for (let i = 0; i < 200; i++) { // 200 study buddy matches
        const user1 = getRandomElement(students)
        const user2 = getRandomElement(students.filter(s => s.id !== user1.id))
        
        try {
            await prisma.studyBuddyMatch.create({
                data: {
                    user1Id: user1.id,
                    user2Id: user2.id,
                    status: getRandomElement(['pending', 'accepted', 'blocked']),
                    sharedSubjects: getRandomElements(learningInterests, 3).join(','),
                    sharedGoals: getRandomElements(learningGoals, 2).join(','),
                },
            })
        } catch (error) {
            // Skip duplicates
        }
    }

    console.log('⭐ Creating course reviews...')
    // === CREATE REVIEWS ===
    for (let i = 0; i < 500; i++) { // 500 reviews
        const student = getRandomElement(students)
        const course = getRandomElement(courses.filter(c => c.status === ContentStatus.PUBLISHED))
        
        try {
            await prisma.review.create({
                data: {
                    userId: student.id,
                    courseId: course.id,
                    rating: Math.floor(Math.random() * 5) + 1,
                    title: getRandomElement([
                        'Excellent course!', 'Very helpful', 'Great content', 'Highly recommended',
                        'Good for beginners', 'Well structured', 'Amazing instructor', 'Worth the price'
                    ]),
                    comment: getRandomElement([
                        'This course exceeded my expectations. The instructor explains everything clearly.',
                        'Very practical and useful content. I learned so much!',
                        'Great course for beginners. Step by step explanations.',
                        'The examples and projects were very helpful.',
                        'Excellent content and presentation. Highly recommend!',
                        'Clear explanations and good pace. Very satisfied.'
                    ]),
                    helpful: Math.floor(Math.random() * 20),
                    verified: Math.random() > 0.3, // 70% verified
                },
            })
        } catch (error) {
            // Skip duplicates
        }
    }

    // Update course stats based on actual enrollments and reviews
    console.log('📊 Updating course statistics...')
    for (const course of courses) {
        const enrollmentCount = await prisma.enrollment.count({
            where: { courseId: course.id }
        })
        
        const reviewStats = await prisma.review.aggregate({
            where: { courseId: course.id },
            _avg: { rating: true },
            _count: { id: true }
        })
        
        await prisma.course.update({
            where: { id: course.id },
            data: {
                totalEnrollments: enrollmentCount,
                rating: reviewStats._avg.rating || 4.0,
            }
        })
    }

    console.log('🎉 Comprehensive demo database seeded successfully!')
    console.log('\n📊 Database Statistics:')
    console.log(`👤 Total Users: ${await prisma.user.count()}`)
    console.log(`🎓 Students: ${await prisma.user.count({ where: { role: UserRole.LEARNER } })}`)
    console.log(`👨‍🏫 Mentors/Creators: ${await prisma.user.count({ where: { role: UserRole.CREATOR } })}`)
    console.log(`📚 Total Courses: ${await prisma.course.count()}`)
    console.log(`📖 Total Lessons: ${await prisma.lesson.count()}`)
    console.log(`📝 Total Enrollments: ${await prisma.enrollment.count()}`)
    console.log(`⭐ Total Reviews: ${await prisma.review.count()}`)
    console.log(`🤝 Study Buddy Matches: ${await prisma.studyBuddyMatch.count()}`)
    
    console.log('\n🔐 Demo Login Credentials:')
    console.log('📧 Admin: admin@prime.eg / demo123')
    console.log('🎓 Any student: [check users with LEARNER role] / demo123')
    console.log('👨‍🏫 Any mentor: [check users with CREATOR role] / demo123')
    console.log('\n✨ The platform now looks like a thriving educational ecosystem!')
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })