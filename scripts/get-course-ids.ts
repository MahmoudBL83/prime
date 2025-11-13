import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getCourseIds() {
  try {
    const courses = await prisma.course.findMany({
      select: { 
        id: true, 
        title: true, 
        category: true,
        skillLevel: true,
        thumbnail: true
      },
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('=== AVAILABLE COURSE IDs FOR STREAMING SHOWCASE ===\n');
    
    // Group by category for easier organization
    const programming = courses.filter(c => c.category === 'PROGRAMMING').slice(0, 4);
    const design = courses.filter(c => c.category === 'DESIGN').slice(0, 3);
    const business = courses.filter(c => c.category === 'BUSINESS').slice(0, 3);
    const other = courses.filter(c => !['PROGRAMMING', 'DESIGN', 'BUSINESS'].includes(c.category)).slice(0, 5);
    
    console.log('🚀 TOP PROGRAMMING COURSES:');
    programming.forEach((course, i) => {
      console.log(`  top-${i + 1}: ${course.id} - ${course.title}`);
    });
    
    console.log('\n🎨 NEW DESIGN COURSES:');
    design.forEach((course, i) => {
      console.log(`  new-${i + 1}: ${course.id} - ${course.title}`);
    });
    
    console.log('\n💼 EGYPTIAN BUSINESS COURSES:');
    business.forEach((course, i) => {
      console.log(`  eg-${i + 1}: ${course.id} - ${course.title}`);
    });
    
    console.log('\n📚 OTHER FEATURED COURSES:');
    other.forEach((course, i) => {
      console.log(`  featured-${i + 1}: ${course.id} - ${course.title}`);
    });
    
    console.log('\n=== QUICK REPLACEMENT MAP ===');
    console.log('Replace in streamingCourseData.ts:');
    
    // Generate replacement suggestions
    const allCourses = [...programming, ...design, ...business, ...other];
    allCourses.slice(0, 10).forEach((course, i) => {
      console.log(`  "top-${i + 1}" -> "${course.id}"`);
    });
    
    console.log(`\nTotal courses available: ${courses.length}`);
    
  } catch (error) {
    console.error('Error fetching courses:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getCourseIds();