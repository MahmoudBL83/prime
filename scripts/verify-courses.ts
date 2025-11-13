import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('📊 Verifying course categories and thumbnails...\n')

    // Get courses by category
    const programmingCourses = await prisma.course.findMany({
        where: { category: 'PROGRAMMING' },
        select: { title: true, thumbnail: true, category: true }
    })

    const designCourses = await prisma.course.findMany({
        where: { category: 'DESIGN' },
        select: { title: true, thumbnail: true, category: true }
    })

    const businessCourses = await prisma.course.findMany({
        where: { category: 'BUSINESS' },
        select: { title: true, thumbnail: true, category: true }
    })

    console.log('🚀 PROGRAMMING COURSES:')
    programmingCourses.forEach((course, index) => {
        console.log(`  ${index + 1}. ${course.title}`)
        console.log(`     Thumbnail: ${course.thumbnail ? '✅ Has image' : '❌ Missing image'}`)
        console.log('')
    })

    console.log('🎨 DESIGN COURSES:')
    designCourses.forEach((course, index) => {
        console.log(`  ${index + 1}. ${course.title}`)
        console.log(`     Thumbnail: ${course.thumbnail ? '✅ Has image' : '❌ Missing image'}`)
        console.log('')
    })

    console.log('💼 BUSINESS COURSES:')
    businessCourses.forEach((course, index) => {
        console.log(`  ${index + 1}. ${course.title}`)
        console.log(`     Thumbnail: ${course.thumbnail ? '✅ Has image' : '❌ Missing image'}`)
        console.log('')
    })

    console.log('📈 SUMMARY:')
    console.log(`Programming courses: ${programmingCourses.length}`)
    console.log(`Design courses: ${designCourses.length}`)
    console.log(`Business courses: ${businessCourses.length}`)
    console.log(`Total courses: ${programmingCourses.length + designCourses.length + businessCourses.length}`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })