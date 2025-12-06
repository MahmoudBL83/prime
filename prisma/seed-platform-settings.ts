import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding platform settings...');

  // Create or update platform settings
  const settings = await prisma.platformSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      earlyAccessEnabled: true, // Change to false to open the platform
      maintenanceMode: false,
    },
  });

  console.log('✅ Platform settings seeded:', settings);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding platform settings:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
