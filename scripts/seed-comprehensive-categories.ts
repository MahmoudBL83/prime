import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Define comprehensive categories for Egyptian EdTech platform
const CATEGORIES = [
  {
    english: 'Programming & Development',
    arabic: 'البرمجة والتطوير',
    subcategories: ['Web Development', 'Mobile Apps', 'Software Engineering', 'Game Development']
  },
  {
    english: 'Business & Entrepreneurship', 
    arabic: 'الأعمال وريادة المشاريع',
    subcategories: ['Digital Marketing', 'E-commerce', 'Project Management', 'Leadership']
  },
  {
    english: 'Design & Creative Arts',
    arabic: 'التصميم والفنون الإبداعية', 
    subcategories: ['Graphic Design', 'UI/UX Design', 'Photography', 'Video Editing']
  },
  {
    english: 'Data Science & Analytics',
    arabic: 'علوم البيانات والتحليلات',
    subcategories: ['Data Analysis', 'Machine Learning', 'Business Intelligence', 'Statistics']
  },
  {
    english: 'Digital Marketing',
    arabic: 'التسويق الرقمي',
    subcategories: ['Social Media Marketing', 'SEO', 'Content Marketing', 'Google Ads']
  },
  {
    english: 'Languages & Communication',
    arabic: 'اللغات والتواصل',
    subcategories: ['English Language', 'Arabic Literature', 'Public Speaking', 'Writing Skills']
  },
  {
    english: 'Health & Wellness',
    arabic: 'الصحة والعافية',
    subcategories: ['Nutrition', 'Fitness', 'Mental Health', 'Yoga']
  },
  {
    english: 'Finance & Accounting',
    arabic: 'المالية والمحاسبة',
    subcategories: ['Personal Finance', 'Investment', 'Accounting', 'Cryptocurrency']
  },
  {
    english: 'Science & Engineering',
    arabic: 'العلوم والهندسة',
    subcategories: ['Mathematics', 'Physics', 'Engineering', 'Chemistry']
  },
  {
    english: 'Personal Development',
    arabic: 'التنمية الشخصية',
    subcategories: ['Productivity', 'Time Management', 'Career Development', 'Life Coaching']
  },
  {
    english: 'Technology & Innovation',
    arabic: 'التكنولوجيا والابتكار',
    subcategories: ['Artificial Intelligence', 'Cybersecurity', 'Cloud Computing', 'IoT']
  },
  {
    english: 'Education & Teaching',
    arabic: 'التعليم والتدريس',
    subcategories: ['Online Teaching', 'Educational Technology', 'Curriculum Development', 'Student Assessment']
  }
]

