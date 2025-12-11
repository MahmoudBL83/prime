import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkMentors() {
  try {
    console.log('🔍 Checking mentor accounts in database...')

    // Check total users
    const totalUsers = await prisma.user.count()
    console.log(`Total users: ${totalUsers}`)

    // Check all mentor emails
    const mentorEmails = [
      'mokhtarasmaa817@gmail.com',
      'sofiasafwat12@gmail.com',
      'yosefyasser589@gmail.com',
      'khaleelmhdi@gmail.com',
      'mohax.radwan@gmail.com',
      'andrewmagdy010610@gmail.com',
      'mohdyasser100@gmail.com',
      'mohamedaminamin74@gmail.com',
      'beshoykhairy99@gmail.com',
      'omarrady474@gmail.com',
      'ziadtamer756@gmail.com',
      'muhammed.tarekk50@gmail.com',
      'ahmedradoun@gmail.com',
      'hima.azab.eg@gmail.com',
      'aimansheikh09@gmail.com'
    ]

    const mentors = await prisma.user.findMany({
      where: {
        email: { in: mentorEmails }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    console.log(`\nFound ${mentors.length} mentor accounts:`)
    mentors.forEach(mentor => {
      console.log(`- ${mentor.name} (${mentor.email}) - Role: ${mentor.role}`)
    })

    // Check creators
    const creators = await prisma.creator.count()
    console.log(`\nTotal creators: ${creators}`)

    // Check channels
    const channels = await prisma.creatorChannel.count()
    console.log(`Total channels: ${channels}`)

  } catch (error) {
    console.error('❌ Error checking database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkMentors()