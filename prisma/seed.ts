import { PrismaClient, UserRole, KYCStatus, ContentStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const DEMO_PASSWORD = 'Demo1234!'

type CreatorSeed = {
    name: string
    email: string
    categories: string[]
    languages: string[]
    monthlyPrice?: number
    phone?: string
    links?: string[]
    notes?: string
}

const creatorSeeds: CreatorSeed[] = [
    {
        name: 'Asmaa Mohamed Mokhtar',
        email: 'mokhtarasmaa817@gmail.com',
        categories: ['Freelance & Side Hustle'],
        languages: ['English'],
        monthlyPrice: 10,
        phone: '1140482240',
        links: [
            'https://linkedin.com/in/asmaa-mokhtar-6730911a9',
            'https://asmaamokhtar.my.canva.site/',
            'mailto:mokhtarasmaa817@gmail.com'
        ],
        notes: 'Freelance mentor focused on helping students build portfolios and close their first clients.'
    },
    {
        name: 'Sofia Safwat',
        email: 'sofiasafwat12@gmail.com',
        categories: ['Freelance & Side Hustle'],
        languages: ['English'],
        monthlyPrice: 14.99,
        phone: '1211911871',
        links: [
            'https://drive.google.com/file/d/1x6bAVYysvcPMXtlnYpKlpbar9ej8V_Rx/view',
            'https://drive.google.com/file/d/1IMTF65NpdwKKXPGJMC-_TnHUliBJY0Fk/view',
            'mailto:sofiasafwat12@gmail.com'
        ],
        notes: 'Freelance coach guiding newcomers on proposals, client management, and delivery.'
    },
    {
        name: 'Youssef Yasser',
        email: 'yosefyasser589@gmail.com',
        categories: ['German Language'],
        languages: ['German'],
        monthlyPrice: 10,
        phone: '1021870612',
        links: [
            'https://linkedin.com/in/youssefyasser24',
            'mailto:yosefyasser589@gmail.com'
        ],
        notes: 'German language mentor supporting fast-track fluency for relocations and study.'
    },
    {
        name: 'Khaleel Mahdi',
        email: 'khaleelmhdi@gmail.com',
        categories: ['Coding & AI'],
        languages: ['English'],
        monthlyPrice: undefined,
        phone: '1060741899',
        links: [
            'https://linkedin.com/in/khaleel-mahdi',
            'https://khlilmhdi-2c480.web.app/'
        ],
        notes: 'Flutter and AI mentor covering modern app development stacks.'
    },
    {
        name: 'Mohamed Radwan',
        email: 'mohax.radwan@gmail.com',
        categories: ['Coding & AI'],
        languages: ['English'],
        phone: '1022070639',
        links: [
            'https://linkedin.com/in/mohamed-radwan-288a89283',
            'mailto:mohamed2004radwan@gmail.com'
        ],
        notes: 'Coding and AI mentor focused on practical projects and interview prep.'
    },
    {
        name: 'Andrew Magdy',
        email: 'andrewmagdy010610@gmail.com',
        categories: ['German Language'],
        languages: ['German'],
        monthlyPrice: 10,
        phone: '1552528519',
        links: ['https://linkedin.com/in/andrew-magdy-9a4752266'],
        notes: 'German language mentor with focus on conversation and exam readiness.'
    },
    {
        name: 'Mohammed Yasser',
        email: 'mohdyasser100@gmail.com',
        categories: ['Coding & AI'],
        languages: ['English'],
        monthlyPrice: 10,
        phone: '1228498155',
        links: ['https://linkedin.com/in/mohd-yasser'],
        notes: 'Coding mentor delivering foundational JavaScript and AI basics.'
    },
    {
        name: 'Mohamed Amin',
        email: 'mohamedaminamin74@gmail.com',
        categories: ['German Language'],
        languages: ['German'],
        monthlyPrice: 10,
        phone: '1147109321',
        links: ['https://linkedin.com/in/mohamed-amin-267091290'],
        notes: 'German mentor supporting B1-B2 level learners.'
    },
    {
        name: 'Beshoy Khairy',
        email: 'beshoykhairy99@gmail.com',
        categories: ['German Language'],
        languages: ['German'],
        monthlyPrice: 14.99,
        phone: '1289275288',
        links: ['https://linkedin.com/in/beshoy-khairy-aa703b261'],
        notes: 'Advanced German mentor specialized in fluency drills.'
    },
    {
        name: 'Omar Rady',
        email: 'omarrady474@gmail.com',
        categories: ['German Language'],
        languages: ['German'],
        phone: '1017156927',
        links: ['https://linkedin.com/in/omar-rady-98b01a259'],
        notes: 'German mentor focusing on pronunciation and day-to-day language.'
    },
    {
        name: 'Zaid Tamer',
        email: 'ziadtamer756@gmail.com',
        categories: ['Freelance & Side Hustle'],
        languages: ['English'],
        links: ['https://drive.google.com/file/d/1EL38bhYMbEQkmPh-Csm3aA2zNGwMPl6n/view?usp=drivesdk'],
        notes: 'Online business creator helping learners start and scale service offerings.'
    },
    {
        name: 'Mohamed Tarek Abdelkader',
        email: 'muhammed.tarekk50@gmail.com',
        categories: ['Freelance & Side Hustle'],
        languages: ['English'],
        phone: '1149457050',
        links: [
            'https://linkedin.com/in/mohmed-tarek',
            'https://drive.google.com/drive/folders/1eGGazNEMIh0cA3BbEjR8T6BEPzTIguGz'
        ],
        notes: 'Freelance mentor with focus on first client acquisition.'
    },
    {
        name: 'Ahmed Radwan',
        email: 'ahmedradoun@gmail.com',
        categories: ['Freelance & Side Hustle'],
        languages: ['English', 'German'],
        phone: '1101990371',
        links: ['https://linkedin.com/in/ahmed-radwan-337a45212'],
        notes: 'Bilingual freelance creator guiding learners on contracts and delivery.'
    },
    {
        name: 'Ibrahim Azab',
        email: 'hima.azab.eg@gmail.com',
        categories: ['Coding & AI', 'German Integration'],
        languages: ['English'],
        monthlyPrice: 8,
        phone: '01000888395',
        links: [
            'https://linkedin.com/in/ibrahim-waleed',
            'https://ibrahim-azab.com/'
        ],
        notes: 'Web development and AI mentor offering discounted launch pricing (8 EUR from 10).' 
    },
    {
        name: 'Aiman Sheikh',
        email: 'aimansheikh09@gmail.com',
        categories: ['Coding & AI', 'German Integration'],
        languages: ['English'],
        phone: '491635198323',
        links: ['https://linkedin.com/in/aiman-sheikh-780420162'],
        notes: 'Coding mentor with German integration guidance for newcomers.'
    },
]

type CourseSeed = {
    id: string
    title: string
    titleAr?: string
    titleDe?: string
    category: string
    duration?: string
    rating?: number
    description?: string
    thumbnail?: string
}

const courseSeeds: CourseSeed[] = [
    // German Language
    {
        id: 'lost-bus-german-survival',
        title: 'The Lost Bus',
        titleAr: 'الحافلة المفقودة',
        titleDe: 'Der verlorene Bus',
        category: 'German Language',
        rating: 4.8,
        duration: '6 months',
        description: 'To save 22 children, they risk everything—including their lives. Inspired by a true story of survival.',
        thumbnail: '/images/courses/German Language Posters/WhatsApp Image 2025-11-23 at 22.43.43_7cec6116.jpg'
    },
    {
        id: 'severance-german-advanced',
        title: 'Severance',
        titleAr: 'الفصل',
        titleDe: 'Severance',
        category: 'German Language',
        rating: 4.9,
        duration: '6 months',
        thumbnail: '/images/courses/German Language Posters/WhatsApp Image 2025-11-23 at 23.38.13_cf3432e6.jpg'
    },
    {
        id: 'german-b2-course',
        title: 'German B2 Course',
        titleAr: 'دورة الألمانية B2',
        titleDe: 'Deutsch B2 Kurs',
        category: 'German Language',
        rating: 4.8,
        duration: '7 months',
        thumbnail: '/images/courses/German Language Posters/WhatsApp Image 2025-11-25 at 14.30.27_09d6241b.jpg'
    },
    {
        id: 'german-c1-advanced',
        title: 'German C1 Advanced',
        titleAr: 'الألمانية C1 متقدم',
        titleDe: 'Deutsch C1 Fortgeschritten',
        category: 'German Language',
        rating: 4.8,
        duration: '8 months',
        thumbnail: '/images/courses/German Language Posters/WhatsApp Image 2025-11-25 at 14.32.11_b498b0d9.jpg'
    },
    {
        id: 'german-a1-beginner',
        title: 'German A1 Beginner',
        titleAr: 'الألمانية A1 للمبتدئين',
        titleDe: 'Deutsch A1 Anfänger',
        category: 'German Language',
        rating: 4.7,
        duration: '4 months',
        thumbnail: '/images/courses/German Language Posters/WhatsApp Image 2025-11-25 at 14.32.16_9169e54d.jpg'
    },
    {
        id: 'german-conversation',
        title: 'German Conversation',
        titleAr: 'محادثة ألمانية',
        titleDe: 'Deutsch Konversation',
        category: 'German Language',
        rating: 4.6,
        duration: '3 months',
        thumbnail: '/images/courses/German Language Posters/WhatsApp Image 2025-11-25 at 14.32.16_917477a7.jpg'
    },
    {
        id: 'german-grammar-mastery',
        title: 'German Grammar Mastery',
        titleAr: 'إتقان قواعد اللغة الألمانية',
        titleDe: 'Deutsch Grammatik Meisterkurs',
        category: 'German Language',
        rating: 4.9,
        duration: '5 months',
        thumbnail: '/images/courses/German Language Posters/WhatsApp Image 2025-11-25 at 14.32.17_825387de.jpg'
    },
    {
        id: 'german-business',
        title: 'Business German',
        titleAr: 'الألمانية للأعمال',
        titleDe: 'Business Deutsch',
        category: 'German Language',
        rating: 4.8,
        duration: '6 months',
        thumbnail: '/images/courses/German Language Posters/WhatsApp Image 2025-11-25 at 14.32.17_ae8d6ae8.jpg'
    },
    // Freelance & Side Hustle
    {
        id: 'pluribus-drama-relationships',
        title: 'Pluribus',
        titleAr: 'بلوريبوس',
        titleDe: 'Pluribus',
        category: 'Freelance & Side Hustle',
        rating: 4.5,
        duration: '4 months',
        description: 'A compelling drama series exploring complex human relationships.',
        thumbnail: '/images/courses/Freelance & Side Hustle Posters/between.png'
    },
    {
        id: 'foundation-freelance-mastery',
        title: 'Foundation',
        titleAr: 'الأساس',
        titleDe: 'Foundation',
        category: 'Freelance & Side Hustle',
        rating: 4.7,
        duration: '8 months',
        thumbnail: '/images/courses/Freelance & Side Hustle Posters/driving deliveries in berlin.png'
    },
    {
        id: 'freelance-success',
        title: 'Freelance Success',
        titleAr: 'نجاح العمل الحر',
        titleDe: 'Freelance-Erfolg',
        category: 'Freelance & Side Hustle',
        rating: 4.6,
        duration: '3 months',
        thumbnail: '/images/courses/Freelance & Side Hustle Posters/E-Commerce Day One.png'
    },
    {
        id: 'content-creation-mastery',
        title: 'Content Creation Mastery',
        titleAr: 'إتقان إنشاء المحتوى',
        titleDe: 'Content-Erstellung meistern',
        category: 'Freelance & Side Hustle',
        rating: 4.5,
        duration: '4 months',
        thumbnail: '/images/courses/Freelance & Side Hustle Posters/SKILL INTO INCOME.png'
    },
    {
        id: 'digital-marketing-blueprint',
        title: 'Digital Marketing Blueprint',
        titleAr: 'مخطط التسويق الرقمي',
        titleDe: 'Digitales Marketing-Blueprint',
        category: 'Freelance & Side Hustle',
        rating: 4.7,
        duration: '5 months',
        thumbnail: '/images/courses/Freelance & Side Hustle Posters/WhatsApp Image 2025-11-25 at 14.32.12_063b614c.jpg'
    },
    {
        id: 'freelance-graphic-design',
        title: 'Freelance Graphic Design',
        titleAr: 'التصميم الجرافيكي الحر',
        titleDe: 'Freelance Grafikdesign',
        category: 'Freelance & Side Hustle',
        rating: 4.6,
        duration: '4 months',
        thumbnail: '/images/courses/Freelance & Side Hustle Posters/WhatsApp Image 2025-11-25 at 14.32.12_2ac19e78.jpg'
    },
    {
        id: 'freelance-writing',
        title: 'Freelance Writing',
        titleAr: 'الكتابة الحرة',
        titleDe: 'Freiberufliches Schreiben',
        category: 'Freelance & Side Hustle',
        rating: 4.8,
        duration: '3 months',
        thumbnail: '/images/courses/Freelance & Side Hustle Posters/WhatsApp Image 2025-11-25 at 14.32.15_58aad836.jpg'
    },
    // Entrepreneurship
    {
        id: 'high-potential-entrepreneur',
        title: 'High Potential',
        titleAr: 'إمكانات عالية',
        titleDe: 'Hohes Potenzial',
        category: 'Entrepreneurship',
        rating: 4.6,
        duration: '5 months',
        thumbnail: '/images/courses/Entrepreneurship Posters/first launch.png'
    },
    {
        id: 'invasion-startup-growth',
        title: 'Invasion',
        titleAr: 'الغزو',
        titleDe: 'Invasion',
        category: 'Entrepreneurship',
        rating: 4.5,
        duration: '5 months',
        thumbnail: '/images/courses/Entrepreneurship Posters/investor room 101.png'
    },
    {
        id: 'startup-funding',
        title: 'Startup Funding',
        titleAr: 'تمويل الشركات الناشئة',
        titleDe: 'Startup-Finanzierung',
        category: 'Entrepreneurship',
        rating: 4.7,
        duration: '6 months',
        thumbnail: '/images/courses/Entrepreneurship Posters/WhatsApp Image 2025-11-25 at 14.32.14_9bb85000.jpg'
    },
    {
        id: 'business-growth-strategies',
        title: 'Business Growth Strategies',
        titleAr: 'استراتيجيات نمو الأعمال',
        titleDe: 'Strategien für Unternehmenswachstum',
        category: 'Entrepreneurship',
        rating: 4.7,
        duration: '5 months',
        thumbnail: '/images/courses/Entrepreneurship Posters/WhatsApp Image 2025-11-25 at 14.32.15_34d01093.jpg'
    },
    {
        id: 'scaling-your-startup',
        title: 'Scaling Your Startup',
        titleAr: 'توسيع شركتك الناشئة',
        titleDe: 'Dein Startup skalieren',
        category: 'Entrepreneurship',
        rating: 4.8,
        duration: '6 months',
        thumbnail: '/images/courses/Entrepreneurship Posters/WhatsApp Image 2025-11-25 at 15.04.46_5f562939.jpg'
    },
    // Trading
    {
        id: 'morning-show-trading',
        title: 'Morning Show',
        titleAr: 'برنامج الصباح',
        titleDe: 'Morning Show',
        category: 'Trading',
        rating: 4.7,
        duration: '6 months',
        thumbnail: '/images/courses/Trading Posters/WhatsApp Image 2025-11-25 at 14.32.12_063b614c.jpg'
    },
    {
        id: 'master-trader-pro',
        title: 'Master Trader',
        titleAr: 'المتداول المحترف',
        titleDe: 'Master Trader',
        category: 'Trading',
        rating: 4.8,
        duration: '4 months',
        thumbnail: '/images/courses/Trading Posters/WhatsApp Image 2025-11-25 at 14.32.14_770af3af.jpg'
    },
    // Coding & AI
    {
        id: 'ted-lasso-coding-ai',
        title: 'Ted Lasso',
        titleAr: 'تيد لاسو',
        titleDe: 'Ted Lasso',
        category: 'Coding & AI',
        rating: 4.9,
        duration: '3 months',
        thumbnail: '/images/courses/Coding & AI Posters/WhatsApp Image 2025-11-25 at 14.32.11_07d95353.jpg'
    },
    {
        id: 'ai-revolution-machine-learning',
        title: 'AI Revolution',
        titleAr: 'ثورة الذكاء الاصطناعي',
        titleDe: 'KI-Revolution',
        category: 'Coding & AI',
        rating: 4.9,
        duration: '7 months',
        thumbnail: '/images/courses/Coding & AI Posters/WhatsApp Image 2025-11-25 at 14.32.13_c74bbc50.jpg'
    },
    {
        id: 'python-mastery',
        title: 'Python Mastery',
        titleAr: 'إتقان بايثون',
        titleDe: 'Python-Meisterkurs',
        category: 'Coding & AI',
        rating: 4.8,
        duration: '4 months',
        thumbnail: '/images/courses/Coding & AI Posters/WhatsApp Image 2025-11-25 at 15.04.46_5f562939.jpg'
    },
    // German Integration
    {
        id: 'slow-horses-german-integration',
        title: 'Slow Horses',
        titleAr: 'الخيول البطيئة',
        titleDe: 'Slow Horses',
        category: 'German Integration',
        rating: 4.8,
        duration: '5 months',
        thumbnail: '/images/courses/German Integration Posters/WhatsApp Image 2025-11-25 at 14.32.13_973f42cd.jpg'
    },
    {
        id: 'german-life-culture',
        title: 'German Life',
        titleAr: 'الحياة الألمانية',
        titleDe: 'Deutsches Leben',
        category: 'German Integration',
        rating: 4.7,
        duration: '5 months',
        thumbnail: '/images/courses/German Integration Posters/WhatsApp Image 2025-11-25 at 14.32.13_d9d3d1dd.jpg'
    },
    {
        id: 'german-citizenship-prep',
        title: 'German Citizenship Prep',
        titleAr: 'التحضير للجنسية الألمانية',
        titleDe: 'Vorbereitung auf die deutsche Staatsbürgerschaft',
        category: 'German Integration',
        rating: 4.8,
        duration: '6 months',
        thumbnail: '/images/courses/German Integration Posters/WhatsApp Image 2025-11-25 at 14.32.14_39554e98.jpg'
    },
    {
        id: 'german-work-culture',
        title: 'German Work Culture',
        titleAr: 'ثقافة العمل الألمانية',
        titleDe: 'Deutsche Arbeitskultur',
        category: 'German Integration',
        rating: 4.6,
        duration: '4 months',
        thumbnail: '/images/courses/German Integration Posters/WhatsApp Image 2025-11-25 at 14.32.15_48365969.jpg'
    },
    {
        id: 'living-in-germany',
        title: 'Living in Germany',
        titleAr: 'العيش في ألمانيا',
        titleDe: 'In Deutschland leben',
        category: 'German Integration',
        rating: 4.7,
        duration: '3 months',
        thumbnail: '/images/courses/German Integration Posters/WhatsApp Image 2025-11-25 at 14.32.16_fdffce41.jpg'
    },
    {
        id: 'german-social-system',
        title: 'German Social System',
        titleAr: 'النظام الاجتماعي الألماني',
        titleDe: 'Deutsches Sozialsystem',
        category: 'German Integration',
        rating: 4.9,
        duration: '4 months',
        thumbnail: '/images/courses/German Integration Posters/WhatsApp Image 2025-11-25 at 14.32.17_91121bd7.jpg'
    }
]

function parseDurationToMinutes(duration?: string): number {
    if (!duration) return 1200
    const match = duration.match(/(\d+(?:\.\d+)?)/)
    if (!match) return 1200
    const months = parseFloat(match[1])
    // Roughly 30 study hours per month
    return Math.max(180, Math.round(months * 30 * 60))
}

function chooseLanguage(category: string): string {
    if (category.toLowerCase().includes('german')) {
        return 'de'
    }
    return 'en'
}

function buildSyllabus(title: string, category: string) {
    return {
        modules: [
            {
                title: `${title} Overview`,
                lessons: [`Welcome to ${title}`, `${category} fundamentals`, 'Next steps']
            }
        ]
    }
}

async function main() {
    console.log('🌱 Seeding mentors/creators and courses from CSV + courses page list...')

    await prisma.channelPost.deleteMany();
    await prisma.creatorChannel.deleteMany();
    await prisma.lesson.deleteMany()
    await prisma.enrollment.deleteMany()
    await prisma.course.deleteMany()
    await prisma.creator.deleteMany()
    await prisma.user.deleteMany()

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10)

    const adminPrimary = await prisma.user.create({
        data: {
            email: 'admin@prime.com',
            passwordHash,
            name: 'Prime Admin',
            role: UserRole.ADMIN,
            emailVerified: new Date(),
            bio: 'Platform administrator account.'
        }
    })

    const adminAlt = await prisma.user.create({
        data: {
            email: 'admin@prime.eg',
            passwordHash,
            name: 'Prime Admin EG',
            role: UserRole.ADMIN,
            emailVerified: new Date(),
            bio: 'Alternate admin login for legacy credential.'
        }
    })

    const createdCreators: { creatorId: string; categories: string[]; name: string }[] = []
    const categoryBuckets = new Map<string, string[]>()

    for (const seed of creatorSeeds) {
        const user = await prisma.user.create({
            data: {
                email: seed.email.toLowerCase(),
                passwordHash,
                name: seed.name,
                role: UserRole.CREATOR,
                phone: seed.phone,
                bio: seed.notes,
                profileImage: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed.name)}`,
                emailVerified: new Date()
            }
        })

        const creator = await prisma.creator.create({
            data: {
                userId: user.id,
                kycStatus: KYCStatus.VERIFIED,
                expertise: seed.categories.join(', '),
                teachingGoals: seed.notes,
                monthlyPrice: seed.monthlyPrice,
                languages: seed.languages.join(', '),
                socialLinks: seed.links && seed.links.length ? { links: seed.links } : undefined,
                timezone: 'Europe/Berlin',
                availableForMeetings: true
            }
        })

        createdCreators.push({ creatorId: creator.id, categories: seed.categories, name: seed.name })

        for (const category of seed.categories) {
            const existing = categoryBuckets.get(category) ?? []
            existing.push(creator.id)
            categoryBuckets.set(category, existing)
        }
    }

    const fallbackCategory: Record<string, string> = {
        Entrepreneurship: 'Freelance & Side Hustle',
        Trading: 'Coding & AI'
    }

    const categoryIndex = new Map<string, number>()

    const pickCreatorForCategory = (category: string): string => {
        const direct = categoryBuckets.get(category)
        if (direct && direct.length) {
            const currentIndex = categoryIndex.get(category) ?? 0
            const creatorId = direct[currentIndex % direct.length]
            categoryIndex.set(category, currentIndex + 1)
            return creatorId
        }

        const fallback = fallbackCategory[category]
        if (fallback && categoryBuckets.get(fallback)?.length) {
            const currentIndex = categoryIndex.get(fallback) ?? 0
            const creatorId = categoryBuckets.get(fallback)![currentIndex % categoryBuckets.get(fallback)!.length]
            categoryIndex.set(fallback, currentIndex + 1)
            return creatorId
        }

        if (createdCreators[0]) {
            return createdCreators[0].creatorId
        }

        throw new Error('No creators available to assign courses')
    }

    const now = new Date()
    for (const course of courseSeeds) {
        const creatorId = pickCreatorForCategory(course.category)
        const duration = parseDurationToMinutes(course.duration)

        await prisma.course.create({
            data: {
                title: course.title,
                titleAr: course.titleAr,
                titleDe: course.titleDe,
                description: course.description ?? `${course.title} course for ${course.category}.`,
                creatorId,
                category: course.category,
                skillLevel: 'All Levels',
                duration,
                language: chooseLanguage(course.category),
                rating: course.rating ?? 4.8,
                thumbnail: course.thumbnail,
                syllabus: buildSyllabus(course.title, course.category),
                status: ContentStatus.PUBLISHED,
                publishedAt: now
            }
        })
    }

    console.log('✅ Seed complete')
    console.log(`👤 Admin: admin@prime.com / ${DEMO_PASSWORD}`)
    console.log(`👤 Admin (alt): admin@prime.eg / ${DEMO_PASSWORD}`)
    console.log(`👥 Creators/Mentors created: ${createdCreators.length}`)
    console.log(`📚 Courses created: ${courseSeeds.length}`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
