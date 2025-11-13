import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyFatmaDemoReady() {
  try {
    console.log('🔍 Final Verification: Fatma Demo Account Status')
    console.log('=' .repeat(60))

    // Get Fatma's complete profile
    const fatma = await prisma.user.findUnique({
      where: { email: 'fatma@demo.com' },
      include: {
        studyBuddyMatches: {
          include: {
            user1: {
              select: {
                id: true,
                name: true,
                arabicName: true,
                interests: true,
                goals: true,
                skillLevel: true
              }
            },
            user2: {
              select: {
                id: true,
                name: true,
                arabicName: true,
                interests: true,
                goals: true,
                skillLevel: true
              }
            }
          }
        },
        studyBuddyMatches2: {
          include: {
            user1: {
              select: {
                id: true,
                name: true,
                arabicName: true,
                interests: true,
                goals: true,
                skillLevel: true
              }
            },
            user2: {
              select: {
                id: true,
                name: true,
                arabicName: true,
                interests: true,
                goals: true,
                skillLevel: true
              }
            }
          }
        },
        conversationParticipants: {
          include: {
            conversation: {
              include: {
                messages: {
                  orderBy: {
                    createdAt: 'desc'
                  },
                  take: 1
                },
                participants: {
                  include: {
                    user: {
                      select: {
                        name: true,
                        arabicName: true
                      }
                    }
                  }
                },
                _count: {
                  select: {
                    messages: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!fatma) {
      console.log('❌ ERROR: Fatma account not found!')
      return
    }

    console.log('✅ USER PROFILE STATUS:')
    console.log(`   Name: ${fatma.name} (${fatma.arabicName})`)
    console.log(`   Email: ${fatma.email}`)
    console.log(`   Onboarding: ${fatma.onboardingCompleted ? '✅ Complete' : '❌ Incomplete'}`)
    console.log(`   Skill Level: ${fatma.skillLevel || '⚠️ Not set'}`)
    console.log(`   Learning Mode: ${fatma.learningMode || '⚠️ Not set'}`)
    
    // Parse and display interests
    const interests = fatma.interests ? JSON.parse(fatma.interests) : []
    console.log(`   Interests: ${interests.length > 0 ? interests.join(', ') : '⚠️ None set'}`)
    
    // Parse and display goals
    const goals = fatma.goals ? JSON.parse(fatma.goals) : []
    console.log(`   Goals: ${goals.length > 0 ? goals.join(', ') : '⚠️ None set'}`)

    // Study Buddy Preferences
    const preferences = fatma.studyBuddyPreferences ? JSON.parse(fatma.studyBuddyPreferences) : null
    console.log(`   Study Preferences: ${preferences ? '✅ Configured' : '⚠️ Not set'}`)
    if (preferences) {
      console.log(`      Times: ${preferences.preferredStudyTimes?.join(', ') || 'Not specified'}`)
      console.log(`      Subjects: ${preferences.preferredSubjects?.join(', ') || 'Not specified'}`)
      console.log(`      Style: ${preferences.studyStyle || 'Not specified'}`)
    }

    console.log('\n🤝 STUDY BUDDY MATCHES:')
    const allMatches = [...fatma.studyBuddyMatches, ...fatma.studyBuddyMatches2]
    console.log(`   Total Matches: ${allMatches.length}`)
    
    allMatches.forEach((match, index) => {
      const otherUser = match.user1Id === fatma.id ? match.user2 : match.user1
      const sharedSubjects = match.sharedSubjects ? JSON.parse(match.sharedSubjects) : []
      const sharedGoals = match.sharedGoals ? JSON.parse(match.sharedGoals) : []
      
      console.log(`\n   ${index + 1}. ${otherUser.name} (${otherUser.arabicName})`)
      console.log(`      Status: ${match.status}`)
      console.log(`      Level: ${otherUser.skillLevel || 'Not set'}`)
      console.log(`      Shared Subjects: ${sharedSubjects.join(', ') || 'None'}`)
      console.log(`      Shared Goals: ${sharedGoals.join(', ') || 'None'}`)
    })

    console.log('\n💬 MESSAGING STATUS:')
    console.log(`   Active Conversations: ${fatma.conversationParticipants.length}`)
    
    fatma.conversationParticipants.forEach((participant, index) => {
      const conv = participant.conversation
      const otherParticipant = conv.participants.find(p => p.userId !== fatma.id)
      const lastMessage = conv.messages[0]
      
      console.log(`\n   ${index + 1}. Chat with ${otherParticipant?.user.name || 'Unknown'}`)
      console.log(`      Messages: ${conv._count.messages}`)
      console.log(`      Last Activity: ${lastMessage?.createdAt.toLocaleString() || 'No messages'}`)
      if (lastMessage) {
        console.log(`      Preview: "${lastMessage.content.substring(0, 50)}${lastMessage.content.length > 50 ? '...' : ''}"`)
      }
    })

    // Demo readiness checklist
    console.log('\n📋 DEMO READINESS CHECKLIST:')
    const checklist = [
      { item: 'User profile complete', status: fatma.onboardingCompleted },
      { item: 'Has interests set', status: interests.length > 0 },
      { item: 'Has learning goals', status: goals.length > 0 },
      { item: 'Study buddy preferences', status: !!preferences },
      { item: 'Active study matches', status: allMatches.length >= 3 },
      { item: 'Active conversations', status: fatma.conversationParticipants.length >= 2 },
      { item: 'Recent message activity', status: fatma.conversationParticipants.some(p => 
        p.conversation.messages.length > 0 && 
        new Date(p.conversation.messages[0].createdAt).getTime() > Date.now() - 24*60*60*1000
      )}
    ]

    checklist.forEach(check => {
      console.log(`   ${check.status ? '✅' : '❌'} ${check.item}`)
    })

    const allReady = checklist.every(check => check.status)
    
    console.log('\n' + '='.repeat(60))
    if (allReady) {
      console.log('🎉 DEMO READY: All systems go for Fatma\'s study buddy demo!')
      console.log('\n🎬 Demo Flow Suggestions:')
      console.log('   1. Login as fatma@demo.com')
      console.log('   2. Navigate to Study Buddy section')
      console.log('   3. Show matched study partners with shared interests')
      console.log('   4. Open messaging to show active conversations')
      console.log('   5. Demonstrate study session coordination')
      console.log('   6. Highlight collaborative learning features')
    } else {
      console.log('⚠️ DEMO NEEDS ATTENTION: Some features may not work optimally')
    }

  } catch (error) {
    console.error('❌ Error verifying demo status:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyFatmaDemoReady()