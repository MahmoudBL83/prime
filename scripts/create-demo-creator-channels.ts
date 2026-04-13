import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Creating demo creator channels...\n');

  // Get all creators
  const creators = await prisma.creator.findMany({
    include: {
      user: true,
    },
  });

  console.log(`Found ${creators.length} creators\n`);

  if (creators.length === 0) {
    console.log('❌ No creators found. Please create creators first.');
    return;
  }

  // Define channel tiers for different creators
  const channelTiers = [
    {
      tier: 'BRONZE',
      price: 49,
      benefits: [
        'Early access to new content',
        'Monthly Q&A sessions',
        'Exclusive community access',
      ],
    },
    {
      tier: 'SILVER',
      price: 79,
      benefits: [
        'All Bronze benefits',
        'Weekly live sessions',
        'Course discounts (10%)',
        'Priority support',
      ],
    },
    {
      tier: 'GOLD',
      price: 149,
      benefits: [
        'All Silver benefits',
        '1-on-1 monthly consultation',
        'Course discounts (25%)',
        'Exclusive resources & templates',
        'Certificate of completion',
      ],
    },
  ];

  // Create channels for each creator
  for (const creator of creators) {
    console.log(`\n📺 Creating channel for: ${creator.user.name}`);

    const channel = await prisma.creatorChannel.create({
      data: {
        creatorId: creator.id,
        name: `${creator.user.name}'s Channel`,
        nameAr: `قناة ${creator.user.arabicName || creator.user.name}`,
        description: `Join ${creator.user.name}'s exclusive channel for premium content, live sessions, and direct mentorship. Get access to insider knowledge, practical tips, and personalized guidance on your learning journey.`,
        descriptionAr: `انضم إلى القناة الحصرية لـ ${creator.user.arabicName || creator.user.name} للحصول على محتوى مميز وجلسات مباشرة وإرشاد مباشر. احصل على معرفة حصرية ونصائح عملية وتوجيه شخصي في رحلتك التعليمية.`,
        coverImage: creator.user.profileImage || '/images/default-channel-cover.jpg',
        tiers: channelTiers,
        totalSubscribers: Math.floor(Math.random() * 500) + 50, // Random 50-550 subscribers
      },
    });

    console.log(`  ✅ Channel created: ${channel.name}`);
    console.log(`  📊 Subscribers: ${channel.totalSubscribers}`);

    // Create some demo posts for each channel
    const postCount = Math.floor(Math.random() * 5) + 3; // 3-7 posts per channel
    
    for (let i = 0; i < postCount; i++) {
      const post = await prisma.channelPost.create({
        data: {
          channelId: channel.id,
          content: `Welcome to my channel! Post #${i + 1}. I'm excited to share exclusive content and insights with you. Stay tuned for more updates!`,
          contentAr: `مرحباً بكم في قناتي! المنشور #${i + 1}. أنا متحمس لمشاركة المحتوى والرؤى الحصرية معكم. ترقبوا المزيد من التحديثات!`,
          type: i % 3 === 0 ? 'IMAGE' : 'TEXT',
          mediaUrl: i % 3 === 0 ? '/images/demo-post-image.jpg' : null,
          createdAt: new Date(Date.now() - (postCount - i) * 24 * 60 * 60 * 1000), // Spread posts over days
        },
      });
      
      console.log(`  📝 Created post #${i + 1}`);
    }
  }

  // Summary
  console.log('\n\n📊 SUMMARY');
  console.log('═══════════════════════════════════════════════');
  
  const allChannels = await prisma.creatorChannel.findMany({
    include: {
      creator: {
        include: {
          user: true,
        },
      },
      _count: {
        select: {
          posts: true,
          subscriptions: true,
        },
      },
    },
  });

  allChannels.forEach((channel, index) => {
    console.log(`\n${index + 1}. ${channel.name}`);
    console.log(`   Creator: ${channel.creator.user.name}`);
    console.log(`   Subscribers: ${channel.totalSubscribers}`);
    console.log(`   Posts: ${channel._count.posts}`);
    console.log(`   Tiers: ${(channel.tiers as any[]).length}`);
  });

  console.log('\n\n✅ Demo creator channels created successfully!');
  console.log('\n💡 You can now:');
  console.log('   - Subscribe to Category C with a channelId and tier');
  console.log('   - View channels in the mentors/creators page');
  console.log('   - Test channel-specific subscriptions');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
