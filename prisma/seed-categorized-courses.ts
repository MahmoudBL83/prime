import { PrismaClient, UserRole, KYCStatus, ContentStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Course categories with Arabic and English names
const categories = [
  {
    key: 'programming',
    name: 'Programming',
    nameAr: 'البرمجة',
    nameDe: 'Programmierung',
    icon: '💻',
    color: '#3B82F6'
  },
  {
    key: 'web-development',
    name: 'Web Development',
    nameAr: 'تطوير الويب',
    nameDe: 'Webentwicklung',
    icon: '🌐',
    color: '#10B981'
  },
  {
    key: 'mobile-development',
    name: 'Mobile Development',
    nameAr: 'تطوير تطبيقات الجوال',
    nameDe: 'Mobile Entwicklung',
    icon: '📱',
    color: '#8B5CF6'
  },
  {
    key: 'data-science',
    name: 'Data Science',
    nameAr: 'علوم البيانات',
    nameDe: 'Datenwissenschaft',
    icon: '📊',
    color: '#F59E0B'
  },
  {
    key: 'ai',
    name: 'Artificial Intelligence',
    nameAr: 'الذكاء الاصطناعي',
    nameDe: 'Künstliche Intelligenz',
    icon: '🤖',
    color: '#EC4899'
  },
  {
    key: 'design',
    name: 'Design',
    nameAr: 'التصميم',
    nameDe: 'Design',
    icon: '🎨',
    color: '#6366F1'
  },
  {
    key: 'business',
    name: 'Business',
    nameAr: 'الأعمال',
    nameDe: 'Geschäft',
    icon: '💼',
    color: '#14B8A6'
  },
  {
    key: 'marketing',
    name: 'Marketing',
    nameAr: 'التسويق',
    nameDe: 'Marketing',
    icon: '📢',
    color: '#F97316'
  }
]

// Demo courses with proper categorization
const demoCourses = [
  // Programming Courses
  {
    title: 'Complete Python Programming Masterclass',
    titleAr: 'دورة برمجة بايثون الشاملة',
    titleDe: 'Vollständiger Python-Programmier-Meisterkurs',
    description: 'Master Python programming from basics to advanced concepts including OOP, data structures, and real-world projects.',
    descriptionAr: 'إتقان برمجة بايثون من الأساسيات إلى المفاهيم المتقدمة بما في ذلك البرمجة الكائنية وهياكل البيانات والمشاريع العملية.',
    descriptionDe: 'Meistern Sie die Python-Programmierung von den Grundlagen bis zu fortgeschrittenen Konzepten einschließlich OOP, Datenstrukturen und realen Projekten.',
    category: 'programming',
    categoryAr: 'البرمجة',
    categoryDe: 'Programmierung',
    skillLevel: 'Beginner',
    skillLevelAr: 'مبتدئ',
    skillLevelDe: 'Anfänger',
    duration: 2400, // 40 hours
    price: 499,
    rating: 4.8,
    totalEnrollments: 1250,
    totalViews: 5600,
    instructorName: 'Dr. Ahmed Hassan',
    instructorNameAr: 'د. أحمد حسن',
    thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&h=450&fit=crop&q=80',
    lessonsCount: 85
  },
  {
    title: 'JavaScript Full Stack Development',
    titleAr: 'تطوير تطبيقات الويب الكاملة بجافاسكريبت',
    titleDe: 'JavaScript Full Stack Entwicklung',
    description: 'Learn to build complete web applications using JavaScript, Node.js, Express, React, and MongoDB.',
    descriptionAr: 'تعلم بناء تطبيقات ويب كاملة باستخدام جافاسكريبت، Node.js، Express، React، و MongoDB.',
    descriptionDe: 'Lernen Sie, vollständige Webanwendungen mit JavaScript, Node.js, Express, React und MongoDB zu erstellen.',
    category: 'web-development',
    categoryAr: 'تطوير الويب',
    categoryDe: 'Webentwicklung',
    skillLevel: 'Intermediate',
    skillLevelAr: 'متوسط',
    skillLevelDe: 'Mittelstufe',
    duration: 3000, // 50 hours
    price: 599,
    rating: 4.9,
    totalEnrollments: 2100,
    totalViews: 8900,
    instructorName: 'Mohamed Ali',
    instructorNameAr: 'محمد علي',
    thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&h=450&fit=crop&q=80',
    lessonsCount: 120
  },
  {
    title: 'React Native Mobile App Development',
    titleAr: 'تطوير تطبيقات الجوال بReact Native',
    titleDe: 'React Native Mobile App Entwicklung',
    description: 'Build iOS and Android apps using React Native. Learn navigation, state management, and API integration.',
    descriptionAr: 'بناء تطبيقات iOS و Android باستخدام React Native. تعلم التنقل وإدارة الحالة ودمج APIs.',
    descriptionDe: 'Erstellen Sie iOS- und Android-Apps mit React Native. Lernen Sie Navigation, State Management und API-Integration.',
    category: 'mobile-development',
    categoryAr: 'تطوير تطبيقات الجوال',
    categoryDe: 'Mobile Entwicklung',
    skillLevel: 'Intermediate',
    skillLevelAr: 'متوسط',
    skillLevelDe: 'Mittelstufe',
    duration: 2700, // 45 hours
    price: 549,
    rating: 4.7,
    totalEnrollments: 980,
    totalViews: 4200,
    instructorName: 'Sara Ahmed',
    instructorNameAr: 'سارة أحمد',
    thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=450&fit=crop&q=80',
    lessonsCount: 95
  },
  {
    title: 'Data Science with Python & Machine Learning',
    titleAr: 'علوم البيانات مع بايثون والتعلم الآلي',
    titleDe: 'Datenwissenschaft mit Python & Maschinelles Lernen',
    description: 'Complete data science course covering pandas, NumPy, scikit-learn, and machine learning algorithms.',
    descriptionAr: 'دورة علوم البيانات الشاملة تغطي pandas و NumPy و scikit-learn وخوارزميات التعلم الآلي.',
    descriptionDe: 'Vollständiger Datenwissenschaftskurs mit pandas, NumPy, scikit-learn und Machine Learning-Algorithmen.',
    category: 'data-science',
    categoryAr: 'علوم البيانات',
    categoryDe: 'Datenwissenschaft',
    skillLevel: 'Advanced',
    skillLevelAr: 'متقدم',
    skillLevelDe: 'Fortgeschritten',
    duration: 3600, // 60 hours
    price: 699,
    rating: 4.9,
    totalEnrollments: 1450,
    totalViews: 6800,
    instructorName: 'Dr. Fatma Ibrahim',
    instructorNameAr: 'د. فاطمة إبراهيم',
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop&q=80',
    lessonsCount: 140
  },
  {
    title: 'Deep Learning & Neural Networks',
    titleAr: 'التعلم العميق والشبكات العصبية',
    titleDe: 'Deep Learning & Neuronale Netze',
    description: 'Master deep learning using TensorFlow and PyTorch. Build neural networks for computer vision and NLP.',
    descriptionAr: 'إتقان التعلم العميق باستخدام TensorFlow و PyTorch. بناء الشبكات العصبية لرؤية الكمبيوتر ومعالجة اللغات الطبيعية.',
    descriptionDe: 'Meistern Sie Deep Learning mit TensorFlow und PyTorch. Erstellen Sie neuronale Netze für Computer Vision und NLP.',
    category: 'ai',
    categoryAr: 'الذكاء الاصطناعي',
    categoryDe: 'Künstliche Intelligenz',
    skillLevel: 'Advanced',
    skillLevelAr: 'متقدم',
    skillLevelDe: 'Fortgeschritten',
    duration: 4200, // 70 hours
    price: 799,
    rating: 4.8,
    totalEnrollments: 870,
    totalViews: 3900,
    instructorName: 'Dr. Khaled Mahmoud',
    instructorNameAr: 'د. خالد محمود',
    thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=450&fit=crop&q=80',
    lessonsCount: 160
  },
  {
    title: 'UI/UX Design Complete Guide',
    titleAr: 'الدليل الشامل لتصميم واجهة المستخدم وتجربة المستخدم',
    titleDe: 'Vollständiger UI/UX Design Guide',
    description: 'Learn UI/UX design principles, Figma, Adobe XD, user research, wireframing, and prototyping.',
    descriptionAr: 'تعلم مبادئ تصميم واجهة المستخدم وتجربة المستخدم، Figma، Adobe XD، بحث المستخدم، الإطارات السلكية، والنماذج الأولية.',
    descriptionDe: 'Lernen Sie UI/UX-Designprinzipien, Figma, Adobe XD, Benutzerforschung, Wireframing und Prototyping.',
    category: 'design',
    categoryAr: 'التصميم',
    categoryDe: 'Design',
    skillLevel: 'Beginner',
    skillLevelAr: 'مبتدئ',
    skillLevelDe: 'Anfänger',
    duration: 2100, // 35 hours
    price: 449,
    rating: 4.7,
    totalEnrollments: 1650,
    totalViews: 7200,
    instructorName: 'Nour Hassan',
    instructorNameAr: 'نور حسن',
    thumbnail: 'https://images.unsplash.com/photo-1558655146-364adcfd5b5c?w=800&h=450&fit=crop&q=80',
    lessonsCount: 75
  },
  {
    title: 'Digital Marketing Mastery 2025',
    titleAr: 'إتقان التسويق الرقمي 2025',
    titleDe: 'Digital Marketing Meisterschaft 2025',
    description: 'Complete digital marketing course: SEO, SEM, social media marketing, email marketing, and analytics.',
    descriptionAr: 'دورة التسويق الرقمي الشاملة: تحسين محركات البحث، التسويق عبر محركات البحث، التسويق عبر وسائل التواصل الاجتماعي، التسويق عبر البريد الإلكتروني، والتحليلات.',
    descriptionDe: 'Vollständiger Digital-Marketing-Kurs: SEO, SEM, Social Media Marketing, E-Mail-Marketing und Analytics.',
    category: 'marketing',
    categoryAr: 'التسويق',
    categoryDe: 'Marketing',
    skillLevel: 'Intermediate',
    skillLevelAr: 'متوسط',
    skillLevelDe: 'Mittelstufe',
    duration: 1800, // 30 hours
    price: 399,
    rating: 4.6,
    totalEnrollments: 2300,
    totalViews: 9500,
    instructorName: 'Amira Youssef',
    instructorNameAr: 'أميرة يوسف',
    thumbnail: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=450&fit=crop&q=80',
    lessonsCount: 65
  },
  {
    title: 'Business Strategy & Entrepreneurship',
    titleAr: 'استراتيجية الأعمال وريادة الأعمال',
    titleDe: 'Geschäftsstrategie & Unternehmertum',
    description: 'Learn business fundamentals, strategy development, startup creation, and scaling businesses.',
    descriptionAr: 'تعلم أساسيات الأعمال، تطوير الاستراتيجية، إنشاء الشركات الناشئة، وتوسيع نطاق الأعمال.',
    descriptionDe: 'Lernen Sie Geschäftsgrundlagen, Strategieentwicklung, Startup-Gründung und Unternehmensskalierung.',
    category: 'business',
    categoryAr: 'الأعمال',
    categoryDe: 'Geschäft',
    skillLevel: 'Beginner',
    skillLevelAr: 'مبتدئ',
    skillLevelDe: 'Anfänger',
    duration: 2400, // 40 hours
    price: 529,
    rating: 4.8,
    totalEnrollments: 1890,
    totalViews: 7800,
    instructorName: 'Omar Saleh',
    instructorNameAr: 'عمر صالح',
    thumbnail: 'https://images.unsplash.com/photo-1557838923-2985c318be48?w=800&h=450&fit=crop&q=80',
    lessonsCount: 80
  },
  {
    title: 'Advanced React & TypeScript',
    titleAr: 'React و TypeScript المتقدم',
    titleDe: 'Fortgeschrittenes React & TypeScript',
    description: 'Master advanced React patterns, TypeScript integration, performance optimization, and testing.',
    descriptionAr: 'إتقان أنماط React المتقدمة، تكامل TypeScript، تحسين الأداء، والاختبار.',
    descriptionDe: 'Meistern Sie fortgeschrittene React-Muster, TypeScript-Integration, Leistungsoptimierung und Testing.',
    category: 'web-development',
    categoryAr: 'تطوير الويب',
    categoryDe: 'Webentwicklung',
    skillLevel: 'Advanced',
    skillLevelAr: 'متقدم',
    skillLevelDe: 'Fortgeschritten',
    duration: 2700, // 45 hours
    price: 599,
    rating: 4.9,
    totalEnrollments: 1120,
    totalViews: 5300,
    instructorName: 'Yasmin Samir',
    instructorNameAr: 'ياسمين سمير',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop&q=80',
    lessonsCount: 100
  },
  {
    title: 'Flutter Mobile Development',
    titleAr: 'تطوير تطبيقات الجوال بFlutter',
    titleDe: 'Flutter Mobile Entwicklung',
    description: 'Build beautiful cross-platform mobile apps with Flutter and Dart. From basics to production.',
    descriptionAr: 'بناء تطبيقات جوال متعددة المنصات جميلة باستخدام Flutter و Dart. من الأساسيات إلى الإنتاج.',
    descriptionDe: 'Erstellen Sie schöne plattformübergreifende mobile Apps mit Flutter und Dart. Von Grundlagen bis Produktion.',
    category: 'mobile-development',
    categoryAr: 'تطوير تطبيقات الجوال',
    categoryDe: 'Mobile Entwicklung',
    skillLevel: 'Intermediate',
    skillLevelAr: 'متوسط',
    skillLevelDe: 'Mittelstufe',
    duration: 3000, // 50 hours
    price: 579,
    rating: 4.7,
    totalEnrollments: 890,
    totalViews: 4100,
    instructorName: 'Ahmed Mostafa',
    instructorNameAr: 'أحمد مصطفى',
    thumbnail: 'https://images.unsplash.com/photo-1617042375876-a13e36732a04?w=800&h=450&fit=crop&q=80',
    lessonsCount: 110
  },
  {
    title: 'Graphic Design with Adobe Creative Cloud',
    titleAr: 'التصميم الجرافيكي مع Adobe Creative Cloud',
    titleDe: 'Grafikdesign mit Adobe Creative Cloud',
    description: 'Master Photoshop, Illustrator, and InDesign. Create professional designs for print and digital.',
    descriptionAr: 'إتقان Photoshop و Illustrator و InDesign. إنشاء تصاميم احترافية للطباعة والرقمية.',
    descriptionDe: 'Meistern Sie Photoshop, Illustrator und InDesign. Erstellen Sie professionelle Designs für Druck und Digital.',
    category: 'design',
    categoryAr: 'التصميم',
    categoryDe: 'Design',
    skillLevel: 'Beginner',
    skillLevelAr: 'مبتدئ',
    skillLevelDe: 'Anfänger',
    duration: 1800, // 30 hours
    price: 429,
    rating: 4.6,
    totalEnrollments: 1540,
    totalViews: 6700,
    instructorName: 'Layla Kamal',
    instructorNameAr: 'ليلى كمال',
    thumbnail: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&h=450&fit=crop&q=80',
    lessonsCount: 70
  },
  {
    title: 'Cloud Computing with AWS',
    titleAr: 'الحوسبة السحابية مع AWS',
    titleDe: 'Cloud Computing mit AWS',
    description: 'Learn Amazon Web Services: EC2, S3, Lambda, RDS, and cloud architecture best practices.',
    descriptionAr: 'تعلم خدمات أمازون الويب: EC2، S3، Lambda، RDS، وأفضل ممارسات هندسة السحابة.',
    descriptionDe: 'Lernen Sie Amazon Web Services: EC2, S3, Lambda, RDS und Best Practices für Cloud-Architektur.',
    category: 'programming',
    categoryAr: 'البرمجة',
    categoryDe: 'Programmierung',
    skillLevel: 'Intermediate',
    skillLevelAr: 'متوسط',
    skillLevelDe: 'Mittelstufe',
    duration: 2400, // 40 hours
    price: 649,
    rating: 4.8,
    totalEnrollments: 1050,
    totalViews: 4800,
    instructorName: 'Karim Fathy',
    instructorNameAr: 'كريم فتحي',
    thumbnail: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&h=450&fit=crop&q=80',
    lessonsCount: 90
  }
]

async function main() {
  console.log('🌱 Starting to seed categorized courses...')

  // Create admin user for creators
  const adminPassword = await bcrypt.hash('Admin@123', 10)
  
  try {
    const admin = await prisma.user.upsert({
      where: { email: 'admin@edtech.com' },
      update: {},
      create: {
        email: 'admin@edtech.com',
        passwordHash: adminPassword,
        name: 'Platform Admin',
        arabicName: 'مدير المنصة',
        role: UserRole.ADMIN,
        emailVerified: new Date(),
        onboardingCompleted: true
      }
    })
    console.log('✅ Admin user created/verified')

    // Create instructors
    for (let i = 0; i < demoCourses.length; i++) {
      const course = demoCourses[i]
      
      // Create instructor user
      const instructorEmail = `instructor${i + 1}@edtech.com`
      const instructorPassword = await bcrypt.hash('Instructor@123', 10)
      
      const instructor = await prisma.user.upsert({
        where: { email: instructorEmail },
        update: {},
        create: {
          email: instructorEmail,
          passwordHash: instructorPassword,
          name: course.instructorName,
          arabicName: course.instructorNameAr,
          role: UserRole.CREATOR,
          emailVerified: new Date(),
          onboardingCompleted: true,
          bio: `Expert instructor specializing in ${course.category}`,
          profileImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(course.instructorName)}&background=random`
        }
      })

      // Create creator profile
      const creator = await prisma.creator.upsert({
        where: { userId: instructor.id },
        update: {},
        create: {
          userId: instructor.id,
          kycStatus: KYCStatus.APPROVED,
          contractSigned: true,
          contractSignedAt: new Date(),
          expertise: course.category,
          totalEarnings: course.totalEnrollments * course.price * 0.7,
          totalSubscribers: course.totalEnrollments,
          hourlyRate: 150,
          availableForMeetings: true,
          timezone: 'Africa/Cairo',
          languages: 'Arabic, English'
        }
      })

      // Create course
      const createdCourse = await prisma.course.create({
        data: {
          title: course.title,
          titleAr: course.titleAr,
          titleDe: course.titleDe,
          description: course.description,
          descriptionAr: course.descriptionAr,
          descriptionDe: course.descriptionDe,
          category: course.category,
          categoryAr: course.categoryAr,
          categoryDe: course.categoryDe,
          creatorId: creator.id,
          skillLevel: course.skillLevel,
          skillLevelAr: course.skillLevelAr,
          skillLevelDe: course.skillLevelDe,
          duration: course.duration,
          language: 'Arabic/English',
          price: course.price,
          syllabus: {
            modules: [
              { title: 'Introduction', lessons: Math.floor(course.lessonsCount * 0.2) },
              { title: 'Core Concepts', lessons: Math.floor(course.lessonsCount * 0.4) },
              { title: 'Advanced Topics', lessons: Math.floor(course.lessonsCount * 0.3) },
              { title: 'Projects & Practice', lessons: Math.floor(course.lessonsCount * 0.1) }
            ]
          },
          status: ContentStatus.PUBLISHED,
          publishedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Random date within last 90 days
          totalViews: course.totalViews,
          totalEnrollments: course.totalEnrollments,
          rating: course.rating,
          thumbnail: course.thumbnail,
          demoVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' // Demo video
        }
      })

      // Create sample lessons
      for (let j = 0; j < Math.min(course.lessonsCount, 10); j++) {
        await prisma.lesson.create({
          data: {
            courseId: createdCourse.id,
            title: `Lesson ${j + 1}: Introduction to ${course.category}`,
            titleAr: `الدرس ${j + 1}: مقدمة في ${course.categoryAr}`,
            titleDe: `Lektion ${j + 1}: Einführung in ${course.categoryDe}`,
            description: `Learn the fundamentals of ${course.category} in this comprehensive lesson.`,
            descriptionAr: `تعلم أساسيات ${course.categoryAr} في هذا الدرس الشامل.`,
            descriptionDe: `Lernen Sie die Grundlagen von ${course.categoryDe} in dieser umfassenden Lektion.`,
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            duration: course.duration / course.lessonsCount,
            order: j + 1
          }
        })
      }

      console.log(`✅ Created course: ${course.title} (${course.category})`)
    }

    console.log(`\n🎉 Successfully seeded ${demoCourses.length} categorized courses!`)
    console.log('\n📊 Category Distribution:')
    
    const categoryCounts = demoCourses.reduce((acc, course) => {
      acc[course.category] = (acc[course.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    Object.entries(categoryCounts).forEach(([category, count]) => {
      const catInfo = categories.find(c => c.key === category)
      console.log(`   ${catInfo?.icon} ${catInfo?.name}: ${count} courses`)
    })

  } catch (error) {
    console.error('❌ Error seeding courses:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
