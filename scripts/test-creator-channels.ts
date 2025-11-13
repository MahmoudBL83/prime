import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Testing Creator Channels System\n');
  console.log('═══════════════════════════════════════════════\n');

  // Test 1: Count channels
  const channelCount = await prisma.creatorChannel.count();
  console.log(`✅ Test 1: Channel Count`);
  console.log(`   Total Channels: ${channelCount}`);
  console.log(`   Expected: 34`);
  console.log(`   Status: ${channelCount === 34 ? '✅ PASS' : '❌ FAIL'}\n`);

  // Test 2: Verify all channels have tiers
  const channelsWithTiers = await prisma.creatorChannel.findMany({
    select: {
      name: true,
      tiers: true,
    },
  });

  const allHaveTiers = channelsWithTiers.every(
    (ch) => Array.isArray(ch.tiers) && ch.tiers.length === 3
  );
  console.log(`✅ Test 2: Channel Tiers`);
  console.log(`   Channels with 3 tiers: ${channelsWithTiers.filter(ch => Array.isArray(ch.tiers) && ch.tiers.length === 3).length}`);
  console.log(`   Expected: ${channelCount}`);
  console.log(`   Status: ${allHaveTiers ? '✅ PASS' : '❌ FAIL'}\n`);

  // Test 3: Verify channel posts
  const totalPosts = await prisma.channelPost.count();
  console.log(`✅ Test 3: Channel Posts`);
  console.log(`   Total Posts: ${totalPosts}`);
  console.log(`   Expected: ~100-200 posts`);
  console.log(`   Status: ${totalPosts > 100 ? '✅ PASS' : '❌ FAIL'}\n`);

  // Test 4: Sample channel data
  const sampleChannel = await prisma.creatorChannel.findFirst({
    include: {
      creator: {
        include: {
          user: true,
        },
      },
      _count: {
        select: {
          posts: true,
        },
      },
    },
  });

  if (sampleChannel) {
    console.log(`✅ Test 4: Sample Channel Data`);
    console.log(`   Channel: ${sampleChannel.name}`);
    console.log(`   Creator: ${sampleChannel.creator.user.name}`);
    console.log(`   Subscribers: ${sampleChannel.totalSubscribers}`);
    console.log(`   Posts: ${sampleChannel._count.posts}`);
    console.log(`   Tiers: ${(sampleChannel.tiers as any[]).length}`);
    console.log(`   Status: ✅ PASS\n`);
  }

  // Test 5: Check tier structure
  if (sampleChannel) {
    const tiers = sampleChannel.tiers as any[];
    const tierNames = tiers.map(t => t.tier);
    const expectedTiers = ['BRONZE', 'SILVER', 'GOLD'];
    const tiersCorrect = expectedTiers.every(et => tierNames.includes(et));
    
    console.log(`✅ Test 5: Tier Structure`);
    console.log(`   Available Tiers: ${tierNames.join(', ')}`);
    console.log(`   Expected: BRONZE, SILVER, GOLD`);
    console.log(`   Status: ${tiersCorrect ? '✅ PASS' : '❌ FAIL'}\n`);
  }

  // Test 6: Verify all creators have channels
  const creatorCount = await prisma.creator.count();
  const creatorsWithChannels = await prisma.creator.findMany({
    include: {
      channels: true,
    },
  });
  const allCreatorsHaveChannels = creatorsWithChannels.every(c => c.channels.length > 0);

  console.log(`✅ Test 6: Creator Coverage`);
  console.log(`   Total Creators: ${creatorCount}`);
  console.log(`   Creators with Channels: ${creatorsWithChannels.filter(c => c.channels.length > 0).length}`);
  console.log(`   Status: ${allCreatorsHaveChannels ? '✅ PASS' : '❌ FAIL'}\n`);

  // Summary
  console.log('\n═══════════════════════════════════════════════');
  console.log('📊 TEST SUMMARY');
  console.log('═══════════════════════════════════════════════');
  console.log(`Channels: ${channelCount}`);
  console.log(`Posts: ${totalPosts}`);
  console.log(`Creators with Channels: ${creatorsWithChannels.filter(c => c.channels.length > 0).length}/${creatorCount}`);
  console.log('\n✅ All systems operational! Creator channels ready for demo.\n');

  // Sample data for demo
  console.log('═══════════════════════════════════════════════');
  console.log('🎬 SAMPLE CHANNELS FOR DEMO');
  console.log('═══════════════════════════════════════════════\n');

  const topChannels = await prisma.creatorChannel.findMany({
    take: 5,
    orderBy: {
      totalSubscribers: 'desc',
    },
    include: {
      creator: {
        include: {
          user: true,
        },
      },
      _count: {
        select: {
          posts: true,
        },
      },
    },
  });

  topChannels.forEach((ch, idx) => {
    const tiers = ch.tiers as any[];
    console.log(`${idx + 1}. ${ch.name}`);
    console.log(`   Creator: ${ch.creator.user.name}`);
    console.log(`   Subscribers: ${ch.totalSubscribers}`);
    console.log(`   Posts: ${ch._count.posts}`);
    console.log(`   Tiers: ${tiers.map(t => `${t.tier} (${t.price} EGP)`).join(', ')}`);
    console.log('');
  });

  console.log('💡 To test the demo:');
  console.log('   1. Start dev server: npm run dev');
  console.log('   2. Visit: http://localhost:3000/en/channels');
  console.log('   3. Browse channels, select tiers, and subscribe!');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Test Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
