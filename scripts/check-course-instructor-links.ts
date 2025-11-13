import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkCourseInstructorLinks() {
    try {
        // Check existing courses and their instructor links
        const courses = await prisma.course.findMany({
            include: {
                creator: {
                    include: {
                        user: true
                    }
                }
            }
        })

        console.log(`Found ${courses.length} courses:`)
        courses.forEach((course, index) => {
            console.log(`${index + 1}. Course: ${course.title}`)
            console.log(`   Instructor: ${course.creator?.user?.name || 'NOT LINKED'}`)
            console.log(`   Creator ID: ${course.creatorId}`)
            console.log('   ---')
        })

        // Check all instructors
        const instructors = await prisma.creator.findMany({
            include: {
                user: true,
                courses: true
            }
        })

        console.log(`\nFound ${instructors.length} instructors:`)
        instructors.forEach((instructor, index) => {
            console.log(`${index + 1}. ${instructor.user.name} (ID: ${instructor.id})`)
            console.log(`   Courses: ${instructor.courses.length}`)
            instructor.courses.forEach(course => {
                console.log(`     - ${course.title}`)
            })
            console.log('   ---')
        })

        // Check unlinked courses
        const unlinkedCourses = courses.filter(course => !course.creator)
        if (unlinkedCourses.length > 0) {
            console.log(`\n⚠️  Found ${unlinkedCourses.length} courses without instructors:`)
            unlinkedCourses.forEach(course => {
                console.log(`  - ${course.title} (ID: ${course.id})`)
            })
        }

    } catch (error) {
        console.error('Error checking course-instructor links:', error)
    } finally {
        await prisma.$disconnect()
    }
}

checkCourseInstructorLinks()