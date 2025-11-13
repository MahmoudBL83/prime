import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking signature courses...\n');

  // Check total courses
  const totalCourses = await prisma.course.count();
  console.log(`Total courses in database: ${totalCourses}`);

  // Check courses by category
  const categoryA = await prisma.course.count({
    where: { contentCategory: 'CATEGORY_A' }
  });
  const categoryB = await prisma.course.count({
    where: { contentCategory: 'CATEGORY_B' }
  });

  console.log(`CATEGORY_A courses: ${categoryA}`);
  console.log(`CATEGORY_B courses (Signature): ${categoryB}`);

  // Show all courses
  const courses = await prisma.course.findMany({
    select: {
      id: true,
      title: true,
      contentCategory: true,
      status: true,
    },
    take: 10,
  });

  console.log('\nFirst 10 courses:');
  courses.forEach(course => {
    console.log(`- ${course.title} (${course.contentCategory}, ${course.status})`);
  });

  // If no CATEGORY_B courses, let's update some
  if (categoryB === 0 && totalCourses > 0) {
    console.log('\n⚠️ No signature courses found! Updating some courses...');
    
    const updated = await prisma.course.updateMany({
      where: {
        status: 'PUBLISHED',
      },
      data: {
        contentCategory: 'CATEGORY_B',
      },
      take: 6, // Update first 6 published courses
    });

    console.log(`✅ Updated ${updated.count} courses to CATEGORY_B`);
    
    // Check again
    const newCategoryB = await prisma.course.count({
      where: { contentCategory: 'CATEGORY_B' }
    });
    console.log(`CATEGORY_B courses now: ${newCategoryB}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
