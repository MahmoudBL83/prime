import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding creators...')

    // Create mock creators with OnlyFans-style profiles
    const creatorsData = [
        {
            email: 'sarah.creator@edtech.com',
            name: 'Dr. Sarah Ahmed',
            arabicName: 'د. سارة أحمد',
            role: 'CREATOR',
            bio: 'Mathematics PhD & Educational Content Creator 🎓 Making math fun and accessible! Subscribe for exclusive lessons, behind-the-scenes content, and 1-on-1 sessions.',
            expertise: 'Mathematics, Calculus, Statistics',
            profileImage: '/images/avatars/sarah.jpg',
            basicMonthlyPrice: 49,
            premiumMonthlyPrice: 99,
            vipMonthlyPrice: 199,
            totalSubscribers: 1240,
            isOnline: true,
        },
        {
            email: 'mohamed.creator@edtech.com',
            name: 'Mohamed Ali',
            arabicName: 'محمد علي',
            role: 'CREATOR',
            bio: 'Physics Professor & Science Communicator 🔬 Explore the universe with me! Premium content includes lab experiments, Q&A sessions, and study materials.',
            expertise: 'Physics, Quantum Mechanics, Astronomy',
            profileImage: '/images/avatars/mohamed.jpg',
            basicMonthlyPrice: 49,
            premiumMonthlyPrice: 99,
            vipMonthlyPrice: 199,
            totalSubscribers: 980,
            isOnline: false,
        },
        {
            email: 'laila.creator@edtech.com',
            name: 'Laila Hassan',
            arabicName: 'ليلى حسن',
            role: 'CREATOR',
            bio: 'English Language Expert 📚 IELTS Trainer & Content Creator. Join for daily lessons, speaking practice, and exclusive exam prep materials!',
            expertise: 'English Language, IELTS, Communication',
            profileImage: '/images/avatars/laila.jpg',
            basicMonthlyPrice: 39,
            premiumMonthlyPrice: 79,
            vipMonthlyPrice: 149,
            totalSubscribers: 2100,
            isOnline: true,
        },
        {
            email: 'omar.creator@edtech.com',
            name: 'Omar Khaled',
            arabicName: 'عمر خالد',
            role: 'CREATOR',
            bio: 'Computer Science & Programming Tutor 💻 Learn coding the right way! Get access to premium tutorials, live coding sessions, and career guidance.',
            expertise: 'Programming, Python, Web Development',
            profileImage: '/images/avatars/omar.jpg',
            basicMonthlyPrice: 59,
            premiumMonthlyPrice: 119,
            vipMonthlyPrice: 229,
            totalSubscribers: 1580,
            isOnline: true,
        },
        {
            email: 'noor.creator@edtech.com',
            name: 'Noor Ibrahim',
            arabicName: 'نور إبراهيم',
            role: 'CREATOR',
            bio: 'Chemistry Teacher & Lab Enthusiast ⚗️ Subscribe for engaging chemistry lessons, lab experiments, and exam preparation content!',
            expertise: 'Chemistry, Organic Chemistry, Lab Techniques',
            profileImage: '/images/avatars/noor.jpg',
            basicMonthlyPrice: 49,
            premiumMonthlyPrice: 99,
            vipMonthlyPrice: 189,
            totalSubscribers: 850,
            isOnline: false,
        },
        {
            email: 'ahmed.creator@edtech.com',
            name: 'Ahmed Youssef',
            arabicName: 'أحمد يوسف',
            role: 'CREATOR',
            bio: 'History & Social Studies Educator 📜 Explore history through engaging content! Premium members get exclusive documentaries and study guides.',
            expertise: 'History, Geography, Social Studies',
            profileImage: '/images/avatars/ahmed.jpg',
            basicMonthlyPrice: 39,
            premiumMonthlyPrice: 79,
            vipMonthlyPrice: 149,
            totalSubscribers: 620,
            isOnline: false,
        },
        {
            email: 'fatima.creator@edtech.com',
            name: 'Fatima Said',
            arabicName: 'فاطمة سعيد',
            role: 'CREATOR',
            bio: 'Biology & Life Sciences Expert 🧬 Discover the wonders of life! Subscribe for premium content, virtual lab tours, and exclusive study materials.',
            expertise: 'Biology, Genetics, Microbiology',
            profileImage: '/images/avatars/fatima.jpg',
            basicMonthlyPrice: 49,
            premiumMonthlyPrice: 99,
            vipMonthlyPrice: 199,
            totalSubscribers: 1120,
            isOnline: true,
        },
        {
            email: 'karim.creator@edtech.com',
            name: 'Karim Hassan',
            arabicName: 'كريم حسن',
            role: 'CREATOR',
            bio: 'Arabic Language & Literature Teacher 📖 Master Arabic with me! Get exclusive content, pronunciation guides, and cultural insights.',
            expertise: 'Arabic Language, Literature, Grammar',
            profileImage: '/images/avatars/karim.jpg',
            basicMonthlyPrice: 39,
            premiumMonthlyPrice: 79,
            vipMonthlyPrice: 149,
            totalSubscribers: 890,
            isOnline: true,
        },
    ]

    const hashedPassword = await bcrypt.hash('Password123!', 10)

    for (const creatorData of creatorsData) {
        try {
            // Check if user already exists
            const existingUser = await prisma.user.findUnique({
                where: { email: creatorData.email },
            })

            if (existingUser) {
                console.log(`✓ User ${creatorData.name} already exists, skipping...`)
                continue
            }

            // Create user
            const user = await prisma.user.create({
                data: {
                    email: creatorData.email,
                    name: creatorData.name,
                    arabicName: creatorData.arabicName,
                    passwordHash: hashedPassword,
                    role: creatorData.role as any,
                    bio: creatorData.bio,
                    profileImage: creatorData.profileImage,
                    emailVerified: new Date(),
                    onboardingCompleted: true,
                },
            })

            // Create creator profile
            const creator = await prisma.creator.create({
                data: {
                    userId: user.id,
                    expertise: creatorData.expertise,
                    kycStatus: 'VERIFIED',
                    basicMonthlyPrice: creatorData.basicMonthlyPrice,
                    premiumMonthlyPrice: creatorData.premiumMonthlyPrice,
                    vipMonthlyPrice: creatorData.vipMonthlyPrice,
                    totalSubscribers: creatorData.totalSubscribers,
                    totalEarnings: creatorData.totalSubscribers * creatorData.basicMonthlyPrice * 0.7, // Average earnings
                    contractSigned: true,
                    contractSignedAt: new Date(),
                    availableForMeetings: true,
                    socialLinks: JSON.stringify({
                        twitter: `@${creatorData.name.toLowerCase().replace(/\s+/g, '')}`,
                        instagram: `@${creatorData.name.toLowerCase().replace(/\s+/g, '')}`,
                        linkedin: `${creatorData.name.toLowerCase().replace(/\s+/g, '')}`,
                    }),
                    subscriptionBenefits: JSON.stringify({
                        basic: [
                            'All posts & updates',
                            'Community access',
                            'Monthly Q&A sessions',
                            'Study materials',
                        ],
                        premium: [
                            'Everything in Basic',
                            '2 x 1-on-1 sessions/month',
                            'Priority responses',
                            'Exclusive study guides',
                            'Live workshops',
                        ],
                        vip: [
                            'Everything in Premium',
                            'Unlimited messaging',
                            'Weekly private sessions',
                            'Personal study plan',
                            'Exam preparation',
                            'Certificate of completion',
                        ],
                    }),
                },
            })

            // Create some mock courses for each creator
            await prisma.course.create({
                data: {
                    title: `${creatorData.expertise.split(',')[0]} Mastery Course`,
                    titleAr: `دورة إتقان ${creatorData.arabicName?.split(' ')[1] || ''}`,
                    description: `Complete course in ${creatorData.expertise.split(',')[0]} with premium content and exercises.`,
                    descriptionAr: `دورة كاملة مع محتوى مميز وتمارين`,
                    creatorId: creator.id,
                    rating: 4.5 + Math.random() * 0.5,
                    totalEnrollments: Math.floor(Math.random() * 500) + 100,
                    level: 'INTERMEDIATE',
                    language: 'EN',
                    price: 0, // Free course
                    thumbnail: `/images/courses/course-${Math.floor(Math.random() * 7) + 1}.jpg`,
                    contentType: 'SERIES',
                },
            })

            // Create creator analytics
            await prisma.creatorAnalytics.create({
                data: {
                    creatorId: creator.id,
                    totalViews: Math.floor(Math.random() * 50000) + 10000,
                    totalLikes: Math.floor(Math.random() * 5000) + 1000,
                    totalComments: Math.floor(Math.random() * 1000) + 200,
                    totalShares: Math.floor(Math.random() * 500) + 100,
                    averageWatchTime: Math.floor(Math.random() * 300) + 120, // seconds
                    totalWatchTime: Math.floor(Math.random() * 100000) + 20000, // seconds
                },
            })

            // Create some mock earnings
            const monthlyEarnings = creatorData.totalSubscribers * creatorData.basicMonthlyPrice * 0.6
            await prisma.creatorEarnings.create({
                data: {
                    creatorId: creator.id,
                    amount: monthlyEarnings,
                    source: 'SUBSCRIPTIONS',
                    status: 'COMPLETED',
                    month: new Date().getMonth() + 1,
                    year: new Date().getFullYear(),
                },
            })

            console.log(`✓ Created creator: ${creatorData.name}`)
        } catch (error) {
            console.error(`✗ Error creating ${creatorData.name}:`, error)
        }
    }

    console.log('✅ Seeding completed!')
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
