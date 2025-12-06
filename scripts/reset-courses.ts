import { PrismaClient, KYCStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedCourse {
  id: string;
  title: string;
  titleAr?: string;
  titleDe?: string;
  category: string;
  rating?: number;
  year?: number;
  durationLabel?: string;
  description?: string;
  descriptionAr?: string;
  descriptionDe?: string;
  thumbnail?: string;
}

const courses: SeedCourse[] = [
  { id: 'lost-bus-german-survival', title: 'German Language Collection 1', category: 'German Language', rating: 4.8, year: 2024, durationLabel: '6 months', thumbnail: '/images/courses/German Language Posters/WhatsApp Image 2025-11-23 at 22.43.43_7cec6116.jpg' },
  { id: 'severance-german-advanced', title: 'German Language Collection 2', category: 'German Language', rating: 4.9, year: 2024, durationLabel: '6 months', thumbnail: '/images/courses/German Language Posters/WhatsApp Image 2025-11-23 at 23.38.13_cf3432e6.jpg' },
  { id: 'german-b2-course', title: 'German Language Collection 3', category: 'German Language', rating: 4.8, year: 2024, durationLabel: '7 months', thumbnail: '/images/courses/German Language Posters/WhatsApp Image 2025-11-25 at 14.30.27_09d6241b.jpg' },
  { id: 'german-c1-advanced', title: 'German Language Collection 4', category: 'German Language', rating: 4.8, year: 2024, durationLabel: '8 months', thumbnail: '/images/courses/German Language Posters/WhatsApp Image 2025-11-25 at 14.32.11_b498b0d9.jpg' },
  { id: 'german-a1-beginner', title: 'German Language Collection 5', category: 'German Language', rating: 4.7, year: 2024, durationLabel: '4 months', thumbnail: '/images/courses/German Language Posters/WhatsApp Image 2025-11-25 at 14.32.16_9169e54d.jpg' },
  { id: 'german-conversation', title: 'German Language Collection 6', category: 'German Language', rating: 4.6, year: 2024, durationLabel: '3 months', thumbnail: '/images/courses/German Language Posters/WhatsApp Image 2025-11-25 at 14.32.16_917477a7.jpg' },
  { id: 'german-grammar-mastery', title: 'German Language Collection 7', category: 'German Language', rating: 4.9, year: 2024, durationLabel: '5 months', thumbnail: '/images/courses/German Language Posters/WhatsApp Image 2025-11-25 at 14.32.17_825387de.jpg' },
  { id: 'german-business', title: 'German Language Collection 8', category: 'German Language', rating: 4.8, year: 2024, durationLabel: '6 months', thumbnail: '/images/courses/German Language Posters/WhatsApp Image 2025-11-25 at 14.32.17_ae8d6ae8.jpg' },
  { id: 'pluribus-drama-relationships', title: 'Freelance & Side Hustle Collection 1', category: 'Freelance & Side Hustle', rating: 4.5, year: 2024, durationLabel: '4 months', thumbnail: '/images/courses/Freelance & Side Hustle Posters/between.png' },
  { id: 'foundation-freelance-mastery', title: 'Freelance & Side Hustle Collection 2', category: 'Freelance & Side Hustle', rating: 4.7, year: 2024, durationLabel: '8 months', thumbnail: '/images/courses/Freelance & Side Hustle Posters/driving deliveries in berlin.png' },
  { id: 'freelance-success', title: 'Freelance & Side Hustle Collection 3', category: 'Freelance & Side Hustle', rating: 4.6, year: 2024, durationLabel: '3 months', thumbnail: '/images/courses/Freelance & Side Hustle Posters/E-Commerce Day One.png' },
  { id: 'content-creation-mastery', title: 'Freelance & Side Hustle Collection 4', category: 'Freelance & Side Hustle', rating: 4.5, year: 2024, durationLabel: '4 months', thumbnail: '/images/courses/Freelance & Side Hustle Posters/SKILL INTO INCOME.png' },
  { id: 'digital-marketing-blueprint', title: 'Freelance & Side Hustle Collection 5', category: 'Freelance & Side Hustle', rating: 4.7, year: 2024, durationLabel: '5 months', thumbnail: '/images/courses/Freelance & Side Hustle Posters/WhatsApp Image 2025-11-25 at 14.32.12_063b614c.jpg' },
  { id: 'freelance-graphic-design', title: 'Freelance & Side Hustle Collection 6', category: 'Freelance & Side Hustle', rating: 4.6, year: 2024, durationLabel: '4 months', thumbnail: '/images/courses/Freelance & Side Hustle Posters/WhatsApp Image 2025-11-25 at 14.32.12_2ac19e78.jpg' },
  { id: 'freelance-writing', title: 'Freelance & Side Hustle Collection 7', category: 'Freelance & Side Hustle', rating: 4.8, year: 2024, durationLabel: '3 months', thumbnail: '/images/courses/Freelance & Side Hustle Posters/WhatsApp Image 2025-11-25 at 14.32.15_58aad836.jpg' },
  { id: 'high-potential-entrepreneur', title: 'Entrepreneurship Collection 1', category: 'Entrepreneurship', rating: 4.6, year: 2024, durationLabel: '5 months', thumbnail: '/images/courses/Entrepreneurship Posters/first launch.png' },
  { id: 'invasion-startup-growth', title: 'Entrepreneurship Collection 2', category: 'Entrepreneurship', rating: 4.5, year: 2024, durationLabel: '5 months', thumbnail: '/images/courses/Entrepreneurship Posters/investor room 101.png' },
  { id: 'startup-funding', title: 'Entrepreneurship Collection 3', category: 'Entrepreneurship', rating: 4.7, year: 2024, durationLabel: '6 months', thumbnail: '/images/courses/Entrepreneurship Posters/WhatsApp Image 2025-11-25 at 14.32.14_9bb85000.jpg' },
  { id: 'business-growth-strategies', title: 'Entrepreneurship Collection 4', category: 'Entrepreneurship', rating: 4.7, year: 2024, durationLabel: '5 months', thumbnail: '/images/courses/Entrepreneurship Posters/WhatsApp Image 2025-11-25 at 14.32.15_34d01093.jpg' },
  { id: 'scaling-your-startup', title: 'Entrepreneurship Collection 5', category: 'Entrepreneurship', rating: 4.8, year: 2024, durationLabel: '6 months', thumbnail: '/images/courses/Entrepreneurship Posters/WhatsApp Image 2025-11-25 at 15.04.46_5f562939.jpg' },
  { id: 'morning-show-trading', title: 'Trading Collection 1', category: 'Trading', rating: 4.7, year: 2024, durationLabel: '6 months', thumbnail: '/images/courses/Trading Posters/WhatsApp Image 2025-11-25 at 14.32.12_063b614c.jpg' },
  { id: 'master-trader-pro', title: 'Trading Collection 2', category: 'Trading', rating: 4.8, year: 2024, durationLabel: '4 months', thumbnail: '/images/courses/Trading Posters/WhatsApp Image 2025-11-25 at 14.32.14_770af3af.jpg' },
  { id: 'ted-lasso-coding-ai', title: 'Coding & AI Collection 1', category: 'Coding & AI', rating: 4.9, year: 2024, durationLabel: '3 months', thumbnail: '/images/courses/Coding & AI Posters/WhatsApp Image 2025-11-25 at 14.32.11_07d95353.jpg' },
  { id: 'ai-revolution-machine-learning', title: 'Coding & AI Collection 2', category: 'Coding & AI', rating: 4.9, year: 2024, durationLabel: '7 months', thumbnail: '/images/courses/Coding & AI Posters/WhatsApp Image 2025-11-25 at 14.32.13_c74bbc50.jpg' },
  { id: 'python-mastery', title: 'Coding & AI Collection 3', category: 'Coding & AI', rating: 4.8, year: 2024, durationLabel: '4 months', thumbnail: '/images/courses/Coding & AI Posters/WhatsApp Image 2025-11-25 at 15.04.46_5f562939.jpg' },
  { id: 'slow-horses-german-integration', title: 'German Integration Collection 1', category: 'German Integration', rating: 4.8, year: 2024, durationLabel: '5 months', thumbnail: '/images/courses/German Integration Posters/WhatsApp Image 2025-11-25 at 14.32.13_973f42cd.jpg' },
  { id: 'german-life-culture', title: 'German Integration Collection 2', category: 'German Integration', rating: 4.7, year: 2024, durationLabel: '5 months', thumbnail: '/images/courses/German Integration Posters/WhatsApp Image 2025-11-25 at 14.32.13_d9d3d1dd.jpg' },
  { id: 'german-citizenship-prep', title: 'German Integration Collection 3', category: 'German Integration', rating: 4.8, year: 2024, durationLabel: '6 months', thumbnail: '/images/courses/German Integration Posters/WhatsApp Image 2025-11-25 at 14.32.14_39554e98.jpg' },
  { id: 'german-work-culture', title: 'German Integration Collection 4', category: 'German Integration', rating: 4.6, year: 2024, durationLabel: '4 months', thumbnail: '/images/courses/German Integration Posters/WhatsApp Image 2025-11-25 at 14.32.15_48365969.jpg' },
  { id: 'living-in-germany', title: 'German Integration Collection 5', category: 'German Integration', rating: 4.7, year: 2024, durationLabel: '3 months', thumbnail: '/images/courses/German Integration Posters/WhatsApp Image 2025-11-25 at 14.32.16_fdffce41.jpg' },
  { id: 'german-social-system', title: 'German Integration Collection 6', category: 'German Integration', rating: 4.9, year: 2024, durationLabel: '4 months', thumbnail: '/images/courses/German Integration Posters/WhatsApp Image 2025-11-25 at 14.32.17_91121bd7.jpg' },
];

function toMinutes(label?: string) {
  if (!label) return 180;
  const num = parseInt(label.replace(/[^0-9]/g, ''), 10);
  if (!num || Number.isNaN(num)) return 180;
  return num * 60; // treat the numeric part as hours-equivalent
}

async function main() {
  console.log('Resetting courses to match UI list...');

  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!adminUser) {
    throw new Error('No ADMIN user found. Cannot assign seeded courses.');
  }

  let creator = await prisma.creator.findFirst({ where: { userId: adminUser.id } });
  if (!creator) {
    creator = await prisma.creator.create({
      data: {
        userId: adminUser.id,
        kycStatus: KYCStatus.VERIFIED,
        expertise: 'Admin Seed',
        contractSigned: true,
      },
    });
  }

  // Hard reset courses and all dependent tables
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Course" CASCADE');

  const syllabus = [
    {
      moduleTitle: 'Overview',
      moduleTitleAr: 'نظرة عامة',
      lessons: [
        { title: 'Introduction', titleAr: 'مقدمة', duration: 10, description: 'Overview lesson' },
      ],
    },
  ];

  await prisma.course.createMany({
    data: courses.map((c) => ({
      id: c.id,
      title: c.title,
      titleAr: c.titleAr,
      titleDe: c.titleDe,
      description: c.description || c.title,
      descriptionAr: c.descriptionAr || c.titleAr || c.title,
      descriptionDe: c.descriptionDe || c.titleDe || c.title,
      category: c.category,
      skillLevel: 'BEGINNER',
      language: 'en',
      price: 0,
      duration: toMinutes(c.durationLabel),
      type: 'LEARNING',
      syllabus,
      thumbnail: c.thumbnail,
      creatorId: creator.id,
      status: 'PUBLISHED',
      totalEnrollments: 0,
      totalViews: 0,
      rating: c.rating ?? 4.7,
      publishedAt: new Date(),
    })),
    skipDuplicates: true,
  });

  console.log(`Seeded ${courses.length} courses.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
