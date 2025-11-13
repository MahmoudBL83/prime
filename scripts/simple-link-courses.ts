import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function linkCoursesToInstructorsSimple() {
    try {
        console.log('🔄 Linking existing courses to instructors...\n')

        // Get all instructors
        const instructors = await prisma.creator.findMany({
            include: {
                user: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        })

        console.log(`Found ${instructors.length} instructors`)

        // Get all existing courses
        const allCourses = await prisma.course.findMany({
            include: {
                creator: {
                    include: {
                        user: true
                    }
                }
            }
        })

        console.log(`Found ${allCourses.length} courses\n`)

        // Define course assignments based on instructor expertise
        const courseAssignments = [
            {
                instructorName: 'Ahmed Hassan',
                coursePatterns: ['React', 'JavaScript', 'Frontend', 'Advanced React']
            },
            {
                instructorName: 'Fatima Al-Zahra',
                coursePatterns: ['UI/UX', 'Design', 'Figma']
            },
            {
                instructorName: 'Mohamed Saeed',
                coursePatterns: ['Node.js', 'Backend', 'API', 'Server']
            }
        ]

        // Assign existing courses to instructors based on content
        for (const course of allCourses) {
            let assignedInstructor = null
            
            // Find best matching instructor based on course title/content
            for (const assignment of courseAssignments) {
                for (const pattern of assignment.coursePatterns) {
                    if (course.title.toLowerCase().includes(pattern.toLowerCase())) {
                        assignedInstructor = instructors.find(i => i.user.name === assignment.instructorName)
                        break
                    }
                }
                if (assignedInstructor) break
            }

            // If no specific match, assign to Ahmed Hassan as default (most general expertise)
            if (!assignedInstructor) {
                assignedInstructor = instructors.find(i => i.user.name === 'Ahmed Hassan')
            }

            if (assignedInstructor && course.creatorId !== assignedInstructor.id) {
                await prisma.course.update({
                    where: { id: course.id },
                    data: { creatorId: assignedInstructor.id }
                })
                console.log(`✅ Assigned "${course.title}" to ${assignedInstructor.user.name}`)
            } else if (assignedInstructor) {
                console.log(`✓ "${course.title}" already assigned to ${assignedInstructor.user.name}`)
            }
        }

        // Final verification
        console.log('\n✨ Final course distribution:')
        const finalInstructors = await prisma.creator.findMany({
            include: {
                user: true,
                courses: {
                    select: {
                        id: true,
                        title: true,
                        category: true,
                        price: true
                    }
                }
            }
        })

        let totalCourses = 0
        finalInstructors.forEach((instructor) => {
            console.log(`\n📋 ${instructor.user.name} (${instructor.courses.length} courses):`)
            instructor.courses.forEach(course => {
                console.log(`   - ${course.title} (${course.category}) - $${course.price}`)
            })
            totalCourses += instructor.courses.length
        })

        console.log(`\n🎉 Successfully linked ${totalCourses} courses across ${finalInstructors.length} instructors!`)

    } catch (error) {
        console.error('❌ Error linking courses to instructors:', error)
    } finally {
        await prisma.$disconnect()
    }
}

linkCoursesToInstructorsSimple()