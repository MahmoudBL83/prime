import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedScheduledPosts() {
  console.log('🗓️  Seeding scheduled posts...')

  try {
    // Get all creators
    const creators = await prisma.creator.findMany({
      include: {
        user: true
      }
    })

    if (creators.length === 0) {
      console.log('❌ No creators found. Please run seed-creators.ts first.')
      return
    }

    // Get or create channels for each creator
    const channels = await Promise.all(
      creators.map(async (creator) => {
        let channel = await prisma.creatorChannel.findFirst({
          where: { creatorId: creator.id }
        })

        if (!channel) {
          channel = await prisma.creatorChannel.create({
            data: {
              creatorId: creator.id,
              name: `${creator.user.name}'s Channel`,
              nameAr: `قناة ${creator.user.name}`,
              description: `Exclusive educational content from ${creator.user.name}`,
              descriptionAr: `محتوى تعليمي حصري من ${creator.user.name}`,
              tiers: {
                bronze: { price: 49, benefits: ['Access to all posts', 'Weekly updates'] },
                silver: { price: 99, benefits: ['All Bronze benefits', 'Priority support', '1-on-1 sessions'] },
                gold: { price: 199, benefits: ['All Silver benefits', 'Exclusive content', 'Direct messaging'] }
              }
            }
          })
        }

        return { creator, channel }
      })
    )

    // Create scheduled posts for the current month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const postTemplates = [
      // Published posts (past dates)
      {
        title: 'Introduction to Advanced Mathematics',
        titleAr: 'مقدمة في الرياضيات المتقدمة',
        content: 'Today we explored complex numbers and their applications in real-world scenarios. Amazing session with great questions from students!',
        type: 'TEXT',
        tier: 'BRONZE',
        daysOffset: -5,
        isPublished: true
      },
      {
        title: 'Problem Solving Workshop',
        content: 'Solved 10 challenging problems today. Key takeaway: Always break down complex problems into smaller, manageable parts.',
        type: 'VIDEO',
        tier: 'SILVER',
        daysOffset: -3,
        isPublished: true
      },
      {
        title: 'Weekly Quiz Results',
        content: 'Great performance from everyone this week! Average score: 87%. Keep up the excellent work! 🎉',
        type: 'TEXT',
        tier: 'BRONZE',
        daysOffset: -1,
        isPublished: true
      },
      // Scheduled posts (future dates)
      {
        title: 'Upcoming Live Session',
        titleAr: 'الجلسة المباشرة القادمة',
        content: 'Join me this Thursday for a live Q&A session! We\'ll cover calculus, algebra, and any questions you have. Don\'t miss it!',
        type: 'ANNOUNCEMENT',
        tier: 'BRONZE',
        daysOffset: 2,
        isPublished: false
      },
      {
        title: 'New Video Tutorial: Integration Techniques',
        content: 'Coming soon! A comprehensive guide to integration by parts, substitution, and partial fractions. Premium members get early access.',
        type: 'VIDEO',
        tier: 'SILVER',
        daysOffset: 5,
        isPublished: false
      },
      {
        title: 'Exclusive VIP Content',
        content: 'VIP members only: Advanced problem-solving strategies and exam preparation tips. This is the content that will give you the edge!',
        type: 'DOCUMENT',
        tier: 'GOLD',
        daysOffset: 7,
        isPublished: false
      },
      {
        title: 'Weekend Study Tips',
        content: 'Planning your study schedule for maximum productivity. Learn the techniques I used to ace my exams!',
        type: 'TEXT',
        tier: 'BRONZE',
        daysOffset: 10,
        isPublished: false
      },
      {
        title: 'Monthly Challenge Problem',
        titleAr: 'مسألة التحدي الشهرية',
        content: 'Can you solve this? First 3 correct solutions get a free 1-on-1 coaching session! Submit your answers in the comments.',
        type: 'IMAGE',
        tier: 'BRONZE',
        daysOffset: 14,
        isPublished: false
      },
      // Draft posts (no schedule)
      {
        title: 'Draft: New Course Announcement',
        content: 'Working on something exciting... Stay tuned! This will be my most comprehensive course yet.',
        type: 'TEXT',
        tier: 'BRONZE',
        daysOffset: null,
        isPublished: false
      }
    ]

    let totalPosts = 0

    for (const { creator, channel } of channels) {
      console.log(`📝 Creating posts for ${creator.user.name}...`)

      for (const template of postTemplates) {
        const scheduledAt = template.daysOffset !== null
          ? new Date(now.getTime() + template.daysOffset * 24 * 60 * 60 * 1000)
          : null

        const publishedAt = template.isPublished && scheduledAt
          ? scheduledAt
          : null

        await prisma.channelPost.create({
          data: {
            channelId: channel.id,
            title: template.title,
            titleAr: template.titleAr || null,
            content: template.content,
            type: template.type as any,
            tier: template.tier,
            scheduledAt,
            publishedAt,
            viewCount: template.isPublished ? Math.floor(Math.random() * 500) + 50 : 0,
            isPinned: false
          }
        })

        totalPosts++
      }

      // Add some likes and comments to published posts
      const publishedPosts = await prisma.channelPost.findMany({
        where: {
          channelId: channel.id,
          publishedAt: { not: null }
        }
      })

      // Create some random likes
      for (const post of publishedPosts) {
        const likeCount = Math.floor(Math.random() * 50) + 5
        // Note: We can't create likes without user IDs, so we'll skip this for now
        // In production, you'd create actual user accounts and likes
      }
    }

    console.log(`✅ Created ${totalPosts} scheduled posts across ${channels.length} channels`)
    console.log('📊 Post distribution:')
    console.log('   - Published posts (past): 3 per creator')
    console.log('   - Scheduled posts (future): 5 per creator')
    console.log('   - Draft posts: 1 per creator')

  } catch (error) {
    console.error('❌ Error seeding scheduled posts:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed
seedScheduledPosts()
  .then(() => {
    console.log('✅ Scheduled posts seeding completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Scheduled posts seeding failed:', error)
    process.exit(1)
  })
