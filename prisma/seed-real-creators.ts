import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Euro to EGP conversion rate (approximate)
const EURO_TO_EGP = 53.5

async function main() {
    console.log('🌱 Seeding real creators and mentors...')
    console.log('🗑️ First, removing old mock creators...')

    // Delete old mock creators by their emails
    const mockEmails = [
        'sarah.creator@edtech.com',
        'mohamed.creator@edtech.com',
        'laila.creator@edtech.com',
        'omar.creator@edtech.com',
        'noor.creator@edtech.com',
        'ahmed.creator@edtech.com',
        'fatima.creator@edtech.com',
        'karim.creator@edtech.com',
    ]

    for (const email of mockEmails) {
        try {
            const user = await prisma.user.findUnique({
                where: { email },
                include: { creator: true }
            })
            if (user) {
                // Delete related records first
                if (user.creator) {
                    await prisma.creatorAnalytics.deleteMany({ where: { creatorId: user.creator.id } })
                    await prisma.creatorEarnings.deleteMany({ where: { creatorId: user.creator.id } })
                    await prisma.course.deleteMany({ where: { creatorId: user.creator.id } })
                    await prisma.creator.delete({ where: { id: user.creator.id } })
                }
                await prisma.user.delete({ where: { id: user.id } })
                console.log(`✓ Deleted mock creator: ${email}`)
            }
        } catch (error) {
            console.log(`⚠️ Could not delete ${email}:`, error)
        }
    }

    console.log('\n📝 Creating real creators and mentors...\n')

    // Real creators data based on provided information
    const creatorsData = [
        // === MENTORS (10) ===
        {
            email: 'asmaa.mokhtar@prime.edu',
            name: 'Asmaa Mohamed Mokhtar',
            arabicName: 'أسماء محمد مختار',
            role: 'CREATOR', // Mentor role
            type: 'Mentor',
            bio: 'Freelancing Expert & Career Coach 🎯 Helping you master the art of freelancing and build a successful independent career. Join me for exclusive tips, strategies, and 1-on-1 mentorship sessions!',
            expertise: 'Freelance, Career Development, Business Strategy',
            language: 'English',
            priceEuro: 10,
            linkedIn: 'https://linkedin.com/in/asmaamokhtar',
            portfolioUrl: null,
            totalSubscribers: 245,
            isOnline: true,
        },
        {
            email: 'sofia.safwat@prime.edu',
            name: 'Sofia Safwat',
            arabicName: 'صوفيا صفوت',
            role: 'CREATOR',
            type: 'Mentor',
            bio: 'Premium Freelancing Mentor 💼 Transform your skills into a thriving freelance business. Expert guidance on client acquisition, pricing, and scaling your services.',
            expertise: 'Freelance, Business Development, Client Management',
            language: 'English',
            priceEuro: 14.99,
            linkedIn: 'https://linkedin.com/in/sofiasafwat',
            portfolioUrl: null,
            totalSubscribers: 189,
            isOnline: true,
        },
        {
            email: 'youssef.yasser@prime.edu',
            name: 'Youssef Yasser',
            arabicName: 'يوسف ياسر',
            role: 'CREATOR',
            type: 'Mentor',
            bio: 'German Language Specialist 🇩🇪 Native-level German instruction for all levels. From A1 to C2, I\'ll guide you through your German language journey with proven methods.',
            expertise: 'German Language, Language Teaching, TestDaF Preparation',
            language: 'German',
            priceEuro: 10,
            linkedIn: 'https://linkedin.com/in/youssefyasser',
            portfolioUrl: null,
            totalSubscribers: 312,
            isOnline: false,
        },
        {
            email: 'khaleel.mahdi@prime.edu',
            name: 'Khaleel Mahdi',
            arabicName: 'خليل مهدي',
            role: 'CREATOR',
            type: 'Mentor',
            bio: 'Flutter Developer & AI Enthusiast 📱🤖 Building cross-platform mobile apps and exploring AI integration. Learn cutting-edge development techniques with me!',
            expertise: 'Flutter, Mobile Development, AI, Dart',
            language: 'English',
            priceEuro: 12,
            linkedIn: 'https://linkedin.com/in/khaleelmahdi',
            portfolioUrl: null,
            totalSubscribers: 278,
            isOnline: true,
        },
        {
            email: 'mohamed.radwan@prime.edu',
            name: 'Mohamed Radwan',
            arabicName: 'محمد رضوان',
            role: 'CREATOR',
            type: 'Mentor',
            bio: 'Coding & AI Expert 💻🧠 Full-stack development meets artificial intelligence. Join me for deep dives into modern programming and AI applications.',
            expertise: 'Coding, AI, Machine Learning, Full-Stack Development',
            language: 'English',
            priceEuro: 10,
            linkedIn: 'https://linkedin.com/in/mohamedradwan',
            portfolioUrl: null,
            totalSubscribers: 421,
            isOnline: true,
        },
        {
            email: 'andrew.magdy@prime.edu',
            name: 'Andrew Magdy',
            arabicName: 'أندرو مجدي',
            role: 'CREATOR',
            type: 'Mentor',
            bio: 'German Language Trainer 🇩🇪 Comprehensive German courses from beginner to advanced. Specialized in Goethe certificate preparation and conversational German.',
            expertise: 'German Language, Goethe Preparation, Conversational German',
            language: 'German',
            priceEuro: 10,
            linkedIn: 'https://linkedin.com/in/andrewmagdy',
            portfolioUrl: null,
            totalSubscribers: 198,
            isOnline: false,
        },
        {
            email: 'mohammed.yasser@prime.edu',
            name: 'Mohammed Yasser',
            arabicName: 'محمد ياسر',
            role: 'CREATOR',
            type: 'Mentor',
            bio: 'Coding & AI Specialist 🚀 From Python basics to advanced AI models. I make complex concepts simple and help you build real-world projects.',
            expertise: 'Coding, AI, Python, Data Science',
            language: 'English',
            priceEuro: 10,
            linkedIn: 'https://linkedin.com/in/mohammedyasser',
            portfolioUrl: null,
            totalSubscribers: 356,
            isOnline: true,
        },
        {
            email: 'mohamed.amin@prime.edu',
            name: 'Mohamed Amin',
            arabicName: 'محمد أمين',
            role: 'CREATOR',
            type: 'Mentor',
            bio: 'German Language Expert 🇩🇪 Intensive German courses with focus on practical communication. Perfect for students planning to study or work in Germany.',
            expertise: 'German Language, Study Abroad Preparation, German Culture',
            language: 'German',
            priceEuro: 10,
            linkedIn: 'https://linkedin.com/in/mohamedamin',
            portfolioUrl: null,
            totalSubscribers: 167,
            isOnline: false,
        },
        {
            email: 'beshoy.khairy@prime.edu',
            name: 'Beshoy Khairy',
            arabicName: 'بيشوي خيري',
            role: 'CREATOR',
            type: 'Mentor',
            bio: 'Premium German Tutor 🇩🇪⭐ Advanced German instruction with personalized learning paths. Specialized in professional German and business communication.',
            expertise: 'German Language, Business German, Professional Communication',
            language: 'German',
            priceEuro: 14.99,
            linkedIn: 'https://linkedin.com/in/beshoykhairy',
            portfolioUrl: null,
            totalSubscribers: 234,
            isOnline: true,
        },
        {
            email: 'omar.rady@prime.edu',
            name: 'Omar Rady',
            arabicName: 'عمر راضي',
            role: 'CREATOR',
            type: 'Mentor',
            bio: 'German Language Coach 🇩🇪 Interactive German lessons that make learning enjoyable. Focus on speaking confidence and practical vocabulary.',
            expertise: 'German Language, Speaking Practice, Grammar',
            language: 'German',
            priceEuro: 10,
            linkedIn: 'https://linkedin.com/in/omarrady',
            portfolioUrl: null,
            totalSubscribers: 203,
            isOnline: false,
        },

        // === CREATORS (3) ===
        {
            email: 'zaid.tamer@prime.edu',
            name: 'Zaid Tamer',
            arabicName: 'زيد تامر',
            role: 'CREATOR',
            type: 'Creator',
            bio: 'Freelance & Online Business Expert 💰 Master the digital economy! Learn how to build profitable online businesses and sustainable freelance careers.',
            expertise: 'Freelance, Online Business, Digital Entrepreneurship',
            language: 'English',
            priceEuro: 10,
            linkedIn: 'https://linkedin.com/in/zaidtamer',
            portfolioUrl: null,
            totalSubscribers: 445,
            isOnline: true,
        },
        {
            email: 'mohamed.tarek@prime.edu',
            name: 'Mohamed Tarek Abdelkader',
            arabicName: 'محمد طارق عبدالقادر',
            role: 'CREATOR',
            type: 'Creator',
            bio: 'Freelancing Success Coach 🎓 Transform your passion into profits. Comprehensive guides on finding clients, negotiating rates, and building your brand.',
            expertise: 'Freelance, Personal Branding, Client Acquisition',
            language: 'English',
            priceEuro: 10,
            linkedIn: 'https://linkedin.com/in/mohamedtarekabdelkader',
            portfolioUrl: null,
            totalSubscribers: 287,
            isOnline: false,
        },
        {
            email: 'ahmed.radwan@prime.edu',
            name: 'Ahmed Radwan',
            arabicName: 'أحمد رضوان',
            role: 'CREATOR',
            type: 'Creator',
            bio: 'Bilingual Freelance Expert 🌍 Freelancing strategies for Arabic and German markets. Learn to expand your reach across different cultures and languages.',
            expertise: 'Freelance, International Business, Arabic & German Markets',
            language: 'English & German',
            priceEuro: 12,
            linkedIn: 'https://linkedin.com/in/ahmedradwan',
            portfolioUrl: null,
            totalSubscribers: 334,
            isOnline: true,
        },

        // === BOTH (Mentor & Creator) (2) ===
        {
            email: 'ibrahim.azab@prime.edu',
            name: 'Ibrahim Azab',
            arabicName: 'إبراهيم عزب',
            role: 'CREATOR',
            type: 'Both',
            bio: 'Web Developer & AI Innovator 🌐🤖 Special Offer: 8€ (was 10€)! Full-stack web development meets AI. Build modern web apps with intelligent features.',
            expertise: 'Web Development, AI, Full-Stack, JavaScript, React',
            language: 'English',
            priceEuro: 8, // Special discounted price
            originalPriceEuro: 10, // Original price before discount
            linkedIn: 'https://linkedin.com/in/ibrahimazab',
            portfolioUrl: null,
            totalSubscribers: 512,
            isOnline: true,
        },
        {
            email: 'aiman.sheikh@prime.edu',
            name: 'Aiman Sheikh',
            arabicName: 'أيمن شيخ',
            role: 'CREATOR',
            type: 'Both',
            bio: 'Coding, AI & German Integration Specialist 💻🇩🇪 Unique combination of tech skills and German language expertise. Perfect for tech professionals targeting the German market.',
            expertise: 'Coding, AI, German Language, Tech Career in Germany',
            language: 'English',
            priceEuro: 10,
            linkedIn: 'https://linkedin.com/in/aimansheikh',
            portfolioUrl: null,
            totalSubscribers: 389,
            isOnline: true,
        },
    ]

    const hashedPassword = await bcrypt.hash('Creator@Prime2024!', 10)

    for (const creatorData of creatorsData) {
        try {
            // Check if user already exists
            const existingUser = await prisma.user.findUnique({
                where: { email: creatorData.email },
            })

            if (existingUser) {
                console.log(`⚠️ User ${creatorData.name} already exists, skipping...`)
                continue
            }

            // Convert price from Euro to EGP for storage
            const priceInEGP = Math.round(creatorData.priceEuro * EURO_TO_EGP)

            // Create user
            const user = await prisma.user.create({
                data: {
                    email: creatorData.email,
                    name: creatorData.name,
                    arabicName: creatorData.arabicName,
                    passwordHash: hashedPassword,
                    role: creatorData.role as any,
                    bio: creatorData.bio,
                    profileImage: `/images/avatars/${creatorData.name.toLowerCase().replace(/\s+/g, '-')}.jpg`,
                    emailVerified: new Date(),
                    onboardingCompleted: true,
                },
            })

            // Create creator profile with single ALL_ACCESS tier pricing
            const creator = await prisma.creator.create({
                data: {
                    userId: user.id,
                    expertise: creatorData.expertise,
                    languages: creatorData.language,
                    kycStatus: 'VERIFIED',
                    // Single ALL_ACCESS tier - using basicMonthlyPrice as the main price
                    basicMonthlyPrice: priceInEGP,
                    premiumMonthlyPrice: priceInEGP, // Same price for simplicity
                    vipMonthlyPrice: priceInEGP, // Same price for simplicity
                    totalSubscribers: creatorData.totalSubscribers,
                    totalEarnings: creatorData.totalSubscribers * priceInEGP * 0.85, // Platform takes 15%
                    contractSigned: true,
                    contractSignedAt: new Date(),
                    availableForMeetings: true,
                    socialLinks: JSON.stringify({
                        linkedin: creatorData.linkedIn,
                        portfolio: creatorData.portfolioUrl,
                    }),
                    subscriptionBenefits: JSON.stringify({
                        allAccess: [
                            'Full access to all posts & content',
                            'Community membership',
                            'Direct messaging',
                            'Weekly Q&A sessions',
                            '2 x 1-on-1 sessions per month',
                            'Premium study materials',
                            'Live workshops & webinars',
                            'Certificate of completion',
                        ],
                    }),
                },
            })

            // Create a course for each creator - determine category based on expertise
            const expertiseToCategory: Record<string, string> = {
                'Freelance': 'Business',
                'German Language': 'Language',
                'Flutter': 'Programming',
                'Coding': 'Programming',
                'AI': 'Technology',
                'Web Development': 'Programming',
                'Mobile Development': 'Programming',
            }
            const mainExpertise = creatorData.expertise.split(',')[0].trim()
            const category = expertiseToCategory[mainExpertise] || 'General'
            
            await prisma.course.create({
                data: {
                    title: `${mainExpertise} Masterclass`,
                    titleAr: `دورة ${creatorData.arabicName?.split(' ')[0] || ''} الشاملة`,
                    description: `Comprehensive course in ${mainExpertise} by ${creatorData.name}. Learn from an expert with proven track record.`,
                    descriptionAr: `دورة شاملة مع محتوى مميز وتمارين عملية`,
                    creatorId: creator.id,
                    category: category,
                    rating: 4.5 + Math.random() * 0.5,
                    totalEnrollments: Math.floor(creatorData.totalSubscribers * 0.6),
                    level: 'INTERMEDIATE',
                    language: creatorData.language === 'German' ? 'DE' : 'EN',
                    price: 0, // Free course for subscribers
                    thumbnail: `/images/courses/${mainExpertise.toLowerCase().replace(/\s+/g, '-')}.jpg`,
                    contentType: 'SERIES',
                },
            })

            // Create creator analytics
            await prisma.creatorAnalytics.create({
                data: {
                    creatorId: creator.id,
                    totalViews: creatorData.totalSubscribers * 50 + Math.floor(Math.random() * 10000),
                    totalLikes: creatorData.totalSubscribers * 5 + Math.floor(Math.random() * 1000),
                    totalComments: creatorData.totalSubscribers * 2 + Math.floor(Math.random() * 200),
                    totalShares: Math.floor(creatorData.totalSubscribers * 0.3) + Math.floor(Math.random() * 100),
                    averageWatchTime: Math.floor(Math.random() * 300) + 180, // 3-8 minutes average
                    totalWatchTime: creatorData.totalSubscribers * 1000 + Math.floor(Math.random() * 50000),
                },
            })

            // Create monthly earnings record
            const monthlyEarnings = creatorData.totalSubscribers * priceInEGP * 0.85
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

            const typeEmoji = creatorData.type === 'Mentor' ? '🎓' : creatorData.type === 'Creator' ? '📱' : '🌟'
            console.log(`✅ Created ${creatorData.type}: ${creatorData.name} ${typeEmoji} (${creatorData.priceEuro}€ → ${priceInEGP} EGP)`)
        } catch (error) {
            console.error(`❌ Error creating ${creatorData.name}:`, error)
        }
    }

    console.log('\n🎉 Real creators seeding completed!')
    console.log(`📊 Total: 10 Mentors + 3 Creators + 2 Both = 15 profiles`)
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
