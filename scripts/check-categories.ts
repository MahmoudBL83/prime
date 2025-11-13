import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔍 Checking existing categories...')
    
    // Count total courses
    const totalCourses = await prisma.course.count()
    console.log(`📊 Total courses: ${totalCourses}`)
    
    if (totalCourses === 0) {
      console.log('📝 No courses found. Let\'s create some demo categories!')
      return
    }
    
    // Get all courses with categories
    const courses = await prisma.course.findMany({
      select: {
        title: true,
        category: true,
        categoryAr: true,
        status: true
      }
    })

    // Get unique categories
    const categories = [...new Set(courses.map(c => c.category).filter(Boolean))]
    const arabicCategories = [...new Set(courses.map(c => c.categoryAr).filter(Boolean))]
    
    console.log('\n🏷️ English Categories:', categories)
    console.log('🏷️ Arabic Categories:', arabicCategories)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()