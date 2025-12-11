import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Euro to EGP conversion rate
const EURO_TO_EGP = 52.5;

async function main() {
  console.log('🔧 Updating creators with EXACT data from CSV sheet...\n');

  // Exact data from the CSV sheet
  const creatorsData = [
    {
      email: 'asmaa.mokhtar@prime.edu',
      name: 'Asmaa Mohamed Mokhtar',
      category: 'Freelance',
      phone: '1140482240',
      linkedIn: 'https://linkedin.com/in/asmaa-mokhtar-6730911a9',
      contactEmail: 'mokhtarasmaa817@gmail.com',
      portfolio: 'https://asmaamokhtar.my.canva.site/',
      language: 'English',
      priceEuro: 10,
    },
    {
      email: 'sofia.safwat@prime.edu',
      name: 'Sofia Safwat',
      category: 'Freelance',
      phone: '1211911871',
      contactEmail: 'sofiasafwat12@gmail.com',
      portfolio: 'https://drive.google.com/file/d/1x6bAVYysvcPMXtlnYpKlpbar9ej8V_Rx/view?usp=drivesdk',
      language: 'English',
      priceEuro: 14.99,
    },
    {
      email: 'youssef.yasser@prime.edu',
      name: 'Youssef Yasser',
      category: 'German Language',
      phone: '1021870612',
      contactEmail: 'yosefyasser589@gmail.com',
      linkedIn: 'https://linkedin.com/in/youssefyasser24',
      portfolio: 'https://drive.google.com/file/d/1hY1VTk7a6XwaqXKC_Spu0-6VXsvrGfxy/view?usp=drive_link',
      language: 'German',
      priceEuro: 10,
    },
    {
      email: 'khaleel.mahdi@prime.edu',
      name: 'Khaleel Mahdi',
      category: 'Flutter (Coding & AI)',
      phone: '1060741899',
      contactEmail: 'khaleelmhdi@gmail.com',
      linkedIn: 'https://linkedin.com/in/khaleel-mahdi',
      portfolio: 'https://khlilmhdi-2c480.web.app/',
      language: 'English',
      priceEuro: null, // No price in sheet
    },
    {
      email: 'mohamed.radwan@prime.edu',
      name: 'Mohamed Radwan',
      category: 'Coding & AI',
      phone: '1022070639',
      contactEmail: 'mohamed2004radwan@gmail.com',
      linkedIn: 'https://linkedin.com/in/mohamed-radwan-288a89283',
      portfolio: 'https://drive.google.com/file/d/1g08iqQCfbCpyVxDxPqnpzfE6bVkJm3C8/view?usp=drive_link',
      language: 'English',
      priceEuro: null, // No price in sheet
    },
    {
      email: 'andrew.magdy@prime.edu',
      name: 'Andrew Magdy',
      category: 'German Language',
      phone: '1552528519',
      contactEmail: 'andrewmagdy010610@gmail.com',
      linkedIn: 'https://linkedin.com/in/andrew-magdy-9a4752266',
      portfolio: 'https://drive.google.com/file/d/16RHyxb3Z6hqrADO9E2dDhTsjQho55vMW/view?usp=sharing',
      language: 'German',
      priceEuro: 10,
    },
    {
      email: 'mohammed.yasser@prime.edu',
      name: 'Mohammed Yasser',
      category: 'Coding & AI',
      phone: '1228498155',
      contactEmail: 'mohdyasser100@gmail.com',
      linkedIn: 'https://linkedin.com/in/mohd-yasser',
      portfolio: 'https://drive.google.com/file/d/1ILbuVeJq7b74ZcH1I-1KAHamJ9pSscGN/view?usp=sharing',
      language: 'English',
      priceEuro: 10,
    },
    {
      email: 'mohamed.amin@prime.edu',
      name: 'Mohamed Amin',
      category: 'German Language',
      phone: '1147109321',
      contactEmail: 'mohamedaminamin74@gmail.com',
      linkedIn: 'https://linkedin.com/in/mohamed-amin-267091290',
      portfolio: 'https://drive.google.com/file/d/1DsdU5L_yLC7ivKDAu5-gZRhGYMTeoFXT/view?usp=sharing',
      language: 'German',
      priceEuro: 10,
    },
    {
      email: 'beshoy.khairy@prime.edu',
      name: 'Beshoy Khairy',
      category: 'German Language',
      phone: '1289275288',
      contactEmail: 'beshoykhairy99@gmail.com',
      linkedIn: 'https://linkedin.com/in/beshoy-khairy-aa703b261',
      portfolio: null, // "." in sheet means no portfolio
      language: 'German',
      priceEuro: 14.99,
    },
    {
      email: 'omar.rady@prime.edu',
      name: 'Omar Rady',
      category: 'German Language',
      phone: '1017156927',
      contactEmail: 'omarrady474@gmail.com',
      linkedIn: 'https://linkedin.com/in/omar-rady-98b01a259',
      portfolio: null, // "." in sheet means no portfolio
      language: 'German',
      priceEuro: null, // No price in sheet
    },
    {
      email: 'zaid.tamer@prime.edu',
      name: 'Zaid Tamer',
      category: 'Freelance, Online Business',
      phone: '1065342768',
      contactEmail: 'ziadtamer756@gmail.com',
      portfolio: 'https://drive.google.com/file/d/1EL38bhYMbEQkmPh-Csm3aA2zNGwMPl6n/view?usp=drivesdk',
      language: 'English',
      priceEuro: null, // Creator, no mentor price
    },
    {
      email: 'mohamed.tarek@prime.edu',
      name: 'Mohamed Tarek Abdelkader',
      category: 'Freelance',
      phone: '1149457050',
      contactEmail: 'muhammed.tarekk50@gmail.com',
      linkedIn: 'https://linkedin.com/in/mohmed-tarek',
      portfolio: 'https://drive.google.com/drive/folders/1eGGazNEMIh0cA3BbEjR8T6BEPzTIguGz',
      language: 'English',
      priceEuro: null, // Creator, no mentor price
    },
    {
      email: 'ahmed.radwan@prime.edu',
      name: 'Ahmed Radwan',
      category: 'Freelance',
      phone: '1101990371',
      contactEmail: 'ahmedradoun@gmail.com',
      linkedIn: 'https://linkedin.com/in/ahmed-radwan-337a45212',
      portfolio: 'https://docs.google.com/document/d/1GRyrSIiXB3VGBZTaQunCKCal4X85jwhn/edit?usp=sharing&ouid=102561664937979731668&rtpof=true&sd=true',
      language: 'English & German',
      priceEuro: null, // Creator, no mentor price
    },
    {
      email: 'ibrahim.azab@prime.edu',
      name: 'Ibrahim Azab',
      category: 'Web Development & AI',
      phone: '01000888395',
      contactEmail: 'hima.azab.eg@gmail.com',
      linkedIn: 'https://linkedin.com/in/ibrahim-waleed',
      portfolio: 'https://ibrahim-azab.com/',
      language: 'English',
      priceEuro: 8, // Special discount price (was 10, now 8)
    },
    {
      email: 'aiman.sheikh@prime.edu',
      name: 'Aiman Sheikh',
      category: 'Coding & AI, German Integration',
      phone: '491635198323',
      contactEmail: 'aimansheikh09@gmail.com',
      linkedIn: 'https://linkedin.com/in/aiman-sheikh-780420162',
      portfolio: null, // "." in sheet means no portfolio
      language: 'English',
      priceEuro: null, // No price in sheet
    },
  ];

  // Update each creator with exact data from sheet
  for (const data of creatorsData) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: data.email },
        include: { creator: true }
      });

      if (!user || !user.creator) {
        console.log(`⚠️ Creator not found: ${data.name} (${data.email})`);
        continue;
      }

      // Calculate price in EGP (null if no price)
      const priceEGP = data.priceEuro ? Math.round(data.priceEuro * EURO_TO_EGP) : null;

      // Build social links JSON
      const socialLinks: Record<string, string> = {};
      if (data.linkedIn) socialLinks.linkedin = data.linkedIn;
      if (data.contactEmail) socialLinks.email = data.contactEmail;
      if (data.phone) socialLinks.phone = data.phone;

      // Update user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          name: data.name,
          phone: data.phone,
        }
      });

      // Build social links JSON including portfolio
      if (data.portfolio) socialLinks.portfolio = data.portfolio;

      // Update creator with EXACT data from sheet and ZERO stats
      await prisma.creator.update({
        where: { id: user.creator.id },
        data: {
          expertise: data.category, // Exact category from sheet
          languages: data.language, // Exact language from sheet
          socialLinks: socialLinks,
          // Use basicMonthlyPrice for the subscription price
          basicMonthlyPrice: priceEGP,
          // ZERO stats - no fake data
          totalSubscribers: 0,
          totalEarnings: 0,
        }
      });

      const priceDisplay = data.priceEuro ? `${data.priceEuro}€ (${priceEGP} EGP)` : 'No price';
      console.log(`✅ ${data.name} | ${data.category} | ${priceDisplay}`);

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

  console.log('┌────────────────────────────────┬────────────────────────────────┬──────────────┬────────────┐');
  console.log('│ Name                           │ Category                       │ Language     │ Price      │');
  console.log('├────────────────────────────────┼────────────────────────────────┼──────────────┼────────────┤');
  
  for (const c of creators) {
    const name = c.user.name.padEnd(30).substring(0, 30);
    const category = (c.expertise || 'N/A').padEnd(30).substring(0, 30);
    const lang = (c.languages || 'N/A').padEnd(12).substring(0, 12);
    const price = c.basicMonthlyPrice ? `${c.basicMonthlyPrice} EGP`.padEnd(10) : 'No price  ';
    console.log(`│ ${name} │ ${category} │ ${lang} │ ${price} │`);
  }
  console.log('└────────────────────────────────┴────────────────────────────────┴──────────────┴────────────┘');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
