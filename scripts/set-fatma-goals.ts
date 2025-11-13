import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function setFatmaGoals() {
  try {
    const goals = [
      'master-javascript',
      'build-web-applications', 
      'get-job-ready',
      'create-portfolio',
      'learn-react'
    ]

    await prisma.user.update({
      where: { email: 'fatma@demo.com' },
      data: {
        goals: JSON.stringify(goals)
      }
    })

    console.log('✅ Updated Fatma\'s goals:', goals.join(', '))

    // Also update the shared goals in matches
    const fatma = await prisma.user.findUnique({
      where: { email: 'fatma@demo.com' }
    })

    if (fatma) {
      const matches = await prisma.studyBuddyMatch.findMany({
        where: {
          OR: [
            { user1Id: fatma.id },
            { user2Id: fatma.id }
          ]
        }
      })

      for (const match of matches) {
        await prisma.studyBuddyMatch.update({
          where: { id: match.id },
          data: {
            sharedGoals: JSON.stringify(['master-javascript', 'build-projects', 'get-job-ready'])
          }
        })
      }

      console.log('✅ Updated shared goals in all matches')
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setFatmaGoals()