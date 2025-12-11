/**
 * Seed Real Mentors
 *
 * This script creates real mentor accounts using their actual email addresses
 * from the CSV file with a default password.
 *
 * Usage:
 * npx tsx scripts/seed-real-mentors.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function seedRealMentors() {
  console.log('🌱 Starting real mentors seeding...')

  try {
    // Real mentor data from CSV
    const mentors = [
      {
        name: 'Asmaa Mohamed Mokhtar',
        email: 'mokhtarasmaa817@gmail.com',
        category: 'Freelance',
        price: 10,
        language: 'English'
      },
      {
        name: 'Sofia Safwat',
        email: 'sofiasafwat12@gmail.com',
        category: 'Freelance',
        price: 14.99,
        language: 'English'
      },
      {
        name: 'Youssef Yasser',
        email: 'yosefyasser589@gmail.com',
        category: 'German Language',
        price: 10,
        language: 'German'
      },
      {
        name: 'Khaleel Mahdi',
        email: 'khaleelmhdi@gmail.com',
        category: 'Flutter (Coding & AI)',
        price: 0,
        language: 'English'
      },
      {
        name: 'Mohamed Radwan',
        email: 'mohax.radwan@gmail.com',
        category: 'Coding & AI',
        price: 0,
        language: 'English'
      },
      {
        name: 'Andrew Magdy',
        email: 'andrewmagdy010610@gmail.com',
        category: 'German Language',
        price: 10,
        language: 'German'
      },
      {
        name: 'Mohammed Yasser',
        email: 'mohdyasser100@gmail.com',
        category: 'Coding & AI',
        price: 10,
        language: 'English'
      },
      {
        name: 'Mohamed Amin',
        email: 'mohamedaminamin74@gmail.com',
        category: 'German Language',
        price: 10,
        language: 'German'
      },
      {
        name: 'Beshoy Khairy',
        email: 'beshoykhairy99@gmail.com',
        category: 'German Language',
        price: 14.99,
        language: 'German'
      },
      {
        name: 'Omar Rady',
        email: 'omarrady474@gmail.com',
        category: 'German Language',
        price: 0,
        language: 'German'
      },
      {
        name: 'Zaid tamer',
        email: 'ziadtamer756@gmail.com',
        category: 'Freelance Online business',
        price: 0,
        language: 'English'
      },
      {
        name: 'Mohamed Tarek Abdelkader',
        email: 'muhammed.tarekk50@gmail.com',
        category: 'Freelance',
        price: 0,
        language: 'English'
      },
      {
        name: 'Ahmed Radwan',
        email: 'ahmedradoun@gmail.com',
        category: 'Freelance',
        price: 0,
        language: 'English & German'
      },
      {
        name: 'Ibrahim Azab',
        email: 'hima.azab.eg@gmail.com',
        category: 'Web Development & AI',
        price: 8,
        language: 'English'
      },
      {
        name: 'Aiman Sheikh',
        email: 'aimansheikh09@gmail.com',
        category: 'Coding & AI German Integration',
        price: 0,
        language: 'English'
      }
    ]

    console.log(`📄 Processing ${mentors.length} mentors`)

    for (const mentor of mentors) {
      console.log(`\n👤 Processing: ${mentor.name} (${mentor.email})`)

      // Check if user already exists
      let user = await prisma.user.findUnique({
        where: { email: mentor.email }
      })

      if (!user) {
        // Hash the password
        const hashedPassword = await bcrypt.hash('Test1234!', 10)

        user = await prisma.user.create({
          data: {
            name: mentor.name,
            email: mentor.email,
            passwordHash: hashedPassword,
            bio: `${mentor.category} expert. Teaches in ${mentor.language}.`,
            role: 'CREATOR',
            profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${mentor.name.replace(/\s+/g, '')}`,
            onboardingCompleted: true
          }
        })
        console.log(`✅ Created user: ${user.name}`)
      } else {
        console.log(`ℹ️  User already exists: ${user.name}`)
      }

      // Check if creator already exists
      let creator = await prisma.creator.findUnique({
        where: { userId: user.id }
      })

      if (!creator) {
        creator = await prisma.creator.create({
          data: {
            userId: user.id,
            kycStatus: 'VERIFIED',
            expertise: mentor.category,
            basicMonthlyPrice: mentor.price || 10,
            premiumMonthlyPrice: (mentor.price || 10) * 2,
            vipMonthlyPrice: (mentor.price || 10) * 4,
            totalSubscribers: Math.floor(Math.random() * 1000) + 100,
            totalEarnings: Math.floor(Math.random() * 10000) + 1000,
            availableForMeetings: true,
            subscriptionBenefits: {
              basic: [`Access to ${mentor.category} content`, 'Monthly Q&A sessions', 'Community access'],
              premium: [`Advanced ${mentor.category} tutorials`, 'Weekly Q&A sessions', 'Priority support', '1-on-1 monthly call'],
              vip: [`Expert ${mentor.category} mentorship`, 'Daily support', 'Unlimited 1-on-1 calls', 'Exclusive content']
            }
          }
        })
        console.log(`✅ Created creator: ${mentor.name} (${mentor.category})`)
      } else {
        console.log(`ℹ️  Creator already exists: ${mentor.name}`)
      }

      // Create channel if it doesn't exist
      const existingChannel = await prisma.creatorChannel.findFirst({
        where: { creatorId: creator.id }
      })

      if (!existingChannel) {
        const channel = await prisma.creatorChannel.create({
          data: {
            creatorId: creator.id,
            name: `${mentor.name}'s Channel`,
            nameAr: mentor.name,
            description: `${mentor.category} tutorials and mentorship`,
            descriptionAr: mentor.category,
            tiers: JSON.stringify(['BRONZE', 'SILVER', 'GOLD'])
          }
        })
        console.log(`✅ Created channel: ${channel.name}`)
      }
    }

    console.log('\n🎉 Seeding completed successfully!')
    console.log('\n📋 Login Credentials:')
    console.log('All mentors can login with their email and password: Test1234!')

  } catch (error) {
    console.error('❌ Error during seeding:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedRealMentors()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Seeding failed:', error)
    process.exit(1)
  })