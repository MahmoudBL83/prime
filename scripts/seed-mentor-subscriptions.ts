import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting mentor subscription pricing setup...\n');

  // Get all creators (mentors)
  const creators = await prisma.creator.findMany({
    include: {
      user: {
        select: {
          name: true,
          arabicName: true,
        },
      },
    },
  });

  console.log(`📊 Found ${creators.length} creators to update\n`);

  // Define pricing tiers based on creator stats
  const pricingTiers = [
    {
      // Premium mentors (high subscriber count or experience)
      condition: (creator: any) => 
        (creator.totalSubscribers > 100 || creator.totalEarnings > 10000),
      pricing: {
        basicMonthlyPrice: 149,
        basicYearlyPrice: 1490,
        premiumMonthlyPrice: 299,
        premiumYearlyPrice: 2990,
        vipMonthlyPrice: 699,
        vipYearlyPrice: 6990,
      },
      tier: 'Premium',
    },
    {
      // Mid-tier mentors
      condition: (creator: any) => 
        (creator.totalSubscribers > 50 || creator.totalEarnings > 5000),
      pricing: {
        basicMonthlyPrice: 99,
        basicYearlyPrice: 990,
        premiumMonthlyPrice: 199,
        premiumYearlyPrice: 1990,
        vipMonthlyPrice: 499,
        vipYearlyPrice: 4990,
      },
      tier: 'Mid-tier',
    },
    {
      // Standard mentors
      condition: (creator: any) => true,
      pricing: {
        basicMonthlyPrice: 79,
        basicYearlyPrice: 790,
        premiumMonthlyPrice: 149,
        premiumYearlyPrice: 1490,
        vipMonthlyPrice: 349,
        vipYearlyPrice: 3490,
      },
      tier: 'Standard',
    },
  ];

  // Default subscription benefits
  const subscriptionBenefits = {
    BASIC: {
      monthlyMessages: 10,
      monthlyMeetings: 1,
      meetingDuration: 30,
      accessToContent: true,
      prioritySupport: false,
      features: [
        'Access to all courses',
        '10 direct messages per month',
        '1 video meeting per month (30 min)',
        'Community forum access',
      ],
    },
    PREMIUM: {
      monthlyMessages: 50,
      monthlyMeetings: 4,
      meetingDuration: 60,
      accessToContent: true,
      prioritySupport: true,
      features: [
        'Everything in Basic',
        '50 direct messages per month',
        '4 video meetings per month (60 min each)',
        'Priority support',
        'Exclusive workshop access',
        'Course materials download',
      ],
    },
    VIP: {
      monthlyMessages: null, // Unlimited
      monthlyMeetings: null, // Unlimited
      meetingDuration: 90,
      accessToContent: true,
      prioritySupport: true,
      features: [
        'Everything in Premium',
        'Unlimited direct messages',
        'Unlimited video meetings (90 min each)',
        '24/7 priority support',
        'Personal learning roadmap',
        '1-on-1 career mentorship',
        'Exclusive VIP events',
        'Early access to new courses',
      ],
    },
  };

  let updatedCount = 0;
  let skippedCount = 0;

  for (const creator of creators) {
    // Check if already has subscription pricing
    if (creator.basicMonthlyPrice) {
      console.log(`⏭️  Skipping ${creator.user.name} - already has subscription pricing`);
      skippedCount++;
      continue;
    }

    // Determine pricing tier
    let pricing = pricingTiers[2].pricing; // Default to standard
    let tierName = 'Standard';

    for (const tier of pricingTiers) {
      if (tier.condition(creator)) {
        pricing = tier.pricing;
        tierName = tier.tier;
        break;
      }
    }

    try {
      await prisma.creator.update({
        where: { id: creator.id },
        data: {
          ...pricing,
          subscriptionBenefits: subscriptionBenefits,
        },
      });

      console.log(`✅ Updated ${creator.user.name} (${tierName} tier):`);
      console.log(`   Basic: ${pricing.basicMonthlyPrice} EGP/mo | ${pricing.basicYearlyPrice} EGP/yr`);
      console.log(`   Premium: ${pricing.premiumMonthlyPrice} EGP/mo | ${pricing.premiumYearlyPrice} EGP/yr`);
      console.log(`   VIP: ${pricing.vipMonthlyPrice} EGP/mo | ${pricing.vipYearlyPrice} EGP/yr\n`);
      
      updatedCount++;
    } catch (error) {
      console.error(`❌ Error updating ${creator.user.name}:`, error);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`✅ Updated: ${updatedCount} creators`);
  console.log(`⏭️  Skipped: ${skippedCount} creators (already configured)`);
  console.log(`📝 Total: ${creators.length} creators\n`);

  console.log('🎉 Mentor subscription pricing setup complete!');
  console.log('\n💡 Default Benefits per Tier:');
  console.log('   BASIC: 10 messages/mo, 1 meeting/mo (30 min)');
  console.log('   PREMIUM: 50 messages/mo, 4 meetings/mo (60 min), Priority Support');
  console.log('   VIP: Unlimited messages, Unlimited meetings (90 min), 24/7 Support\n');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
