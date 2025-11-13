const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting creator seed...');

  // Create creator users
  const creators = [
    {
      email: 'sarah.tech@edtech.com',
      name: 'Sarah Johnson',
      arabicName: 'سارة جونسون',
      bio: 'Full-stack developer with 10+ years of experience. Passionate about teaching modern web development.',
      profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      expertise: 'Web Development, React, Node.js',
      channelName: 'Sarah\'s Code Academy',
      channelDescription: 'Learn modern web development from zero to hero'
    },
    {
      email: 'mike.data@edtech.com',
      name: 'Mike Chen',
      arabicName: 'مايك تشن',
      bio: 'Data Scientist and ML Engineer. Making complex concepts simple and fun.',
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      expertise: 'Data Science, Machine Learning, Python',
      channelName: 'Data Science Hub',
      channelDescription: 'Master data science and machine learning'
    },
    {
      email: 'emma.design@edtech.com',
      name: 'Emma Wilson',
      arabicName: 'إيما ويلسون',
      bio: 'UI/UX Designer with a passion for creating beautiful and functional designs.',
      profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
      expertise: 'UI/UX Design, Figma, Design Systems',
      channelName: 'Design with Emma',
      channelDescription: 'Create stunning designs that users love'
    },
    {
      email: 'david.business@edtech.com',
      name: 'David Miller',
      arabicName: 'ديفيد ميلر',
      bio: 'Business strategist and entrepreneur. Helping others build successful businesses.',
      profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
      expertise: 'Business Strategy, Entrepreneurship, Marketing',
      channelName: 'Business Mastery',
      channelDescription: 'Build and grow your business like a pro'
    },
    {
      email: 'lisa.marketing@edtech.com',
      name: 'Lisa Anderson',
      arabicName: 'ليزا أندرسون',
      bio: 'Digital marketing expert with proven track record of growing brands online.',
      profileImage: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400',
      expertise: 'Digital Marketing, SEO, Social Media',
      channelName: 'Marketing Pro',
      channelDescription: 'Master digital marketing and grow your brand'
    },
  ];

  const password = await bcrypt.hash('Password123!', 10);

  for (const creatorData of creators) {
    console.log(`Creating creator: ${creatorData.name}`);

    // Create user
    const user = await prisma.user.upsert({
      where: { email: creatorData.email },
      update: {},
      create: {
        email: creatorData.email,
        passwordHash: password,
        name: creatorData.name,
        arabicName: creatorData.arabicName,
        bio: creatorData.bio,
        profileImage: creatorData.profileImage,
        role: 'CREATOR',
        emailVerified: new Date(),
        onboardingCompleted: true,
      },
    });

    console.log(`  ✓ User created: ${user.id}`);

    // Create creator profile
    const creator = await prisma.creator.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        expertise: creatorData.expertise,
        kycStatus: 'VERIFIED',
        contractSigned: true,
        contractSignedAt: new Date(),
        basicMonthlyPrice: 29,
        basicYearlyPrice: 279,
        premiumMonthlyPrice: 49,
        premiumYearlyPrice: 469,
        vipMonthlyPrice: 79,
        vipYearlyPrice: 759,
        availableForMeetings: true,
        totalEarnings: Math.floor(Math.random() * 10000) + 5000,
        totalSubscribers: Math.floor(Math.random() * 1000) + 100,
      },
    });

    console.log(`  ✓ Creator profile created: ${creator.id}`);

    // Create channel
    const channel = await prisma.creatorChannel.create({
      data: {
        creatorId: creator.id,
        name: creatorData.channelName,
        nameAr: creatorData.channelName + ' (عربي)',
        description: creatorData.channelDescription,
        descriptionAr: creatorData.channelDescription + ' (النسخة العربية)',
        coverImage: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000000)}?w=1200`,
        tiers: JSON.stringify({
          BRONZE: { price: 29, benefits: ['Access to basic content', 'Community forum'] },
          SILVER: { price: 49, benefits: ['Everything in Bronze', 'Premium content', 'Priority support'] },
          GOLD: { price: 79, benefits: ['Everything in Silver', 'Live sessions', '1-on-1 coaching'] }
        }),
        totalSubscribers: Math.floor(Math.random() * 1000) + 100,
      },
    });

    console.log(`  ✓ Channel created: ${channel.id}`);

    // Create posts for each channel
    const postTemplates = [
      {
        type: 'TEXT',
        title: 'Welcome to My Channel! 🎉',
        titleAr: 'مرحباً بك في قناتي! 🎉',
        content: `Hey everyone! I'm so excited to have you here. In this channel, I'll be sharing exclusive content, tips, and insights about ${creatorData.expertise}. Let's learn and grow together!`,
        contentAr: 'مرحباً بالجميع! أنا متحمس جداً لوجودكم هنا. في هذه القناة، سأشارك محتوى حصري ونصائح ورؤى حول التطوير والتعلم. دعونا نتعلم وننمو معاً!',
        tier: 'BRONZE',
        isPinned: true,
      },
      {
        type: 'VIDEO',
        title: 'Quick Tutorial: Getting Started',
        titleAr: 'درس سريع: البدء',
        content: 'Check out this quick video tutorial where I walk you through the basics!',
        contentAr: 'شاهد هذا الفيديو التعليمي السريع حيث أرشدك خلال الأساسيات!',
        mediaUrl: '/videos/demo/course-promo.mp4',
        thumbnailUrl: creatorData.profileImage,
        duration: 180,
        tier: 'BRONZE',
      },
      {
        type: 'TEXT',
        title: 'Pro Tips for Advanced Learners 💎',
        titleAr: 'نصائح احترافية للمتعلمين المتقدمين 💎',
        content: 'Here are some advanced techniques that will take your skills to the next level. This is exclusive content for our Silver and Gold members!',
        contentAr: 'إليك بعض التقنيات المتقدمة التي ستأخذ مهاراتك إلى المستوى التالي. هذا محتوى حصري لأعضاء الفضة والذهب!',
        tier: 'SILVER',
      },
      {
        type: 'IMAGE',
        title: 'Resource Cheat Sheet 📝',
        titleAr: 'ورقة الغش للموارد 📝',
        content: 'Download this comprehensive cheat sheet that covers all the essentials!',
        contentAr: 'قم بتنزيل ورقة الغش الشاملة هذه التي تغطي جميع الأساسيات!',
        mediaUrl: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400',
        tier: 'BRONZE',
      },
      {
        type: 'ANNOUNCEMENT',
        title: 'Live Session This Weekend! 🔴',
        titleAr: 'جلسة مباشرة نهاية هذا الأسبوع! 🔴',
        content: 'Join me this Saturday at 3 PM for a live Q&A session. Gold members get exclusive access!',
        contentAr: 'انضم إلي يوم السبت الساعة 3 مساءً لجلسة أسئلة وأجوبة مباشرة. أعضاء الذهب يحصلون على وصول حصري!',
        tier: 'GOLD',
      },
      {
        type: 'VIDEO',
        title: 'Behind The Scenes 🎬',
        titleAr: 'خلف الكواليس 🎬',
        content: 'Ever wondered how I create my content? Here\'s a behind-the-scenes look!',
        contentAr: 'هل تساءلت يوماً كيف أنشئ محتواي؟ إليك نظرة خلف الكواليس!',
        mediaUrl: '/videos/demo/course-promo.mp4',
        thumbnailUrl: creatorData.profileImage,
        duration: 240,
        tier: 'SILVER',
      },
      {
        type: 'TEXT',
        title: 'Weekly Challenge Time! 💪',
        titleAr: 'وقت التحدي الأسبوعي! 💪',
        content: 'This week\'s challenge: Create a project using what you learned. Share your results in the comments!',
        contentAr: 'تحدي هذا الأسبوع: أنشئ مشروعاً باستخدام ما تعلمته. شارك نتائجك في التعليقات!',
        tier: 'BRONZE',
      },
    ];

    for (let i = 0; i < postTemplates.length; i++) {
      const template = postTemplates[i];
      const daysAgo = postTemplates.length - i;
      const publishedAt = new Date();
      publishedAt.setDate(publishedAt.getDate() - daysAgo);

      await prisma.channelPost.create({
        data: {
          channelId: channel.id,
          type: template.type,
          title: template.title,
          titleAr: template.titleAr,
          content: template.content,
          contentAr: template.contentAr,
          mediaUrl: template.mediaUrl,
          thumbnailUrl: template.thumbnailUrl,
          duration: template.duration,
          tier: template.tier,
          isPinned: template.isPinned || false,
          publishedAt,
          viewCount: Math.floor(Math.random() * 500) + 50,
        },
      });
    }

    console.log(`  ✓ Created ${postTemplates.length} posts`);

    // Create some live sessions
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    await prisma.liveSession.create({
      data: {
        channelId: channel.id,
        title: 'Live Q&A Session',
        titleAr: 'جلسة أسئلة وأجوبة مباشرة',
        description: 'Join me for a live Q&A where I answer all your questions!',
        descriptionAr: 'انضم إلي لجلسة أسئلة وأجوبة مباشرة حيث أجيب على جميع أسئلتك!',
        scheduledAt: tomorrow,
        duration: 60,
        tier: 'SILVER',
        status: 'SCHEDULED',
      },
    });

    await prisma.liveSession.create({
      data: {
        channelId: channel.id,
        title: 'Masterclass: Advanced Techniques',
        titleAr: 'درس متقدم: تقنيات متقدمة',
        description: 'Deep dive into advanced concepts with hands-on examples.',
        descriptionAr: 'غوص عميق في المفاهيم المتقدمة مع أمثلة عملية.',
        scheduledAt: nextWeek,
        duration: 120,
        tier: 'GOLD',
        status: 'SCHEDULED',
      },
    });

    console.log(`  ✓ Created live sessions`);
    console.log(`✅ Completed creator: ${creatorData.name}\n`);
  }

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