// Define comprehensive demo courses with proper categorization
const DEMO_COURSES = [
  // Programming & Development
  {
    title: 'Complete Web Development Bootcamp',
    titleAr: 'دورة تطوير المواقع الشاملة',
    description: 'Learn HTML, CSS, JavaScript, React, Node.js, and MongoDB to become a full-stack web developer.',
    descriptionAr: 'تعلم HTML و CSS و JavaScript و React و Node.js و MongoDB لتصبح مطور ويب متكامل.',
    category: 'Programming & Development',
    categoryAr: 'البرمجة والتطوير',
    skillLevel: 'Beginner',
    skillLevelAr: 'مبتدئ',
    duration: 480, // 8 hours
    price: 599.99,
    language: 'ar'
  },
  {
    title: 'Mobile App Development with React Native',
    titleAr: 'تطوير تطبيقات الموبايل باستخدام React Native',
    description: 'Build cross-platform mobile applications for iOS and Android using React Native.',
    descriptionAr: 'بناء تطبيقات الموبايل متعددة المنصات لأنظمة iOS و Android باستخدام React Native.',
    category: 'Programming & Development',
    categoryAr: 'البرمجة والتطوير',
    skillLevel: 'Intermediate',
    skillLevelAr: 'متوسط',
    duration: 360,
    price: 499.99,
    language: 'ar'
  },
  {
    title: 'Python for Beginners',
    titleAr: 'بايثون للمبتدئين',
    description: 'Master Python programming from scratch with practical projects and real-world examples.',
    descriptionAr: 'إتقان برمجة بايثون من الصفر مع مشاريع عملية وأمثلة واقعية.',
    category: 'Programming & Development',
    categoryAr: 'البرمجة والتطوير',
    skillLevel: 'Beginner',
    skillLevelAr: 'مبتدئ',
    duration: 240,
    price: 299.99,
    language: 'ar'
  },

  // Business & Entrepreneurship
  {
    title: 'Digital Entrepreneurship in the Middle East',
    titleAr: 'ريادة الأعمال الرقمية في الشرق الأوسط',
    description: 'Learn how to start and scale a digital business in the MENA region.',
    descriptionAr: 'تعلم كيفية بدء وتوسيع نشاط تجاري رقمي في منطقة الشرق الأوسط وشمال أفريقيا.',
    category: 'Business & Entrepreneurship',
    categoryAr: 'الأعمال وريادة المشاريع',
    skillLevel: 'Intermediate',
    skillLevelAr: 'متوسط',
    duration: 300,
    price: 449.99,
    language: 'ar'
  },
  {
    title: 'E-commerce Business Mastery',
    titleAr: 'إتقان التجارة الإلكترونية',
    description: 'Build a successful online store and master e-commerce strategies for the Arab market.',
    descriptionAr: 'بناء متجر إلكتروني ناجح وإتقان استراتيجيات التجارة الإلكترونية في السوق العربي.',
    category: 'Business & Entrepreneurship',
    categoryAr: 'الأعمال وريادة المشاريع',
    skillLevel: 'Beginner',
    skillLevelAr: 'مبتدئ',
    duration: 420,
    price: 399.99,
    language: 'ar'
  },

  // Design & Creative Arts
  {
    title: 'Graphic Design with Adobe Creative Suite',
    titleAr: 'التصميم الجرافيكي باستخدام Adobe Creative Suite',
    description: 'Master Photoshop, Illustrator, and InDesign to create stunning visual designs.',
    descriptionAr: 'إتقان Photoshop و Illustrator و InDesign لإنشاء تصاميم بصرية مذهلة.',
    category: 'Design & Creative Arts',
    categoryAr: 'التصميم والفنون الإبداعية',
    skillLevel: 'Beginner',
    skillLevelAr: 'مبتدئ',
    duration: 360,
    price: 349.99,
    language: 'ar'
  },
  {
    title: 'UI/UX Design for Mobile Apps',
    titleAr: 'تصميم واجهة وتجربة المستخدم للتطبيقات',
    description: 'Design beautiful and user-friendly mobile interfaces using modern design principles.',
    descriptionAr: 'تصميم واجهات موبايل جميلة وسهلة الاستخدام باستخدام مبادئ التصميم الحديثة.',
    category: 'Design & Creative Arts',
    categoryAr: 'التصميم والفنون الإبداعية',
    skillLevel: 'Intermediate',
    skillLevelAr: 'متوسط',
    duration: 300,
    price: 459.99,
    language: 'ar'
  },

  // Data Science & Analytics
  {
    title: 'Data Analysis with Python and Pandas',
    titleAr: 'تحليل البيانات باستخدام Python و Pandas',
    description: 'Learn to analyze and visualize data using Python, Pandas, and modern data science tools.',
    descriptionAr: 'تعلم تحليل وتمثيل البيانات باستخدام Python و Pandas وأدوات علوم البيانات الحديثة.',
    category: 'Data Science & Analytics',
    categoryAr: 'علوم البيانات والتحليلات',
    skillLevel: 'Intermediate',
    skillLevelAr: 'متوسط',
    duration: 400,
    price: 549.99,
    language: 'ar'
  },
  {
    title: 'Machine Learning Fundamentals',
    titleAr: 'أساسيات تعلم الآلة',
    description: 'Introduction to machine learning algorithms and their practical applications.',
    descriptionAr: 'مقدمة في خوارزميات تعلم الآلة وتطبيقاتها العملية.',
    category: 'Data Science & Analytics',
    categoryAr: 'علوم البيانات والتحليلات',
    skillLevel: 'Advanced',
    skillLevelAr: 'متقدم',
    duration: 480,
    price: 699.99,
    language: 'ar'
  },

  // Digital Marketing
  {
    title: 'Social Media Marketing Strategy',
    titleAr: 'استراتيجية التسويق عبر وسائل التواصل الاجتماعي',
    description: 'Master Facebook, Instagram, and TikTok marketing for the Arab audience.',
    descriptionAr: 'إتقان التسويق عبر فيسبوك وإنستغرام وتيك توك للجمهور العربي.',
    category: 'Digital Marketing',
    categoryAr: 'التسويق الرقمي',
    skillLevel: 'Beginner',
    skillLevelAr: 'مبتدئ',
    duration: 240,
    price: 299.99,
    language: 'ar'
  },
  {
    title: 'Google Ads and SEO Mastery',
    titleAr: 'إتقان إعلانات جوجل وتحسين محركات البحث',
    description: 'Complete guide to Google Ads, SEO, and digital advertising in Arabic markets.',
    descriptionAr: 'دليل شامل لإعلانات جوجل وتحسين محركات البحث والإعلان الرقمي في الأسواق العربية.',
    category: 'Digital Marketing',
    categoryAr: 'التسويق الرقمي',
    skillLevel: 'Intermediate',
    skillLevelAr: 'متوسط',
    duration: 360,
    price: 449.99,
    language: 'ar'
  },

  // Languages & Communication
  {
    title: 'Business English for Professionals',
    titleAr: 'الإنجليزية التجارية للمهنيين',
    description: 'Improve your business English skills for professional success in international markets.',
    descriptionAr: 'حسن مهاراتك في الإنجليزية التجارية للنجاح المهني في الأسواق الدولية.',
    category: 'Languages & Communication',
    categoryAr: 'اللغات والتواصل',
    skillLevel: 'Intermediate',
    skillLevelAr: 'متوسط',
    duration: 300,
    price: 199.99,
    language: 'ar'
  },
  {
    title: 'Public Speaking and Presentation Skills',
    titleAr: 'مهارات الخطابة والعرض',
    description: 'Master the art of public speaking and create compelling presentations.',
    descriptionAr: 'إتقان فن الخطابة وإنشاء عروض تقديمية مقنعة.',
    category: 'Languages & Communication',
    categoryAr: 'اللغات والتواصل',
    skillLevel: 'Beginner',
    skillLevelAr: 'مبتدئ',
    duration: 180,
    price: 149.99,
    language: 'ar'
  },

  // Finance & Accounting
  {
    title: 'Personal Finance and Investment',
    titleAr: 'المالية الشخصية والاستثمار',
    description: 'Learn how to manage your money and invest wisely in the Egyptian market.',
    descriptionAr: 'تعلم كيفية إدارة أموالك والاستثمار بحكمة في السوق المصري.',
    category: 'Finance & Accounting',
    categoryAr: 'المالية والمحاسبة',
    skillLevel: 'Beginner',
    skillLevelAr: 'مبتدئ',
    duration: 240,
    price: 199.99,
    language: 'ar'
  },

  // Personal Development
  {
    title: 'Time Management and Productivity',
    titleAr: 'إدارة الوقت والإنتاجية',
    description: 'Boost your productivity and achieve work-life balance with proven time management techniques.',
    descriptionAr: 'عزز إنتاجيتك وحقق التوازن بين العمل والحياة بتقنيات إدارة الوقت المثبتة.',
    category: 'Personal Development',
    categoryAr: 'التنمية الشخصية',
    skillLevel: 'Beginner',
    skillLevelAr: 'مبتدئ',
    duration: 120,
    price: 99.99,
    language: 'ar'
  },
  {
    title: 'Career Development and Leadership',
    titleAr: 'تطوير المهنة والقيادة',
    description: 'Develop leadership skills and advance your career in the modern workplace.',
    descriptionAr: 'تطوير مهارات القيادة وتقدم في مهنتك في بيئة العمل الحديثة.',
    category: 'Personal Development',
    categoryAr: 'التنمية الشخصية',
    skillLevel: 'Intermediate',
    skillLevelAr: 'متوسط',
    duration: 240,
    price: 299.99,
    language: 'ar'
  }
]

