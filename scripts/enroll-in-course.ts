import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function enrollUser() {
  const courseId = 'cmgwg5yay0007uq7okm20t9vq';
  
  // Get the first user (usually admin or test user)
  const user = await prisma.user.findFirst({
    orderBy: {
      createdAt: 'asc'
    }
  });
  
  if (!user) {
    console.log('❌ No users found in database');
    await prisma.$disconnect();
    return;
  }
  
  console.log('👤 User:', user.email);
  
  // Check if already enrolled
  const existingEnrollment = await prisma.enrollment.findFirst({
    where: {
      userId: user.id,
      courseId: courseId,
    },
  });
  
  if (existingEnrollment) {
    console.log('✅ Already enrolled in this course');
  } else {
    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: user.id,
        courseId: courseId,
        progress: 0,
      },
    });
    
    console.log('✅ Successfully enrolled user in course');
    console.log('Enrollment ID:', enrollment.id);
  }
  
  await prisma.$disconnect();
}

enrollUser().catch(console.error);
