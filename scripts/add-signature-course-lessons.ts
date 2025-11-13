import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addLessonsToSignatureCourses() {
  try {
    console.log('🎬 Starting to add lessons to signature courses...\n');

    // Get all signature courses (contentCategory = 'CATEGORY_B')
    const courses = await prisma.course.findMany({
      where: {
        contentCategory: 'CATEGORY_B' // Signature courses
      },
      include: {
        lessons: true
      }
    });

    console.log(`Found ${courses.length} signature courses\n`);

    for (const course of courses) {
      console.log(`\n📚 Processing: ${course.title}`);
      
      // Check if course already has lessons
      if (course.lessons.length > 0) {
        console.log(`  ✓ Already has ${course.lessons.length} lessons, skipping...`);
        continue;
      }

      // Create 8-12 lessons per course
      const lessonCount = Math.floor(Math.random() * 5) + 8; // 8 to 12 lessons
      
      const lessonTemplates = [
        { title: 'Introduction and Overview', duration: 15 },
        { title: 'Core Concepts and Fundamentals', duration: 25 },
        { title: 'Getting Started with Basics', duration: 20 },
        { title: 'Deep Dive into Key Topics', duration: 30 },
        { title: 'Practical Examples and Use Cases', duration: 28 },
        { title: 'Advanced Techniques', duration: 35 },
        { title: 'Best Practices and Patterns', duration: 22 },
        { title: 'Common Challenges and Solutions', duration: 26 },
        { title: 'Real-World Projects', duration: 40 },
        { title: 'Tools and Resources', duration: 18 },
        { title: 'Performance Optimization', duration: 24 },
        { title: 'Security and Best Practices', duration: 20 },
        { title: 'Testing and Debugging', duration: 28 },
        { title: 'Deployment Strategies', duration: 30 },
        { title: 'Final Project and Wrap-up', duration: 45 },
      ];

      // Create lessons
      const lessonsToCreate = [];
      for (let i = 0; i < lessonCount; i++) {
        const template = lessonTemplates[i % lessonTemplates.length];
        lessonsToCreate.push({
          title: `${course.title} - Lesson ${i + 1}: ${template.title}`,
          description: `Learn essential concepts and practical skills in this comprehensive lesson. You'll explore key topics, work through examples, and build real-world projects.`,
          content: `# ${template.title}\n\nWelcome to lesson ${i + 1}! In this session, we'll cover important concepts and techniques.\n\n## What You'll Learn\n- Core concepts and fundamentals\n- Practical applications\n- Best practices\n- Real-world examples\n\n## Let's Get Started!\n\nThis lesson will guide you through step-by-step instructions and hands-on exercises.`,
          videoUrl: `https://example.com/videos/lesson-${i + 1}.mp4`,
          duration: template.duration,
          order: i + 1,
          courseId: course.id,
          isPublished: true,
        });
      }

      await prisma.lesson.createMany({
        data: lessonsToCreate
      });

      console.log(`  ✅ Added ${lessonCount} lessons`);
    }

    // Add some reviews to courses
    console.log('\n\n⭐ Adding reviews to courses...\n');

    const users = await prisma.user.findMany({
      take: 20,
      where: {
        role: 'LEARNER'
      }
    });

    if (users.length === 0) {
      console.log('  ⚠️ No learner users found, skipping reviews');
    } else {
      const reviewTemplates = [
        { rating: 5, comment: 'Excellent course! Learned so much and the instructor explains everything clearly.' },
        { rating: 5, comment: 'Best course I\'ve taken. Highly recommend to anyone wanting to learn this topic.' },
        { rating: 4, comment: 'Very comprehensive and well-structured. Would definitely recommend.' },
        { rating: 5, comment: 'Outstanding content and presentation. Worth every penny!' },
        { rating: 4, comment: 'Great course overall. Some sections could be more detailed but still very good.' },
        { rating: 5, comment: 'This course exceeded my expectations. The projects were especially helpful.' },
        { rating: 4, comment: 'Solid course with practical examples. Helped me understand the concepts better.' },
        { rating: 5, comment: 'Amazing instructor and fantastic content. Learned exactly what I needed.' },
      ];

      for (const course of courses) {
        // Add 3-8 reviews per course
        const reviewCount = Math.floor(Math.random() * 6) + 3;
        
        for (let i = 0; i < reviewCount && i < users.length; i++) {
          const template = reviewTemplates[i % reviewTemplates.length];
          
          try {
            await prisma.review.create({
              data: {
                rating: template.rating,
                comment: template.comment,
                userId: users[i].id,
                courseId: course.id,
              }
            });
          } catch (error) {
            // Skip if review already exists (unique constraint)
            continue;
          }
        }

        console.log(`  ✅ Added reviews to: ${course.title}`);
      }
    }

    console.log('\n\n✅ Successfully added lessons and reviews to all signature courses!\n');

    // Show summary
    const updatedCourses = await prisma.course.findMany({
      where: {
        contentCategory: 'CATEGORY_B'
      },
      include: {
        lessons: true,
        reviews: true
      }
    });

    console.log('📊 Summary:');
    updatedCourses.forEach(course => {
      console.log(`  - ${course.title}: ${course.lessons.length} lessons, ${course.reviews.length} reviews`);
    });

  } catch (error) {
    console.error('❌ Error adding lessons:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addLessonsToSignatureCourses()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
