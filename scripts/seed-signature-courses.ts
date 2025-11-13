import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting to seed signature courses...');

  // First, find or create a creator
  let creator = await prisma.creator.findFirst({
    include: { user: true },
  });

  if (!creator) {
    console.log('No creator found. Creating a demo creator...');
    const user = await prisma.user.create({
      data: {
        email: 'demo-creator@example.com',
        name: 'Dr. Ahmed Hassan',
        arabicName: 'د. أحمد حسن',
        passwordHash: '$2a$10$dummyHashForDemoUser',
        role: 'CREATOR',
        emailVerified: new Date(),
      },
    });

    creator = await prisma.creator.create({
      data: {
        userId: user.id,
        kycStatus: 'APPROVED',
      },
      include: { user: true },
    });
  }

  console.log(`Using creator: ${creator.user.name}`);

  // Sample signature courses
  const signatureCourses = [
    {
      title: 'Complete AI & Machine Learning Masterclass',
      titleAr: 'دورة الذكاء الاصطناعي والتعلم الآلي الكاملة',
      description: 'Master artificial intelligence and machine learning from scratch. Build real-world projects and get certified.',
      descriptionAr: 'احترف الذكاء الاصطناعي والتعلم الآلي من الصفر. قم ببناء مشاريع حقيقية واحصل على شهادة معتمدة.',
      category: 'Technology',
      categoryAr: 'التكنولوجيا',
      skillLevel: 'INTERMEDIATE',
      duration: 42,
      price: 299.99,
      thumbnail: '/images/courses/netflix1.jpg',
    },
    {
      title: 'Full Stack Web Development Bootcamp',
      titleAr: 'المعسكر الشامل لتطوير الويب',
      description: 'Learn to build professional web applications with React, Node.js, and databases. Get job-ready skills.',
      descriptionAr: 'تعلم بناء تطبيقات ويب احترافية باستخدام React و Node.js وقواعد البيانات. احصل على مهارات جاهزة للعمل.',
      category: 'Technology',
      categoryAr: 'التكنولوجيا',
      skillLevel: 'BEGINNER',
      duration: 60,
      price: 349.99,
      thumbnail: '/images/courses/netflix2.jpg',
    },
    {
      title: 'Digital Marketing & Growth Hacking',
      titleAr: 'التسويق الرقمي والنمو السريع',
      description: 'Master digital marketing strategies, SEO, social media, and growth hacking techniques.',
      descriptionAr: 'احترف استراتيجيات التسويق الرقمي وتحسين محركات البحث ووسائل التواصل الاجتماعي.',
      category: 'Marketing',
      categoryAr: 'التسويق',
      skillLevel: 'INTERMEDIATE',
      duration: 35,
      price: 249.99,
      thumbnail: '/images/courses/netflix3.jpg',
    },
    {
      title: 'Data Science & Analytics Professional',
      titleAr: 'دورة علم البيانات والتحليلات الاحترافية',
      description: 'Learn data analysis, visualization, and machine learning with Python. Work on real datasets.',
      descriptionAr: 'تعلم تحليل البيانات والتصور والتعلم الآلي باستخدام Python. اعمل على بيانات حقيقية.',
      category: 'Data Science',
      categoryAr: 'علم البيانات',
      skillLevel: 'INTERMEDIATE',
      duration: 45,
      price: 299.99,
      thumbnail: '/images/courses/netflix4.jpg',
    },
    {
      title: 'UI/UX Design Masterclass',
      titleAr: 'دورة تصميم واجهات المستخدم الشاملة',
      description: 'Create beautiful, user-friendly designs. Master Figma, design thinking, and user research.',
      descriptionAr: 'أنشئ تصاميم جميلة وسهلة الاستخدام. احترف Figma والتفكير التصميمي وبحث المستخدم.',
      category: 'Design',
      categoryAr: 'التصميم',
      skillLevel: 'BEGINNER',
      duration: 30,
      price: 199.99,
      thumbnail: '/images/courses/netflix5.jpg',
    },
    {
      title: 'Business Strategy & Leadership',
      titleAr: 'استراتيجية الأعمال والقيادة',
      description: 'Develop strategic thinking and leadership skills. Learn from real business cases.',
      descriptionAr: 'طور مهارات التفكير الاستراتيجي والقيادة. تعلم من حالات الأعمال الحقيقية.',
      category: 'Business',
      categoryAr: 'الأعمال',
      skillLevel: 'ADVANCED',
      duration: 40,
      price: 399.99,
      thumbnail: '/images/courses/netflix6.jpg',
    },
  ];

  let createdCount = 0;

  for (const courseData of signatureCourses) {
    try {
      // Check if course already exists
      const existing = await prisma.course.findFirst({
        where: {
          title: courseData.title,
          creatorId: creator.id,
        },
      });

      if (existing) {
        console.log(`Course already exists: ${courseData.title}`);
        continue;
      }

      const course = await prisma.course.create({
        data: {
          ...courseData,
          creatorId: creator.id,
          contentCategory: 'CATEGORY_B', // Signature course
          status: 'PUBLISHED',
          totalEnrollments: Math.floor(Math.random() * 5000) + 500,
          rating: 4.5 + Math.random() * 0.5, // 4.5 - 5.0
          language: 'en',
          syllabus: {
            modules: [],
          },
          contentType: 'SERIES',
        },
      });

      console.log(`✓ Created course: ${course.title}`);
      createdCount++;
    } catch (error) {
      console.error(`Error creating course ${courseData.title}:`, error);
    }
  }

  console.log(`\n✅ Successfully created ${createdCount} signature courses!`);
}

main()
  .catch((e) => {
    console.error('Error seeding signature courses:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
