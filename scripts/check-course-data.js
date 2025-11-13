const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkCourseData() {
    try {
        console.log('🔍 Checking course data in database...\n')
        
        const courses = await prisma.course.findMany({
            include: {
                lessons: {
                    orderBy: { order: 'asc' }
                },
                creator: {
                    include: {
                        user: true
                    }
                }
            }
        })
        
        console.log(`📚 Total Courses: ${courses.length}\n`)
        
        courses.forEach((course, index) => {
            console.log(`\n${'='.repeat(60)}`)
            console.log(`Course ${index + 1}:`)
            console.log(`${'='.repeat(60)}`)
            console.log(`ID: ${course.id}`)
            console.log(`Title: ${course.title}`)
            console.log(`Title (AR): ${course.titleAr || 'N/A'}`)
            console.log(`Content Type: ${course.contentType}`)
            console.log(`Total Lessons: ${course.lessons.length}`)
            console.log(`Total Modules: ${course.totalSeasons || 'N/A'}`)
            console.log(`Creator: ${course.creator?.user?.name || 'None'}`)
            console.log(`Rating: ${course.rating || 'N/A'}`)
            console.log(`Enrollments: ${course.totalEnrollments || 0}`)
            
            if (course.lessons.length > 0) {
                console.log(`\n📝 Lessons:`)
                course.lessons.forEach((lesson, idx) => {
                    console.log(`  ${idx + 1}. [S${lesson.seasonNumber}E${lesson.episodeNumber}] ${lesson.title} (${lesson.duration}min)`)
                })
            } else {
                console.log(`\n⚠️  No lessons found for this course!`)
            }
        })
        
        if (courses.length === 0) {
            console.log('❌ No courses found in database!')
            console.log('💡 Run: node scripts/add-course-lessons.js')
        }
        
    } catch (error) {
        console.error('❌ Error checking course data:', error)
    } finally {
        await prisma.$disconnect()
    }
}

checkCourseData()