async function seedCategoriesAndCourses() {
  try {
    console.log('🌱 Starting comprehensive categories and courses seeding...')

    // First, let's check if we have any existing courses
    const existingCoursesCount = await prisma.course.count()
    console.log(`📊 Found ${existingCoursesCount} existing courses`)

    // Check if we have a creator to associate courses with
    let creator = await prisma.creator.findFirst({
      include: { user: true }
    })

    // If no creator exists, create one
    if (!creator) {
      console.log('👨‍🏫 No creator found, creating demo creator...')
      
      // First create a user
      const demoUser = await prisma.user.create({
        data: {
          email: 'demo.instructor@egyptian-edtech.com',
          name: 'Ahmed Hassan',
          arabicName: 'أحمد حسن',
          passwordHash: 'demo_password_hash',
          role: 'CREATOR',
          bio: 'Experienced instructor with 10+ years in technology education',
          onboardingCompleted: true
        }
      })

      // Then create the creator profile
      creator = await prisma.creator.create({
        data: {
          userId: demoUser.id,
          kycStatus: 'VERIFIED',
          expertise: 'Technology, Programming, Digital Marketing',
          teachingGoals: 'Help students build practical skills for the modern job market',
          contractSigned: true,
          contractSignedAt: new Date(),
          hourlyRate: 50,
          availableForMeetings: true,
          timezone: 'Africa/Cairo',
          languages: 'Arabic, English'
        },
        include: { user: true }
      })

      console.log(`✅ Created demo creator: ${creator.user.name}`)
    }

    // Create demo courses
    console.log('📚 Creating demo courses with comprehensive categories...')
    
    const createdCourses = []
    
    for (const courseData of DEMO_COURSES) {
      try {
        const course = await prisma.course.create({
          data: {
            ...courseData,
            creatorId: creator.id,
            status: 'PUBLISHED',
            publishedAt: new Date(),
            syllabus: {
              lessons: [
                {
                  title: `Introduction to ${courseData.title.split(' ')[0]}`,
                  titleAr: `مقدمة في ${courseData.titleAr?.split(' ')[0] || ''}`,
                  duration: 30,
                  order: 1
                },
                {
                  title: 'Fundamentals and Core Concepts',
                  titleAr: 'الأساسيات والمفاهيم الأساسية',
                  duration: 45,
                  order: 2
                },
                {
                  title: 'Practical Exercises and Projects',
                  titleAr: 'التمارين العملية والمشاريع',
                  duration: 60,
                  order: 3
                },
                {
                  title: 'Advanced Techniques',
                  titleAr: 'التقنيات المتقدمة',
                  duration: 40,
                  order: 4
                },
                {
                  title: 'Final Project and Assessment',
                  titleAr: 'المشروع النهائي والتقييم',
                  duration: 45,
                  order: 5
                }
              ]
            },
            rating: 4.2 + Math.random() * 0.8, // Random rating between 4.2-5.0
            totalViews: Math.floor(Math.random() * 5000) + 100,
            totalEnrollments: Math.floor(Math.random() * 500) + 10
          }
        })
        
        createdCourses.push(course)
        console.log(`✅ Created: ${course.title} (${course.category})`)
        
      } catch (error) {
        console.error(`❌ Failed to create course "${courseData.title}":`, error.message)
      }
    }

    // Update existing courses with better categories if they don't have Arabic categories
    console.log('🔄 Updating existing courses with missing Arabic categories...')
    
    const existingCourses = await prisma.course.findMany({
      where: {
        OR: [
          { categoryAr: null },
          { categoryAr: '' }
        ]
      }
    })

    for (const existingCourse of existingCourses) {
      // Find matching category
      const matchingCategory = CATEGORIES.find(cat => 
        cat.english === existingCourse.category || 
        cat.english.toLowerCase().includes(existingCourse.category?.toLowerCase() || '') ||
        existingCourse.category?.toLowerCase().includes(cat.english.toLowerCase())
      )

      if (matchingCategory) {
        await prisma.course.update({
          where: { id: existingCourse.id },
          data: {
            categoryAr: matchingCategory.arabic,
            // Also update skill level if not in Arabic
            skillLevelAr: existingCourse.skillLevel === 'Beginner' ? 'مبتدئ' :
                         existingCourse.skillLevel === 'Intermediate' ? 'متوسط' :
                         existingCourse.skillLevel === 'Advanced' ? 'متقدم' : existingCourse.skillLevelAr
          }
        })
        console.log(`🔄 Updated "${existingCourse.title}" with Arabic category: ${matchingCategory.arabic}`)
      }
    }

    // Final statistics
    const finalCourseCount = await prisma.course.count()
    const categoriesCount = await prisma.course.groupBy({
      by: ['category'],
      _count: { category: true }
    })

    console.log('\n🎉 Seeding completed successfully!')
    console.log(`📊 Total courses: ${finalCourseCount}`)
    console.log(`📂 Categories created: ${CATEGORIES.length}`)
    console.log(`✨ New courses added: ${createdCourses.length}`)
    
    console.log('\n📋 Categories distribution:')
    categoriesCount.forEach(cat => {
      const arabicName = CATEGORIES.find(c => c.english === cat.category)?.arabic || 'غير محدد'
      console.log(`  ${cat.category} (${arabicName}): ${cat._count.category} courses`)
    })

    console.log('\n🚀 Your Egyptian EdTech platform now has comprehensive categories for an amazing demo!')
    
  } catch (error) {
    console.error('❌ Error during seeding:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seeding
seedCategoriesAndCourses()
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })