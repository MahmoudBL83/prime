import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addLessons() {
  const courseId = 'cmgwg5yay0007uq7okm20t9vq';
  
  // Check if lessons already exist
  const existingLessons = await prisma.lesson.count({
    where: { courseId },
  });
  
  if (existingLessons > 0) {
    console.log('✅ Course already has', existingLessons, 'lessons');
    await prisma.$disconnect();
    return;
  }
  
  console.log('📚 Adding lessons to course...');
  
  const lessons = [
    {
      title: 'Introduction to AI & Machine Learning',
      description: 'Overview of artificial intelligence and machine learning fundamentals',
      order: 1,
      duration: 45,
      videoUrl: '/videos/demo-lesson.mp4',
    },
    {
      title: 'Python for Machine Learning',
      description: 'Essential Python programming concepts for ML applications',
      order: 2,
      duration: 52,
      videoUrl: '/videos/demo-lesson.mp4',
    },
    {
      title: 'Data Processing & NumPy',
      description: 'Working with numerical data using NumPy and pandas',
      order: 3,
      duration: 48,
      videoUrl: '/videos/demo-lesson.mp4',
    },
    {
      title: 'Linear Regression & Optimization',
      description: 'Understanding linear models and gradient descent',
      order: 4,
      duration: 55,
      videoUrl: '/videos/demo-lesson.mp4',
    },
    {
      title: 'Classification & Decision Trees',
      description: 'Building classification models and decision tree algorithms',
      order: 5,
      duration: 50,
      videoUrl: '/videos/demo-lesson.mp4',
    },
    {
      title: 'Neural Networks Fundamentals',
      description: 'Introduction to artificial neural networks and deep learning',
      order: 6,
      duration: 58,
      videoUrl: '/videos/demo-lesson.mp4',
    },
    {
      title: 'Convolutional Neural Networks',
      description: 'CNN architectures for computer vision tasks',
      order: 7,
      duration: 62,
      videoUrl: '/videos/demo-lesson.mp4',
    },
    {
      title: 'Natural Language Processing',
      description: 'NLP techniques and transformers for text processing',
      order: 8,
      duration: 54,
      videoUrl: '/videos/demo-lesson.mp4',
    },
  ];
  
  for (const lesson of lessons) {
    await prisma.lesson.create({
      data: {
        ...lesson,
        courseId,
      },
    });
  }
  
  console.log(`✅ Successfully added ${lessons.length} lessons to course`);
  
  await prisma.$disconnect();
}

addLessons().catch(console.error);
