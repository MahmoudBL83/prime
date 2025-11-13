import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedBadges() {
  console.log('🎖️  Seeding badge definitions...')

  const badges = [
    // LEARNING Category
    {
      code: 'FIRST_LESSON',
      title: 'First Steps',
      titleAr: 'الخطوات الأولى',
      description: 'Complete your first lesson',
      descriptionAr: 'أكمل درسك الأول',
      icon: '📚',
      color: '#10B981',
      rarity: 'COMMON',
      category: 'LEARNING',
      xpReward: 10,
      requirements: JSON.stringify({ type: 'LESSON_COMPLETED', count: 1 }),
      isActive: true
    },
    {
      code: 'LESSON_STREAK_7',
      title: 'Week Warrior',
      titleAr: 'محارب الأسبوع',
      description: 'Complete lessons for 7 days in a row',
      descriptionAr: 'أكمل الدروس لمدة 7 أيام متتالية',
      icon: '🔥',
      color: '#F59E0B',
      rarity: 'UNCOMMON',
      category: 'STREAK',
      xpReward: 50,
      requirements: JSON.stringify({ type: 'DAILY_STREAK', count: 7 }),
      isActive: true
    },
    {
      code: 'FIRST_COURSE',
      title: 'Course Completer',
      titleAr: 'مكمل الدورة',
      description: 'Complete your first course',
      descriptionAr: 'أكمل دورتك الأولى',
      icon: '🎓',
      color: '#8B5CF6',
      rarity: 'RARE',
      category: 'ACHIEVEMENT',
      xpReward: 100,
      requirements: JSON.stringify({ type: 'COURSE_COMPLETED', count: 1 }),
      isActive: true
    },
    {
      code: 'QUIZ_MASTER',
      title: 'Quiz Master',
      titleAr: 'خبير الاختبارات',
      description: 'Score 100% on 5 quizzes',
      descriptionAr: 'احصل على 100٪ في 5 اختبارات',
      icon: '🏆',
      color: '#EF4444',
      rarity: 'EPIC',
      category: 'MASTERY',
      xpReward: 200,
      requirements: JSON.stringify({ type: 'PERFECT_QUIZ', count: 5 }),
      isActive: true
    },
    {
      code: 'CERTIFICATE_COLLECTOR',
      title: 'Certificate Collector',
      titleAr: 'جامع الشهادات',
      description: 'Earn 3 certificates',
      descriptionAr: 'احصل على 3 شهادات',
      icon: '📜',
      color: '#8B5CF6',
      rarity: 'EPIC',
      category: 'ACHIEVEMENT',
      xpReward: 150,
      requirements: JSON.stringify({ type: 'CERTIFICATE_EARNED', count: 3 }),
      isActive: true
    },
    {
      code: 'COMMUNITY_HERO',
      title: 'Community Hero',
      titleAr: 'بطل المجتمع',
      description: 'Help others with 10 helpful reviews',
      descriptionAr: 'ساعد الآخرين بـ 10 مراجعات مفيدة',
      icon: '🤝',
      color: '#3B82F6',
      rarity: 'RARE',
      category: 'SOCIAL',
      xpReward: 75,
      requirements: JSON.stringify({ type: 'HELPFUL_REVIEW', count: 10 }),
      isActive: true
    },
    {
      code: 'LEGENDARY_LEARNER',
      title: 'Legendary Learner',
      titleAr: 'المتعلم الأسطوري',
      description: 'Reach level 10 and earn 5 certificates',
      descriptionAr: 'الوصول إلى المستوى 10 والحصول على 5 شهادات',
      icon: '⭐',
      color: '#FBBF24',
      rarity: 'LEGENDARY',
      category: 'SPECIAL',
      xpReward: 500,
      requirements: JSON.stringify({ type: 'LEVEL_AND_CERTIFICATES', level: 10, certificates: 5 }),
      isActive: true
    },
    {
      code: 'EARLY_BIRD',
      title: 'Early Bird',
      titleAr: 'الطائر المبكر',
      description: 'Log in for 30 consecutive days',
      descriptionAr: 'سجل الدخول لمدة 30 يومًا متتاليًا',
      icon: '🌅',
      color: '#F59E0B',
      rarity: 'LEGENDARY',
      category: 'STREAK',
      xpReward: 300,
      requirements: JSON.stringify({ type: 'DAILY_STREAK', count: 30 }),
      isActive: true
    }
  ]

  for (const badge of badges) {
    await prisma.badgeDefinition.upsert({
      where: { code: badge.code },
      update: badge,
      create: badge
    })
    console.log(`  ✅ ${badge.icon} ${badge.title} (${badge.rarity})`)
  }

  console.log(`\n✨ Seeded ${badges.length} badge definitions!`)
}

seedBadges()
  .catch((e) => {
    console.error('Error seeding badges:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
