import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkLiveSessions() {
  try {
    console.log('🔍 Checking live sessions and archived sessions in database...\n')

    // Check total live sessions
    const totalSessions = await prisma.liveSession.count()
    console.log(`📊 Total Live Sessions: ${totalSessions}`)

    if (totalSessions === 0) {
      console.log('❌ No live sessions found in database!\n')

      // Check if mentors have channels that could host sessions
      const channels = await prisma.creatorChannel.findMany({
        include: {
          creator: {
            include: {
              user: true
            }
          }
        }
      })

      console.log('📺 Available Creator Channels:')
      channels.forEach(channel => {
        console.log(`- ${channel.name} (${channel.creator.user.name}) - ID: ${channel.id}`)
      })

      console.log('\n💡 To create live sessions, you need to:')
      console.log('1. Use the mentor profile page to create sessions')
      console.log('2. Or create sessions programmatically via API')
      console.log('3. Or seed some test sessions')

      return
    }

    // Get all live sessions with details
    const sessions = await prisma.liveSession.findMany({
      include: {
        channel: {
          include: {
            creator: {
              include: {
                user: true
              }
            }
          }
        },
        attendees: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('\n📅 Live Sessions Details:')
    let activeCount = 0
    let archivedCount = 0

    sessions.forEach(session => {
      const status = session.status
      if (status === 'ACTIVE' || status === 'LIVE') activeCount++
      if (status === 'ARCHIVED' || status === 'ENDED') archivedCount++

      console.log(`\n🎥 Session: ${session.title}`)
      console.log(`  👤 Creator: ${session.channel.creator.user.name}`)
      console.log(`  📊 Status: ${status}`)
      console.log(`  👥 Attendees: ${session.attendees.length}`)
      console.log(`  📅 Scheduled: ${session.scheduledAt ? new Date(session.scheduledAt).toLocaleString() : 'Not scheduled'}`)
      console.log(`  🔗 Meeting URL: ${session.streamUrl || 'Not set'}`)
      console.log(`  🎞️ Recording URL: ${session.recordingUrl || 'Not available'}`)
      console.log(`  🏷️ Tier Required: ${session.tier || 'None'}`)
    })

    console.log('\n📈 Summary:')
    console.log(`🔴 Active/Live Sessions: ${activeCount}`)
    console.log(`📼 Archived Sessions: ${archivedCount}`)

    // Check for session attendees
    const totalAttendees = await prisma.sessionAttendee.count()
    console.log(`👥 Total Session Attendees: ${totalAttendees}`)

  } catch (error) {
    console.error('❌ Error checking live sessions:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkLiveSessions()