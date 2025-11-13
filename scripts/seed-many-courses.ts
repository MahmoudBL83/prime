import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const categories = [
    { name: 'Programming', nameAr: 'البرمجة' },
    { name: 'Design', nameAr: 'التصميم' },
    { name: 'Business', nameAr: 'الأعمال' },
    { name: 'Marketing', nameAr: 'التسويق' },
    { name: 'Photography', nameAr: 'التصوير' },
    { name: 'Music', nameAr: 'الموسيقى' },
    { name: 'Health & Fitness', nameAr: 'الصحة واللياقة' },
    { name: 'Language', nameAr: 'اللغات' },
    { name: 'Science', nameAr: 'العلوم' },
    { name: 'Mathematics', nameAr: 'الرياضيات' },
]

const skillLevels = ['Beginner', 'Intermediate', 'Advanced']

const courseTitles = {
    Programming: [
        'Complete Web Development Bootcamp',
        'Python for Data Science',
        'JavaScript Mastery Course',
        'React & Next.js Full Course',
        'Node.js Backend Development',
        'Flutter Mobile App Development',
        'PHP & Laravel Complete Guide',
        'Vue.js 3 Masterclass',
        'TypeScript Essential Training',
        'Full Stack MERN Development',
        'Angular Complete Course',
        'Docker & Kubernetes for Developers',
        'GraphQL API Development',
        'Swift iOS Development',
        'Java Spring Boot Mastery',
        'C# .NET Core Development',
        'Ruby on Rails Complete Guide',
        'Django Web Framework',
        'Go Programming Language',
        'Rust Systems Programming',
    ],
    Design: [
        'UI/UX Design Fundamentals',
        'Adobe Photoshop Mastery',
        'Figma Design Complete Course',
        'Graphic Design Essentials',
        'Web Design with Tailwind CSS',
        'Adobe Illustrator Advanced',
        'Motion Graphics with After Effects',
        'Product Design Thinking',
        'Brand Identity Design',
        'Typography Masterclass',
        'Color Theory for Designers',
        'Mobile App UI Design',
        'Sketch App Complete Guide',
        'InDesign for Print Design',
        ' 3D Design with Blender',
        'Game UI/UX Design',
        'Design Systems Creation',
        'Wireframing & Prototyping',
        'Adobe XD Complete Course',
        'Portfolio Design Mastery',
    ],
    Business: [
        'Entrepreneurship Fundamentals',
        'Business Strategy & Planning',
        'Financial Management Basics',
        'Project Management Professional',
        'Leadership & Team Management',
        'Sales & Negotiation Skills',
        'Business Analytics',
        'Supply Chain Management',
        'Human Resources Management',
        'Operations Management',
        'Business Communication',
        'Strategic Marketing',
        'E-commerce Business Setup',
        'Startup Funding Strategies',
        'Business Law Essentials',
        'Corporate Finance',
        'Risk Management',
        'International Business',
        'Business Process Optimization',
        'Agile Business Methods',
    ],
    Marketing: [
        'Digital Marketing Complete Guide',
        'Social Media Marketing Mastery',
        'SEO & Content Marketing',
        'Email Marketing Strategies',
        'Facebook Ads Mastery',
        'Google Ads Certification',
        'Instagram Marketing Complete',
        'YouTube Marketing & Growth',
        'Affiliate Marketing Success',
        'Influencer Marketing',
        'Marketing Analytics',
        'Content Creation Strategies',
        'Copywriting Masterclass',
        'Brand Marketing',
        'Video Marketing Complete',
        'TikTok Marketing Guide',
        'LinkedIn Marketing',
        'Marketing Automation',
        'Growth Hacking Tactics',
        'Conversion Rate Optimization',
    ],
    Photography: [
        'Photography for Beginners',
        'Portrait Photography Mastery',
        'Landscape Photography Guide',
        'Adobe Lightroom Complete',
        'Product Photography Essentials',
        'Wedding Photography Business',
        'Street Photography Art',
        'Food Photography Styling',
        'Photo Editing Mastery',
        'Camera Techniques Advanced',
        'Studio Lighting Setup',
        'Wildlife Photography',
        'Fashion Photography',
        'Real Estate Photography',
        'Drone Photography & Videography',
        'Black & White Photography',
        'Newborn Photography',
        'Sports Photography',
        'Night Photography Techniques',
        'Mobile Photography Mastery',
    ],
    Music: [
        'Music Theory Fundamentals',
        'Guitar Playing Complete Course',
        'Piano for Beginners',
        'Music Production with Ableton',
        'FL Studio Music Making',
        'Vocal Training Masterclass',
        'DJ & Electronic Music',
        'Songwriting & Composition',
        'Audio Mixing & Mastering',
        'Music Business & Marketing',
        'Drums & Percussion',
        'Bass Guitar Techniques',
        'Violin Complete Course',
        'Jazz Music Theory',
        'Classical Music Appreciation',
        'Music Recording at Home',
        'Sound Design for Games',
        'Hip Hop Production',
        'Electronic Music Theory',
        'Music Copyright & Licensing',
    ],
    'Health & Fitness': [
        'Nutrition & Healthy Eating',
        'Yoga for Beginners',
        'Personal Training Certification',
        'Weight Loss Strategies',
        'Bodybuilding & Muscle Gain',
        'Mental Health & Wellness',
        'Meditation & Mindfulness',
        'CrossFit Training Guide',
        'Running & Marathon Training',
        'Pilates Complete Course',
        'Strength Training Basics',
        'Cardio Fitness Programs',
        'Flexibility & Stretching',
        'Sports Nutrition',
        'Home Workout Programs',
        'Stress Management',
        'Sleep Optimization',
        'Functional Fitness',
        'HIIT Training Mastery',
        'Holistic Health Coaching',
    ],
    Language: [
        'English Grammar Complete',
        'Spanish for Beginners',
        'French Language Mastery',
        'German Language Course',
        'Mandarin Chinese Essentials',
        'Arabic Language Complete',
        'Japanese for Beginners',
        'Italian Language Guide',
        'Portuguese Language',
        'Russian Language Course',
        'English Speaking Confidence',
        'IELTS Preparation',
        'TOEFL Complete Guide',
        'Business English',
        'English Pronunciation',
        'Korean Language Basics',
        'Dutch Language Course',
        'Turkish Language',
        'Hindi for Beginners',
        'Sign Language Essentials',
    ],
    Science: [
        'Physics Fundamentals',
        'Chemistry Complete Course',
        'Biology Essentials',
        'Environmental Science',
        'Astronomy & Space Science',
        'Geology & Earth Science',
        'Microbiology Basics',
        'Organic Chemistry',
        'Quantum Physics',
        'Genetics & DNA Science',
        'Neuroscience Fundamentals',
        'Ecology & Conservation',
        'Climate Science',
        'Marine Biology',
        'Biochemistry Essentials',
        'Anatomy & Physiology',
        'Molecular Biology',
        'Thermodynamics',
        'Nuclear Physics',
        'Scientific Research Methods',
    ],
    Mathematics: [
        'Algebra Fundamentals',
        'Calculus Complete Course',
        'Statistics & Probability',
        'Linear Algebra',
        'Geometry Essentials',
        'Trigonometry Mastery',
        'Differential Equations',
        'Mathematical Logic',
        'Number Theory',
        'Discrete Mathematics',
        'Advanced Calculus',
        'Applied Mathematics',
        'Financial Mathematics',
        'Game Theory',
        'Cryptography Mathematics',
        'Topology Basics',
        'Mathematical Modeling',
        'Complex Analysis',
        'Numerical Methods',
        'Mathematical Statistics',
    ],
}

