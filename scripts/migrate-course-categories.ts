import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Migrate existing courses to have contentCategory
 * and properly categorize them based on their characteristics
 */
async function main() {
    console.log('🔄 Starting course migration...\n')

    try {
        // Get all courses
        const allCourses = await prisma.course.findMany({
            include: {
                creator: {
                    include: {
                        user: true
                    }
                }
            }
        })

        console.log(`📚 Found ${allCourses.length} courses to migrate\n`)

        // Statistics
        let categoryA = 0
        let categoryB = 0
        let categoryC = 0

        // Categorize courses based on criteria
        for (const course of allCourses) {
            let contentCategory: 'CATEGORY_A' | 'CATEGORY_B' | 'CATEGORY_C' = 'CATEGORY_A'

            // Category B criteria: High rating, many enrollments, or "signature" in title
            if (
                course.rating >= 4.5 && 
                course.totalEnrollments > 100
            ) {
                contentCategory = 'CATEGORY_B'
                categoryB++
            }
            // Category C criteria: Could be creator-specific or exclusive content
            // For now, we'll keep most as Category A (All-Access Library)
            else {
                contentCategory = 'CATEGORY_A'
                categoryA++
            }

            // Update course
            await prisma.course.update({
                where: { id: course.id },
                data: {
                    contentCategory,
                    // Set price to null for Category A and B (subscription-only)
                    price: contentCategory === 'CATEGORY_C' ? course.price : null
                }
            })

            console.log(`✅ Updated: "${course.title}" → ${contentCategory}`)
        }

        console.log('\n📊 Migration Summary:')
        console.log(`   Category A (All-Access): ${categoryA} courses`)
        console.log(`   Category B (Signature):  ${categoryB} courses`)
        console.log(`   Category C (Creators):   ${categoryC} courses`)
        console.log(`   Total:                   ${allCourses.length} courses`)

        console.log('\n✨ Migration completed successfully!')

    } catch (error) {
        console.error('❌ Migration failed:', error)
        throw error
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
