import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function seedTestCreators() {
  console.log('🌱 Starting creator seeding...')
  
  try {
    // Create test users and creators
    const creators = [
      {
        name: 'Ahmed Hassan',
        arabicName: 'أحمد حسن',
        email: 'ahmed.hassan@example.com',
        expertise: 'German Language & Integration',
        bio: 'Experienced German language instructor helping Egyptian students integrate into German society.',
        basicMonthlyPrice: 49,
        premiumMonthlyPrice: 99,
        vipMonthlyPrice: 199,
      },
      {
        name: 'Sara Mohamed',
        arabicName: 'سارة محمد',
        email: 'sara.mohamed@example.com',
        expertise: 'Freelancing & Digital Marketing',
        bio: 'Digital marketing expert teaching freelancers how to build successful online businesses.',
        basicMonthlyPrice: 59,
        premiumMonthlyPrice: 119,
        vipMonthlyPrice: 249,
      },
      {
        name: 'Omar Khalil',
        arabicName: 'عمر خليل',
        email: 'omar.khalil@example.com',
        expertise: 'Trading & Investment',
        bio: 'Professional trader with 10+ years of experience in forex and cryptocurrency markets.',
        basicMonthlyPrice: 79,
        premiumMonthlyPrice: 149,
        vipMonthlyPrice: 299,
      },
      {
        name: 'Layla Ibrahim',
        arabicName: 'ليلى إبراهيم',
        email: 'layla.ibrahim@example.com',
        expertise: 'Coding & AI',
        bio: 'Software engineer teaching Python, JavaScript, and AI/ML to aspiring developers.',
        basicMonthlyPrice: 69,
        premiumMonthlyPrice: 129,
        vipMonthlyPrice: 259,
      },
      {
        name: 'Youssef Ali',
        arabicName: 'يوسف علي',
        email: 'youssef.ali@example.com',
        expertise: 'Entrepreneurship & Startups',
        bio: 'Serial entrepreneur helping others launch and scale their business ideas.',
        basicMonthlyPrice: 89,
        premiumMonthlyPrice: 169,
        vipMonthlyPrice: 339,
      },
    ]
    
    for (const creatorData of creators) {
      // Check if user already exists
      let user = await prisma.user.findUnique({
        where: { email: creatorData.email }
      })
      
      if (!user) {
        // Create user
        const hashedPassword = await bcrypt.hash('Test1234!', 10)
        user = await prisma.user.create({
          data: {
            name: creatorData.name,
            arabicName: creatorData.arabicName,
            email: creatorData.email,
            passwordHash: hashedPassword,
            bio: creatorData.bio,
            role: 'CREATOR',
            profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${creatorData.name}`,
          }
        })
        console.log(`✅ Created user: ${user.name}`)
      } else {
        console.log(`ℹ️  User already exists: ${user.name}`)
      }
      
      // Check if creator already exists
      const existingCreator = await prisma.creator.findUnique({
        where: { userId: user.id }
      })
      
      if (!existingCreator) {
        // Create creator
        const creator = await prisma.creator.create({
          data: {
            userId: user.id,
            kycStatus: 'VERIFIED',
            expertise: creatorData.expertise,
            basicMonthlyPrice: creatorData.basicMonthlyPrice,
            premiumMonthlyPrice: creatorData.premiumMonthlyPrice,
            vipMonthlyPrice: creatorData.vipMonthlyPrice,
            totalSubscribers: Math.floor(Math.random() * 5000) + 500,
            totalEarnings: Math.floor(Math.random() * 50000) + 10000,
            availableForMeetings: true,
            subscriptionBenefits: {
              basic: ['Monthly Q&A sessions', 'Access to basic content', 'Community access'],
              premium: ['Weekly Q&A sessions', 'Access to all content', 'Priority support', '1-on-1 monthly call'],
              vip: ['Daily support', 'Unlimited 1-on-1 calls', 'Exclusive content', 'Personal mentorship'],
            },
          }
        })
        console.log(`✅ Created creator: ${creatorData.name} (${creatorData.expertise})`)
      } else {
        console.log(`ℹ️  Creator already exists: ${creatorData.name}`)
      }
    }
    
    console.log('\n🎉 Seeding completed successfully!')
    
  } catch (error) {
    console.error('❌ Error during seeding:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedTestCreators()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Seeding failed:', error)
    process.exit(1)
  })
