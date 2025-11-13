import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCourse() {
  const courseId = 'cmgwg5yay0007uq7okm20t9vq';
  
  console.log('Checking course:', courseId);
  
  // Check if course exists
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      creator: true,
      lessons: true,
      enrollments: {
        include: {
          user: true,
        },
      },
    },
  });
  
  if (!course) {
    console.log('❌ Course not found!');
    
    // List all signature courses
    console.log('\n📋 Available Signature Courses:');
    const allCourses = await prisma.course.findMany({
      where: {
        OR: [
          { category: 'SIGNATURE' },
          { isSignatureCourse: true },
        ],
      },
      select: {
        id: true,
        title: true,
        category: true,
        isSignatureCourse: true,
      },
    });
    
    console.log(allCourses);
  } else {
    console.log('✅ Course found:', course.title);
    console.log('Category:', course.category);
    console.log('Is Signature Course:', course.isSignatureCourse);
    console.log('Number of lessons:', course.lessons.length);
    console.log('Number of enrollments:', course.enrollments.length);
    
    if (course.enrollments.length > 0) {
      console.log('\n👥 Enrollments:');
      course.enrollments.forEach(enrollment => {
        console.log(`- ${enrollment.user.email} (${enrollment.user.name})`);
      });
    } else {
      console.log('\n⚠️ No enrollments found for this course');
    }
  }
  
  await prisma.$disconnect();
}

checkCourse().catch(console.error);
