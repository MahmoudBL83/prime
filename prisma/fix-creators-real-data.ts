import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Euro to EGP conversion rate
const EURO_TO_EGP = 52.5;

async function main() {
  console.log('🔧 Fixing creators with REAL data from sheet...\n');

  // First, delete all fake analytics and earnings
  console.log('🗑️ Removing fake analytics and earnings...');
  await prisma.creatorAnalytics.deleteMany({});
  await prisma.creatorEarnings.deleteMany({});
  await prisma.course.deleteMany({});
  console.log('   ✅ Deleted all fake data\n');

  // Real creator data exactly from the sheet
  const realCreators = [
    {
      email: 'asmaa.mokhtar@prime.edu',
      name: 'Asmaa Mohamed Mokhtar',
      type: 'MENTOR' as const,
      priceEuro: 10,
      category: 'Freelance',
      phone: '1140482240',
      linkedIn: 'https://linkedin.com/in/asmaa-mokhtar-6730911a9',
      contactEmail: 'mokhtarasmaa817@gmail.com',
      portfolio: 'https://asmaamokhtar.my.canva.site/',
      language: 'English',
      bio: 'Freelance Expert | Helping you build a successful freelancing career',
    },
    {
      email: 'sofia.safwat@prime.edu',
      name: 'Sofia Safwat',
      type: 'MENTOR' as const,
      priceEuro: 14.99,
      category: 'Freelance',
      phone: '1211911871',
      contactEmail: 'sofiasafwat12@gmail.com',
      portfolio: 'https://drive.google.com/file/d/1x6bAVYysvcPMXtlnYpKlpbar9ej8V_Rx/view?usp=drivesdk',
      language: 'English',
      bio: 'Freelance Mentor | Expert guidance on freelancing and client management',
    },
    {
      email: 'youssef.yasser@prime.edu',
      name: 'Youssef Yasser',
      type: 'MENTOR' as const,
      priceEuro: 10,
      category: 'German Language',
      phone: '1021870612',
      contactEmail: 'yosefyasser589@gmail.com',
      linkedIn: 'https://linkedin.com/in/youssefyasser24',
      portfolio: 'https://drive.google.com/file/d/1hY1VTk7a6XwaqXKC_Spu0-6VXsvrGfxy/view?usp=drive_link',
      language: 'German',
      bio: 'German Language Instructor | From A1 to C2 certification preparation',
    },
    {
      email: 'khaleel.mahdi@prime.edu',
      name: 'Khaleel Mahdi',
      type: 'MENTOR' as const,
      priceEuro: null, // No price specified in sheet
      category: 'Flutter (Coding & AI)',
      phone: '1060741899',
      workPhone: '+972598137134',
      contactEmail: 'khaleelmhdi@gmail.com',
      altEmail: 'khlilmhdi02@gmail.com',
      linkedIn: 'https://linkedin.com/in/khaleel-mahdi',
      portfolio: 'https://khlilmhdi-2c480.web.app/',
      language: 'English',
      bio: 'Flutter Developer & AI Enthusiast | Cross-platform mobile app development',
    },
    {
      email: 'mohamed.radwan@prime.edu',
      name: 'Mohamed Radwan',
      type: 'MENTOR' as const,
      priceEuro: null, // No price specified in sheet
      category: 'Coding & AI',
      phone: '1022070639',
      contactEmail: 'mohamed2004radwan@gmail.com',
      altEmail: 'mohax.radwan@gmail.com',
      linkedIn: 'https://linkedin.com/in/mohamed-radwan-288a89283',
      portfolio: 'https://drive.google.com/file/d/1g08iqQCfbCpyVxDxPqnpzfE6bVkJm3C8/view?usp=drive_link',
      language: 'English',
      bio: 'Coding & AI Expert | Full-stack development and AI applications',
    },
    {
      email: 'andrew.magdy@prime.edu',
      name: 'Andrew Magdy',
      type: 'MENTOR' as const,
      priceEuro: 10,
      category: 'German Language',
      phone: '1552528519',
      contactEmail: 'andrewmagdy010610@gmail.com',
      linkedIn: 'https://linkedin.com/in/andrew-magdy-9a4752266',
      portfolio: 'https://drive.google.com/file/d/16RHyxb3Z6hqrADO9E2dDhTsjQho55vMW/view?usp=sharing',
      language: 'German',
      bio: 'German Language Trainer | Comprehensive German courses for all levels',
    },
    {
      email: 'mohammed.yasser@prime.edu',
      name: 'Mohammed Yasser',
      type: 'MENTOR' as const,
      priceEuro: 10,
      category: 'Coding & AI',
      phone: '1228498155',
      contactEmail: 'mohdyasser100@gmail.com',
      linkedIn: 'https://linkedin.com/in/mohd-yasser',
      portfolio: 'https://drive.google.com/file/d/1ILbuVeJq7b74ZcH1I-1KAHamJ9pSscGN/view?usp=sharing',
      language: 'English',
      bio: 'Coding & AI Specialist | Python, data science, and real-world projects',
    },
    {
      email: 'mohamed.amin@prime.edu',
      name: 'Mohamed Amin',
      type: 'MENTOR' as const,
      priceEuro: 10,
      category: 'German Language',
      phone: '1147109321',
      contactEmail: 'mohamedaminamin74@gmail.com',
      linkedIn: 'https://linkedin.com/in/mohamed-amin-267091290',
      portfolio: 'https://drive.google.com/file/d/1DsdU5L_yLC7ivKDAu5-gZRhGYMTeoFXT/view?usp=sharing',
      language: 'German',
      bio: 'German Language Expert | Study abroad preparation and German culture',
    },
    {
      email: 'beshoy.khairy@prime.edu',
      name: 'Beshoy Khairy',
      type: 'MENTOR' as const,
      priceEuro: 14.99,
      category: 'German Language',
      phone: '1289275288',
      contactEmail: 'beshoykhairy99@gmail.com',
      linkedIn: 'https://linkedin.com/in/beshoy-khairy-aa703b261',
      portfolio: null,
      language: 'German',
      bio: 'German Language Tutor | Professional German and business communication',
    },
    {
      email: 'omar.rady@prime.edu',
      name: 'Omar Rady',
      type: 'MENTOR' as const,
      priceEuro: null, // No price specified in sheet
      category: 'German Language',
      phone: '1017156927',
      contactEmail: 'omarrady474@gmail.com',
      linkedIn: 'https://linkedin.com/in/omar-rady-98b01a259',
      portfolio: null,
      language: 'German',
      bio: 'German Language Coach | Speaking practice and practical vocabulary',
    },
    {
      email: 'zaid.tamer@prime.edu',
      name: 'Zaid Tamer',
      type: 'CREATOR' as const,
      priceEuro: null,
      category: 'Freelance, Online Business',
      phone: '1065342768',
      contactEmail: 'ziadtamer756@gmail.com',
      portfolio: 'https://drive.google.com/file/d/1EL38bhYMbEQkmPh-Csm3aA2zNGwMPl6n/view?usp=drivesdk',
      language: 'English',
      bio: 'Freelance & Online Business Creator | Building successful online ventures',
    },
    {
      email: 'mohamed.tarek@prime.edu',
      name: 'Mohamed Tarek Abdelkader',
      type: 'CREATOR' as const,
      priceEuro: null,
      category: 'Freelance',
      phone: '1149457050',
      contactEmail: 'muhammed.tarekk50@gmail.com',
      linkedIn: 'https://linkedin.com/in/mohmed-tarek',
      portfolio: 'https://drive.google.com/drive/folders/1eGGazNEMIh0cA3BbEjR8T6BEPzTIguGz',
      language: 'English',
      bio: 'Freelance Creator | Sharing knowledge and strategies for freelancers',
    },
    {
      email: 'ahmed.radwan@prime.edu',
      name: 'Ahmed Radwan',
      type: 'CREATOR' as const,
      priceEuro: null,
      category: 'Freelance',
      phone: '1101990371',
      altPhone: '1013267233',
      contactEmail: 'ahmedradoun@gmail.com',
      workEmail: 'ahmed.radwan@lamaregypt.com',
      linkedIn: 'https://linkedin.com/in/ahmed-radwan-337a45212',
      portfolio: 'https://docs.google.com/document/d/1GRyrSIiXB3VGBZTaQunCKCal4X85jwhn/edit?usp=sharing&ouid=102561664937979731668&rtpof=true&sd=true',
      language: 'English & German',
      bio: 'Freelance Creator | Bilingual content in English and German',
    },
    {
      email: 'ibrahim.azab@prime.edu',
      name: 'Ibrahim Azab',
      type: 'BOTH' as const, // Both Creator and Mentor
      priceEuro: 8,
      category: 'Web Development & AI',
      phone: '01000888395',
      contactEmail: 'hima.azab.eg@gmail.com',
      linkedIn: 'https://linkedin.com/in/ibrahim-waleed',
      portfolio: 'https://ibrahim-azab.com/',
      language: 'English',
      bio: 'Web Developer & AI Expert | Full-stack development and AI integration',
    },
    {
      email: 'aiman.sheikh@prime.edu',
      name: 'Aiman Sheikh',
      type: 'BOTH' as const, // Both Creator and Mentor
      priceEuro: null, // No price specified
      category: 'Coding & AI, German Integration',
      phone: '491635198323',
      contactEmail: 'aimansheikh09@gmail.com',
      linkedIn: 'https://linkedin.com/in/aiman-sheikh-780420162',
      portfolio: null,
      language: 'English',
      bio: 'Coding, AI & German Integration Expert | Technical skills with language',
    },
  ];

  // Update each creator with real data
  for (const data of realCreators) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: data.email },
        include: { creator: true }
      });

      if (!user || !user.creator) {
        console.log(`⚠️ Creator not found: ${data.name} (${data.email})`);
        continue;
      }

      // Update user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          name: data.name,
          phone: data.phone,
          bio: data.bio,
        }
      });

      // Calculate price in EGP (null if no price)
      const priceEGP = data.priceEuro ? Math.round(data.priceEuro * EURO_TO_EGP) : null;

      // Update creator with real data and ZERO stats
      await prisma.creator.update({
        where: { id: user.creator.id },
        data: {
          type: data.type,
          expertise: data.category,
          portfolioUrl: data.portfolio,
          linkedIn: data.linkedIn || null,
          languages: data.language,
          allAccessPrice: priceEGP,
          // Reset all stats to zero
          totalSubscribers: 0,
          totalEarnings: 0,
          monthlyEarnings: 0,
        }
      });

      console.log(`✅ Updated ${data.name} - ${data.category} (${data.type})`);

    } catch (error: any) {
      console.log(`❌ Failed to update ${data.name}: ${error.message}`);
    }
  }

  // Verify final state
  console.log('\n📊 Final state:');
  const creators = await prisma.creator.findMany({
    include: { user: { select: { name: true, email: true, phone: true } } },
    orderBy: { user: { name: 'asc' } }
  });

  for (const c of creators) {
    console.log(`   ${c.type} | ${c.user.name} | ${c.expertise} | ${c.allAccessPrice ? c.allAccessPrice + ' EGP' : 'No price'}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
