import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyMentorData() {
  try {
    console.log('🔍 Verifying complete mentor data in database...\n')

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

    let completeProfiles = 0
    let missingCreators = 0
    let missingChannels = 0

    for (const email of mentorEmails) {
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          creator: {
            include: {
              channels: true
            }
          }
        }
      })

      if (!user) {
        console.log(`❌ User not found: ${email}`)
        continue
      }

      console.log(`👤 ${user.name} (${email})`)

      if (user.creator) {
        console.log(`  ✅ Creator profile: ${user.creator.expertise}`)
        console.log(`  💰 Pricing: Basic $${user.creator.basicMonthlyPrice}, Premium $${user.creator.premiumMonthlyPrice}, VIP $${user.creator.vipMonthlyPrice}`)

        if (user.creator.channels && user.creator.channels.length > 0) {
          console.log(`  📺 Channel: ${user.creator.channels[0].name}`)
          completeProfiles++
        } else {
          console.log(`  ❌ Missing channel`)
          missingChannels++
        }
      } else {
        console.log(`  ❌ Missing creator profile`)
        missingCreators++
      }

      console.log('')
    }

    console.log('📊 Summary:')
    console.log(`✅ Complete profiles: ${completeProfiles}/15`)
    console.log(`❌ Missing creators: ${missingCreators}`)
    console.log(`❌ Missing channels: ${missingChannels}`)

    if (completeProfiles === 15) {
      console.log('\n🎉 All mentor accounts are properly set up in the database!')
    } else {
      console.log('\n⚠️  Some mentor accounts are incomplete!')
    }

  } catch (error) {
    console.error('❌ Error verifying mentor data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyMentorData()