import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const postTemplates = {
  text: [
    {
      title: "Welcome to My Channel!",
      titleAr: "مرحباً بكم في قناتي!",
      content: "I'm excited to share my knowledge and experience with you all. Subscribe to get exclusive access to premium content, live sessions, and personalized guidance. Let's learn and grow together! 🚀",
      contentAr: "أنا متحمس لمشاركة معرفتي وخبرتي معكم جميعاً. اشترك للحصول على وصول حصري للمحتوى المميز والجلسات المباشرة والإرشاد الشخصي. دعونا نتعلم وننمو معاً! 🚀",
      tier: "BRONZE"
    },
    {
      title: "New Course Alert! 🎯",
      titleAr: "تنبيه دورة جديدة! 🎯",
      content: "Just launched my comprehensive masterclass! Premium members get instant access. This course covers everything from basics to advanced techniques. Don't miss out!",
      contentAr: "أطلقت للتو ماستر كلاس شاملة! يحصل الأعضاء المميزون على وصول فوري. تغطي هذه الدورة كل شيء من الأساسيات إلى التقنيات المتقدمة. لا تفوت الفرصة!",
      tier: "SILVER"
    },
    {
      title: "Pro Tip of the Day 💡",
      titleAr: "نصيحة احترافية اليوم 💡",
      content: "Here's a game-changing strategy I've been using for years. This single tip has helped hundreds of my students achieve breakthrough results. Gold members, check your inbox for the detailed guide!",
      contentAr: "إليكم استراتيجية تغير قواعد اللعبة استخدمتها لسنوات. ساعدت هذه النصيحة الواحدة المئات من طلابي على تحقيق نتائج اختراقية. أعضاء الذهبية، تحققوا من بريدكم الإلكتروني للحصول على الدليل التفصيلي!",
      tier: "GOLD"
    },
    {
      title: "Behind the Scenes 🎬",
      titleAr: "من وراء الكواليس 🎬",
      content: "Exclusive look at how I prepare my content and what goes into creating world-class educational materials. VIP members get access to my entire workflow and templates!",
      contentAr: "نظرة حصرية على كيفية إعداد محتواي وما يدخل في إنشاء مواد تعليمية عالمية المستوى. يحصل أعضاء VIP على وصول إلى سير العمل الكامل والقوالب الخاصة بي!",
      tier: "VIP"
    },
    {
      title: "Student Success Story 🌟",
      titleAr: "قصة نجاح طالب 🌟",
      content: "Nothing makes me prouder than seeing my students succeed! Today I want to share an incredible transformation story. This proves that with dedication and the right guidance, anything is possible!",
      contentAr: "لا شيء يجعلني أكثر فخراً من رؤية طلابي ينجحون! اليوم أريد مشاركة قصة تحول لا تصدق. هذا يثبت أنه مع التفاني والإرشاد الصحيح، كل شيء ممكن!",
      tier: "BRONZE"
    },
    {
      title: "Live Session Announcement 📅",
      titleAr: "إعلان جلسة مباشرة 📅",
      content: "Join me this Friday for an exclusive live Q&A session! I'll be answering all your questions and sharing insights you won't find anywhere else. Premium members, mark your calendars!",
      contentAr: "انضم إلي هذا الجمعة لجلسة أسئلة وأجوبة مباشرة حصرية! سأجيب على جميع أسئلتكم وأشارك رؤى لن تجدوها في أي مكان آخر. الأعضاء المميزون، حددوا تقاويمكم!",
      tier: "SILVER"
    },
    {
      title: "Industry Insights 📊",
      titleAr: "رؤى الصناعة 📊",
      content: "The landscape is changing rapidly. Here are the top 5 trends you need to know about right now. This analysis is based on years of experience and current market research.",
      contentAr: "المشهد يتغير بسرعة. إليكم أهم 5 اتجاهات تحتاجون لمعرفتها الآن. هذا التحليل مبني على سنوات من الخبرة وأبحاث السوق الحالية.",
      tier: "GOLD"
    },
    {
      title: "Exclusive Resource Drop 🎁",
      titleAr: "إصدار موارد حصرية 🎁",
      content: "VIP ONLY: I'm releasing my personal toolkit that I've refined over 10+ years. This includes templates, checklists, and frameworks that will save you countless hours!",
      contentAr: "VIP فقط: أصدر مجموعة أدواتي الشخصية التي صقلتها على مدى أكثر من 10 سنوات. يتضمن هذا قوالب وقوائم تحقق وأطر عمل ستوفر لك ساعات لا تحصى!",
      tier: "VIP"
    }
  ],
  announcement: [
    {
      title: "🎉 Milestone Celebration!",
      titleAr: "🎉 احتفال بالإنجاز!",
      content: "We just hit 10,000 subscribers! To celebrate, I'm offering a special discount on all premium tiers this week. Thank you for your amazing support! 🙏",
      contentAr: "وصلنا للتو إلى 10,000 مشترك! للاحتفال، أقدم خصمًا خاصًا على جميع المستويات المميزة هذا الأسبوع. شكراً لدعمكم المذهل! 🙏",
      tier: "BRONZE"
    },
    {
      title: "📢 Important Update",
      titleAr: "📢 تحديث مهم",
      content: "New content schedule starting next month! I'm adding 2 more live sessions per week and releasing bonus materials every Friday. Premium members will love what's coming!",
      contentAr: "جدول محتوى جديد يبدأ الشهر القادم! سأضيف جلستين مباشرتين أخريين كل أسبوع وإصدار مواد إضافية كل جمعة. سيحب الأعضاء المميزون ما سيأتي!",
      tier: "SILVER"
    }
  ]
}

async function seedCreatorPosts() {
  console.log('🌱 Starting to seed creator posts...')

  try {
    // Get all verified creators with their channels
    const creators = await prisma.creator.findMany({
      where: {
        kycStatus: 'VERIFIED'
      },
      include: {
        user: true,
        channels: true
      }
    })

    console.log(`📊 Found ${creators.length} verified creators`)

    if (creators.length === 0) {
      console.log('⚠️  No verified creators found. Please run the instructor seed script first.')
      return
    }

    let totalPostsCreated = 0

    for (const creator of creators) {
      console.log(`\n👤 Creating posts for ${creator.user.name}...`)

      // If creator doesn't have a channel, create one
      let channel = creator.channels[0]
      if (!channel) {
        console.log(`  📺 Creating channel for ${creator.user.name}...`)
        channel = await prisma.creatorChannel.create({
          data: {
            creatorId: creator.id,
            name: `${creator.user.name}'s Channel`,
            nameAr: `قناة ${creator.user.arabicName || creator.user.name}`,
            description: `Welcome to my channel! Subscribe for exclusive content and insights about ${creator.expertise || 'education'}.`,
            descriptionAr: `مرحباً بكم في قناتي! اشترك للحصول على محتوى ورؤى حصرية حول ${creator.expertise || 'التعليم'}.`,
            tiers: JSON.stringify({
              BRONZE: { price: creator.basicMonthlyPrice || 49, features: ['Access to all posts', 'Community access'] },
              SILVER: { price: creator.premiumMonthlyPrice || 99, features: ['Everything in Bronze', 'Live Q&A sessions', 'Priority support'] },
              GOLD: { price: creator.vipMonthlyPrice || 199, features: ['Everything in Silver', '1-on-1 sessions', 'Direct messaging'] },
              VIP: { price: (creator.vipMonthlyPrice || 199) * 1.5, features: ['Everything in Gold', 'Custom content', 'Personal coaching'] }
            })
          }
        })
      }

      // Create 5-8 posts per creator with varied content
      const numPosts = Math.floor(Math.random() * 4) + 5 // 5-8 posts
      const postsToCreate = []

      for (let i = 0; i < numPosts; i++) {
        const isAnnouncement = Math.random() > 0.8
        const templates = isAnnouncement ? postTemplates.announcement : postTemplates.text
        const template = templates[Math.floor(Math.random() * templates.length)]
        
        // Vary the publish date (last 30 days)
        const daysAgo = Math.floor(Math.random() * 30)
        const publishDate = new Date()
        publishDate.setDate(publishDate.getDate() - daysAgo)

        postsToCreate.push({
          channelId: channel.id,
          title: template.title,
          titleAr: template.titleAr,
          content: template.content,
          contentAr: template.contentAr,
          type: isAnnouncement ? 'ANNOUNCEMENT' : 'TEXT',
          tier: template.tier,
          publishedAt: publishDate,
          isPinned: i === 0, // Pin the first post
          viewCount: Math.floor(Math.random() * 1000) + 100,
          createdAt: publishDate,
          updatedAt: publishDate
        })
      }

      // Create all posts for this creator
      await prisma.channelPost.createMany({
        data: postsToCreate
      })

      console.log(`  ✅ Created ${postsToCreate.length} posts for ${creator.user.name}`)
      totalPostsCreated += postsToCreate.length

      // Add some random likes to posts
      const createdPosts = await prisma.channelPost.findMany({
        where: { channelId: channel.id },
        select: { id: true }
      })

      // Get some random users to like posts
      const users = await prisma.user.findMany({
        take: 20,
        select: { id: true }
      })

      if (users.length > 0) {
        for (const post of createdPosts) {
          // Randomly select 3-10 users to like this post
          const numLikes = Math.floor(Math.random() * 8) + 3
          const likingUsers = users
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.min(numLikes, users.length))

          // Create likes one by one to handle duplicates
          for (const user of likingUsers) {
            try {
              await prisma.postLike.create({
                data: {
                  postId: post.id,
                  userId: user.id
                }
              })
            } catch (error) {
              // Ignore duplicate errors
            }
          }
        }
      }

      // Add some comments to random posts
      if (users.length > 0 && createdPosts.length > 0) {
        const commentTemplates = [
          "This is exactly what I needed! Thanks for sharing! 🙏",
          "Great content as always! Can't wait for the next one.",
          "This helped me so much. You're an amazing teacher!",
          "Subscribed! Your content is top-notch 🔥",
          "When is the next live session? Don't want to miss it!",
          "Best decision ever to join your channel!",
          "محتوى رائع! شكراً لك على المشاركة",
          "معلومات قيمة جداً، استفدت كثيراً",
          "متى الجلسة المباشرة القادمة؟",
          "أفضل قرار اتخذته بالانضمام لقناتك!"
        ]

        for (const post of createdPosts) {
          const numComments = Math.floor(Math.random() * 5) + 1 // 1-5 comments per post
          const comments = []

          for (let i = 0; i < numComments; i++) {
            const randomUser = users[Math.floor(Math.random() * users.length)]
            const randomComment = commentTemplates[Math.floor(Math.random() * commentTemplates.length)]
            
            comments.push({
              postId: post.id,
              userId: randomUser.id,
              content: randomComment,
              createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Last 7 days
            })
          }

          await prisma.postComment.createMany({
            data: comments
          })
        }
      }
    }

    console.log(`\n✅ Successfully created ${totalPostsCreated} posts across ${creators.length} creators!`)
    console.log('🎉 Post seeding complete!')

  } catch (error) {
    console.error('❌ Error seeding posts:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedCreatorPosts()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