const descriptions = [
    'Master the fundamentals and advanced concepts in this comprehensive course designed for all skill levels.',
    'Learn from industry experts with real-world projects and hands-on exercises.',
    'Transform your career with practical skills and industry-recognized certification.',
    'Complete guide covering everything from basics to advanced techniques with lifetime access.',
    'Boost your expertise with this in-depth course featuring quizzes, assignments, and projects.',
    'Join thousands of successful students who have mastered this subject.',
    'Step-by-step training with downloadable resources and community support.',
    'Accelerate your learning with proven techniques and best practices.',
    'Professional-level training with certificate upon completion.',
    'Comprehensive curriculum designed by leading practitioners in the field.',
]

async function main() {
    console.log('🌱 Starting to seed many courses...')

    // Get all users with CREATOR role
    const creators = await prisma.user.findMany({
        where: { role: 'CREATOR' },
        include: { creator: true }
    })

    if (creators.length === 0) {
        console.log('❌ No creators found. Please run seed-instructors.ts first.')
        return
    }

    console.log(`✅ Found ${creators.length} creators`)

    let totalCoursesCreated = 0

    for (const categoryData of categories) {
        const titles = courseTitles[categoryData.name as keyof typeof courseTitles] || []
        
        console.log(`\n📚 Creating courses for category: ${categoryData.name}`)

        for (let i = 0; i < titles.length; i++) {
            const title = titles[i]
            const creator = creators[Math.floor(Math.random() * creators.length)]
            const skillLevel = skillLevels[Math.floor(Math.random() * skillLevels.length)]
            const description = descriptions[Math.floor(Math.random() * descriptions.length)]
            
            // Random values for engagement
            const totalViews = Math.floor(Math.random() * 50000) + 1000
            const totalEnrollments = Math.floor(Math.random() * 5000) + 100
            const rating = (Math.random() * 2 + 3).toFixed(1) // Between 3.0 and 5.0
            const duration = Math.floor(Math.random() * 18000) + 3600 // 1-6 hours in seconds

            try {
                const course = await prisma.course.create({
                    data: {
                        title: title,
                        titleAr: `${title} - بالعربية`,
                        description: description,
                        descriptionAr: `${description} - شرح بالعربية`,
                        category: categoryData.name,
                        categoryAr: categoryData.nameAr,
                        skillLevel: skillLevel,
                        language: 'English',
                        duration: duration,
                        price: Math.floor(Math.random() * 200) + 50, // $50-$250
                        status: 'PUBLISHED',
                        creatorId: creator.creator!.id,
                        totalViews: totalViews,
                        totalEnrollments: totalEnrollments,
                        rating: parseFloat(rating),
                        thumbnail: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 200000000)}?w=600&h=900&fit=crop`,
                        syllabus: [], // Empty array for syllabus
                        
                        // Add some lessons
                        lessons: {
                            create: [
                                {
                                    title: 'Introduction',
                                    titleAr: 'مقدمة',
                                    description: 'Course introduction and overview',
                                    descriptionAr: 'مقدمة ونظرة عامة على الدورة',
                                    duration: Math.floor(duration * 0.1),
                                    order: 1,
                                    videoUrl: 'https://example.com/intro.mp4',
                                },
                                {
                                    title: 'Getting Started',
                                    titleAr: 'البداية',
                                    description: 'Setting up your environment',
                                    descriptionAr: 'إعداد بيئة العمل',
                                    duration: Math.floor(duration * 0.15),
                                    order: 2,
                                    videoUrl: 'https://example.com/lesson1.mp4',
                                },
                                {
                                    title: 'Core Concepts',
                                    titleAr: 'المفاهيم الأساسية',
                                    description: 'Understanding the fundamentals',
                                    descriptionAr: 'فهم الأساسيات',
                                    duration: Math.floor(duration * 0.25),
                                    order: 3,
                                    videoUrl: 'https://example.com/lesson2.mp4',
                                },
                                {
                                    title: 'Advanced Techniques',
                                    titleAr: 'التقنيات المتقدمة',
                                    description: 'Mastering advanced skills',
                                    descriptionAr: 'إتقان المهارات المتقدمة',
                                    duration: Math.floor(duration * 0.3),
                                    order: 4,
                                    videoUrl: 'https://example.com/lesson3.mp4',
                                },
                                {
                                    title: 'Final Project',
                                    titleAr: 'المشروع النهائي',
                                    description: 'Apply everything you learned',
                                    descriptionAr: 'طبق كل ما تعلمته',
                                    duration: Math.floor(duration * 0.2),
                                    order: 5,
                                    videoUrl: 'https://example.com/final.mp4',
                                },
                            ],
                        },
                    },
                })

                totalCoursesCreated++
                process.stdout.write(`\r  ✅ Created: ${totalCoursesCreated} courses`)
            } catch (error) {
                console.error(`\n  ❌ Error creating course "${title}":`, error)
            }
        }
    }

    console.log(`\n\n🎉 Successfully created ${totalCoursesCreated} courses across ${categories.length} categories!`)
    console.log(`📊 Average of ${Math.floor(totalCoursesCreated / categories.length)} courses per category`)
}

main()
    .catch((e) => {
        console.error('❌ Error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
