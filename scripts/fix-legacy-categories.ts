import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Fix existing courses with generic categories
const COURSE_CATEGORY_FIXES = [
  // These are likely existing courses that need proper categorization
  {
    titlePattern: 'web|html|css|javascript|react|frontend|backend',
    category: 'Programming & Development',
    categoryAr: 'البرمجة والتطوير'
  },
  {
    titlePattern: 'business|entrepreneur|marketing|sales',
    category: 'Business & Entrepreneurship', 
    categoryAr: 'الأعمال وريادة المشاريع'
  },
  {
    titlePattern: 'design|photoshop|illustrator|ui|ux',
    category: 'Design & Creative Arts',
    categoryAr: 'التصميم والفنون الإبداعية'
  },
  {
    titlePattern: 'data|analytics|python|statistics',
    category: 'Data Science & Analytics',
    categoryAr: 'علوم البيانات والتحليلات'
  },
  {
    titlePattern: 'digital|social media|seo|ads',
    category: 'Digital Marketing',
    categoryAr: 'التسويق الرقمي'
  },
  {
    titlePattern: 'english|arabic|language|communication',
    category: 'Languages & Communication',
    categoryAr: 'اللغات والتواصل'
  },
  {
    titlePattern: 'finance|accounting|investment|money',
    category: 'Finance & Accounting',
    categoryAr: 'المالية والمحاسبة'
  },
  {
    titlePattern: 'personal|productivity|time|leadership',
    category: 'Personal Development',
    categoryAr: 'التنمية الشخصية'
  }
]

async function fixExistingCourses() {
  try {
    console.log('🔧 Fixing existing courses with generic categories...')

    // Get courses with CATEGORY_A
    const coursesToFix = await prisma.course.findMany({
      where: {
        category: 'CATEGORY_A'
      }
    })

    console.log(`📋 Found ${coursesToFix.length} courses to categorize`)

    for (const course of coursesToFix) {
      console.log(`\n🔍 Analyzing: "${course.title}"`)
      
      // Try to match with title/description
      let matchedCategory = null
      
      for (const fix of COURSE_CATEGORY_FIXES) {
        const regex = new RegExp(fix.titlePattern, 'i')
        if (regex.test(course.title) || regex.test(course.description || '')) {
          matchedCategory = fix
          break
        }
      }

      // Default fallback based on common course patterns
      if (!matchedCategory) {
        // Check if it's likely a tech course
        if (course.title.toLowerCase().includes('tech') || 
            course.title.toLowerCase().includes('programming') ||
            course.title.toLowerCase().includes('code')) {
          matchedCategory = {
            category: 'Technology & Innovation',
            categoryAr: 'التكنولوجيا والابتكار'
          }
        } else {
          // Default to Business if unsure
          matchedCategory = {
            category: 'Business & Entrepreneurship',
            categoryAr: 'الأعمال وريادة المشاريع'
          }
        }
      }

      // Update the course
      await prisma.course.update({
        where: { id: course.id },
        data: {
          category: matchedCategory.category,
          categoryAr: matchedCategory.categoryAr,
          // Also fix skill levels if needed
          skillLevelAr: course.skillLevel === 'Beginner' ? 'مبتدئ' :
                       course.skillLevel === 'Intermediate' ? 'متوسط' :
                       course.skillLevel === 'Advanced' ? 'متقدم' :
                       course.skillLevel === 'CATEGORY_A' ? 'مبتدئ' : course.skillLevelAr
        }
      })

      console.log(`✅ Updated to: ${matchedCategory.category} (${matchedCategory.categoryAr})`)
    }

    // Final check - get updated distribution
    const updatedDistribution = await prisma.course.groupBy({
      by: ['category'],
      _count: { category: true }
    })

    console.log('\n🎉 Category fixing completed!')
    console.log('\n📊 Updated categories distribution:')
    updatedDistribution.forEach(cat => {
      console.log(`  ${cat.category}: ${cat._count.category} courses`)
    })

  } catch (error) {
    console.error('❌ Error fixing courses:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

fixExistingCourses()
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })