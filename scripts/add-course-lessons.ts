import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🎓 Adding comprehensive course data with lessons...')

  // Find or create a demo course
  const course = await prisma.course.upsert({
    where: { id: 'demo-course-1' },
    update: {},
    create: {
      id: 'demo-course-1',
      title: 'Complete Web Development Masterclass',
      titleAr: 'دورة تطوير الويب الشاملة',
      description: 'Master modern web development from scratch. Learn HTML, CSS, JavaScript, React, Node.js, and deploy real-world projects. This comprehensive course will transform you from beginner to professional developer.',
      descriptionAr: 'أتقن تطوير الويب الحديث من الصفر. تعلم HTML و CSS و JavaScript و React و Node.js وانشر مشاريع حقيقية. ستحولك هذه الدورة الشاملة من مبتدئ إلى مطور محترف.',
      thumbnail: '/images/courses/web-dev-masterclass.jpg',
      price: 99.99,
      level: 'BEGINNER',
      category: 'CATEGORY_A',
      status: 'PUBLISHED',
      featured: true,
      contentType: 'SERIES',
      totalSeasons: 3,
      totalEpisodes: 24,
      episodeDuration: 45,
      releaseYear: 2024,
      maturityRating: 'All Ages',
      genres: JSON.stringify(['Web Development', 'Programming', 'JavaScript', 'React']),
      cast: JSON.stringify(['John Smith', 'Sarah Johnson', 'Mike Chen']),
      rating: 4.8,
      totalEnrollments: 15420,
      creatorId: 'demo-creator-1'
    }
  })

  console.log(`✅ Course created: ${course.title}`)

  // Module 1: HTML & CSS Fundamentals
  const module1Lessons = [
    {
      title: 'Introduction to Web Development',
      titleAr: 'مقدمة في تطوير الويب',
      description: 'Learn the fundamentals of web development, how the internet works, and what tools you need to get started.',
      descriptionAr: 'تعلم أساسيات تطوير الويب، كيف يعمل الإنترنت، والأدوات التي تحتاجها للبدء.',
      order: 1,
      duration: 30,
      seasonNumber: 1,
      episodeNumber: 1,
      videoUrl: '/videos/demo/course-promo.mp4'
    },
    {
      title: 'HTML Basics - Structure Your Content',
      titleAr: 'أساسيات HTML - هيكلة المحتوى',
      description: 'Master HTML tags, elements, and semantic markup. Build your first webpage from scratch.',
      descriptionAr: 'أتقن علامات HTML والعناصر والترميز الدلالي. ابنِ أول صفحة ويب من الصفر.',
      order: 2,
      duration: 45,
      seasonNumber: 1,
      episodeNumber: 2,
      videoUrl: '/videos/demo/course-promo.mp4'
    },
    {
      title: 'CSS Fundamentals - Styling Your Pages',
      titleAr: 'أساسيات CSS - تنسيق صفحاتك',
      description: 'Learn CSS selectors, properties, and the box model. Make your websites beautiful.',
      descriptionAr: 'تعلم محددات CSS والخصائص ونموذج الصندوق. اجعل مواقعك جميلة.',
      order: 3,
      duration: 50,
      seasonNumber: 1,
      episodeNumber: 3,
      videoUrl: '/videos/demo/course-promo.mp4'
    },
    {
      title: 'Responsive Design with Flexbox',
      titleAr: 'التصميم المتجاوب باستخدام Flexbox',
      description: 'Create responsive layouts that work on all devices using CSS Flexbox.',
      descriptionAr: 'أنشئ تخطيطات متجاوبة تعمل على جميع الأجهزة باستخدام CSS Flexbox.',
      order: 4,
      duration: 55,
      seasonNumber: 1,
      episodeNumber: 4,
      videoUrl: '/videos/demo/course-promo.mp4'
    },
    {
      title: 'CSS Grid Layout System',
      titleAr: 'نظام تخطيط CSS Grid',
      description: 'Master CSS Grid for creating complex, two-dimensional layouts with ease.',
      descriptionAr: 'أتقن CSS Grid لإنشاء تخطيطات معقدة ثنائية الأبعاد بسهولة.',
      order: 5,
      duration: 48,
      seasonNumber: 1,
      episodeNumber: 5,
      videoUrl: '/videos/demo/course-promo.mp4'
    },
    {
      title: 'Advanced CSS - Animations & Transitions',
      titleAr: 'CSS المتقدم - الرسوم المتحركة والانتقالات',
      description: 'Add life to your websites with CSS animations, transitions, and transforms.',
      descriptionAr: 'أضف الحياة إلى مواقعك بالرسوم المتحركة والانتقالات والتحويلات في CSS.',
      order: 6,
      duration: 52,
      seasonNumber: 1,
      episodeNumber: 6,
      videoUrl: '/videos/demo/course-promo.mp4'
    },
    {
      title: 'Building a Complete Landing Page',
      titleAr: 'بناء صفحة هبوط كاملة',
      description: 'Apply everything you learned to build a professional landing page from scratch.',
      descriptionAr: 'طبق كل ما تعلمته لبناء صفحة هبوط احترافية من الصفر.',
      order: 7,
      duration: 60,
      seasonNumber: 1,
      episodeNumber: 7,
      videoUrl: '/videos/demo/course-promo.mp4'
    },
    {
      title: 'Module 1 Project - Portfolio Website',
      titleAr: 'مشروع الوحدة 1 - موقع المحفظة',
      description: 'Build your own portfolio website to showcase your work and skills.',
      descriptionAr: 'ابنِ موقع محفظتك الخاص لعرض أعمالك ومهاراتك.',
      order: 8,
      duration: 90,
      seasonNumber: 1,
      episodeNumber: 8,
      videoUrl: '/videos/demo/course-promo.mp4'
    }
  ]

  // Module 2: JavaScript & Interactivity
  const module2Lessons = [
    {
      title: 'JavaScript Fundamentals - Variables & Data Types',
      titleAr: 'أساسيات JavaScript - المتغيرات وأنواع البيانات',
      description: 'Learn JavaScript basics: variables, data types, operators, and control structures.',
      descriptionAr: 'تعلم أساسيات JavaScript: المتغيرات وأنواع البيانات والعوامل وهياكل التحكم.',
      order: 9,
      duration: 42,
      seasonNumber: 2,
      episodeNumber: 1,
      videoUrl: '/videos/demo/course-promo.mp4'
    },
    {
      title: 'Functions & Scope in JavaScript',
      titleAr: 'الوظائف والنطاق في JavaScript',
      description: 'Master functions, arrow functions, closures, and scope in JavaScript.',
      descriptionAr: 'أتقن الوظائف ووظائف الأسهم والإغلاقات والنطاق في JavaScript.',
      order: 10,
      duration: 48,
      seasonNumber: 2,
      episodeNumber: 2,
      videoUrl: '/videos/demo/course-promo.mp4'
    },
    {
      title: 'DOM Manipulation - Making Pages Interactive',
      titleAr: 'معالجة DOM - جعل الصفحات تفاعلية',
      description: 'Learn to manipulate the Document Object Model and create interactive web pages.',
      descriptionAr: 'تعلم كيفية معالجة نموذج كائن المستند وإنشاء صفحات ويب تفاعلية.',
      order: 11,
      duration: 55,
      seasonNumber: 2,
      episodeNumber: 3,
      videoUrl: '/videos/demo/course-promo.mp4'
    },
    {
      title: 'Events & Event Handling',
      titleAr: 'الأحداث ومعالجة الأحداث',
      description: 'Handle user interactions with event listeners and event delegation.',
      descriptionAr: 'تعامل مع تفاعلات المستخدم باستخدام مستمعي الأحداث وتفويض الأحداث.',
      order: 12,
      duration: 50,
      seasonNumber: 2,
      episodeNumber: 4,
      videoUrl: '/videos/demo/course-promo.mp4'
    },
    {
      title: 'Asynchronous JavaScript - Promises & Async/Await',
      titleAr: 'JavaScript غير المتزامن - الوعود و Async/Await',
      description: 'Master asynchronous programming with callbacks, promises, and async/await.',
      descriptionAr: 'أتقن البرمجة غير المتزامنة باستخدام callbacks والوعود و async/await.',
      order: 13,
      duration: 58,
      seasonNumber: 2,
      episodeNumber: 5,
      videoUrl: '/videos/demo/course-promo.mp4'
    },
    {
      title: 'Fetching Data from APIs',
      titleAr: 'جلب البيانات من APIs',
      description: 'Learn to fetch and display data from external APIs using fetch and axios.',
      descriptionAr: 'تعلم كيفية جلب وعرض البيانات من APIs خارجية باستخدام fetch و axios.',
      order: 14,
      duration: 52,
      seasonNumber: 2,
      episodeNumber: 6,
      videoUrl: '/videos/demo/course-promo.mp4'
    },
    {
      title: 'ES6+ Modern JavaScript Features',
      titleAr: 'ميزات JavaScript الحديثة ES6+',
      description: 'Explore modern JavaScript features: destructuring, spread/rest, modules, and more.',
      descriptionAr: 'استكشف ميزات JavaScript الحديثة: التفكيك، spread/rest، الوحدات، والمزيد.',
      order: 15,
      duration: 46,
      seasonNumber: 2,
      episodeNumber: 7,
      videoUrl: '/videos/demo/course-promo.mp4'
    },
    {
      title: 'Module 2 Project - Weather App',
      titleAr: 'مشروع الوحدة 2 - تطبيق الطقس',
      description: 'Build a fully functional weather application using JavaScript and weather APIs.',
      descriptionAr: 'ابنِ تطبيق طقس يعمل بالكامل باستخدام JavaScript وواجهات برمجة تطبيقات الطقس.',
      order: 16,
      duration: 85,
      seasonNumber: 2,
      episodeNumber: 8,
      videoUrl: '/videos/demo/course-promo.mp4'
    }
  ]

  // Module 3: React & Modern Frameworks
  const module3Lessons = [
    {
      title: 'Introduction to React - Components & Props',
      titleAr: 'مقدمة في React - المكونات والخصائص',
      description: 'Get started with React: learn about components, JSX, and props.',
      descriptionAr: 'ابدأ مع React: تعلم عن المكونات و JSX والخصائص.',
      order: 17,
      duration: 50,
      seasonNumber: 3,
      episodeNumber: 1,
      videoUrl: '/videos/demo/course-promo.mp4'
    },
    {
      title: 'React State & Hooks',
      titleAr: 'حالة React والخطافات',
      description: 'Master React state management using useState and useEffect hooks.',
      descriptionAr: 'أتقن إدارة حالة React باستخدام خطافات useState و useEffect.',
      order: 18,
      duration: 55,
      seasonNumber: 3,
      episodeNumber: 2,
      videoUrl: '/videos/demo/course-promo.mp4'
    },
    {
      title: 'Building Reusable Components',
      titleAr: 'بناء مكونات قابلة لإعادة الاستخدام',
      description: 'Create reusable and composable React components for scalable applications.',
      descriptionAr: 'أنشئ مكونات React قابلة لإعادة الاستخدام والتركيب لتطبيقات قابلة للتوسع.',
      order: 19,
      duration: 48,
      seasonNumber: 3,
      episodeNumber: 3,
      videoUrl: '/videos/demo/course-promo.mp4'
    },
    {
      title: 'React Router - Navigation & Routing',
      titleAr: 'React Router - التنقل والتوجيه',
      description: 'Implement client-side routing in React applications using React Router.',
      descriptionAr: 'نفذ التوجيه من جانب العميل في تطبيقات React باستخدام React Router.',
      order: 20,
      duration: 45,
      seasonNumber: 3,
      episodeNumber: 4,
      videoUrl: '/videos/demo/course-promo.mp4'
    },
    {
      title: 'Context API & State Management',
      titleAr: 'Context API وإدارة الحالة',
      description: 'Manage global state in React applications using Context API.',
      descriptionAr: 'أدر الحالة العامة في تطبيقات React باستخدام Context API.',
      order: 21,
      duration: 52,
      seasonNumber: 3,
      episodeNumber: 5,
      videoUrl: '/videos/demo/course-promo.mp4'
    },
    {
      title: 'Working with Forms in React',
      titleAr: 'العمل مع النماذج في React',
      description: 'Handle forms, validation, and user input in React applications.',
      descriptionAr: 'تعامل مع النماذج والتحقق من الصحة وإدخال المستخدم في تطبيقات React.',
      order: 22,
      duration: 47,
      seasonNumber: 3,
      episodeNumber: 6,
      videoUrl: '/videos/demo/course-promo.mp4'
    },
    {
      title: 'Styling in React - CSS Modules & Styled Components',
      titleAr: 'التنسيق في React - وحدات CSS ومكونات منسقة',
      description: 'Learn different approaches to styling React components.',
      descriptionAr: 'تعلم مختلف الأساليب لتنسيق مكونات React.',
      order: 23,
      duration: 44,
      seasonNumber: 3,
      episodeNumber: 7,
      videoUrl: '/videos/demo/course-promo.mp4'
    },
    {
      title: 'Final Project - Full-Stack E-Commerce Site',
      titleAr: 'المشروع النهائي - موقع تجارة إلكترونية متكامل',
      description: 'Build a complete e-commerce website with React, Node.js, and database integration.',
      descriptionAr: 'ابنِ موقع تجارة إلكترونية كامل باستخدام React و Node.js وتكامل قاعدة البيانات.',
      order: 24,
      duration: 120,
      seasonNumber: 3,
      episodeNumber: 8,
      videoUrl: '/videos/demo/course-promo.mp4'
    }
  ]

  const allLessons = [...module1Lessons, ...module2Lessons, ...module3Lessons]

  // Create all lessons
  for (const lessonData of allLessons) {
    const lesson = await prisma.lesson.create({
      data: {
        ...lessonData,
        courseId: course.id,
        status: 'PUBLISHED',
        isFree: lessonData.episodeNumber === 1 && lessonData.seasonNumber === 1 // First lesson is free
      }
    })
    console.log(`✅ Created lesson: ${lesson.title}`)
  }

  console.log('\n🎉 Successfully added course with 24 lessons across 3 modules!')
  console.log(`📚 Course: ${course.title}`)
  console.log(`📝 Total Lessons: ${allLessons.length}`)
  console.log(`🎓 Modules: 3`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
