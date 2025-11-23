import { PrismaClient, PostType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding feed posts...');

    // Get all creators
    const creators = await prisma.creator.findMany({
        include: {
            user: true,
            channels: true
        }
    });

    if (creators.length === 0) {
        console.log('❌ No creators found. Please run seed-test-creators.ts first.');
        return;
    }

    console.log(`Found ${creators.length} creators`);

    // Sample posts data with Apple TV theme
    const postsData = [
        // Ahmed Hassan - German Language
        {
            title: 'German Grammar Essentials',
            titleAr: 'أساسيات قواعد اللغة الألمانية',
            content: 'Master German grammar with this comprehensive guide covering articles, cases, and sentence structure. Perfect for beginners! 🇩🇪',
            contentAr: 'أتقن قواعد اللغة الألمانية مع هذا الدليل الشامل الذي يغطي المقالات والحالات وبنية الجملة. مثالي للمبتدئين! 🇩🇪',
            type: 'TEXT' as PostType,
            tier: 'BRONZE',
            thumbnailUrl: 'https://images.unsplash.com/photo-1527866959252-deab85ef7d1b?w=800'
        },
        {
            title: 'German Speaking Practice Session',
            titleAr: 'جلسة ممارسة التحدث بالألمانية',
            content: 'Join me for a live speaking practice session. We\'ll focus on everyday conversations and pronunciation. 🎤',
            contentAr: 'انضم إلي في جلسة ممارسة التحدث المباشرة. سنركز على المحادثات اليومية والنطق. 🎤',
            type: 'VIDEO' as PostType,
            tier: 'SILVER',
            mediaUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
            thumbnailUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
            duration: 1800
        },
        // Sara Mohamed - Freelancing
        {
            title: 'Freelancing Success Blueprint',
            titleAr: 'مخطط النجاح في العمل الحر',
            content: 'Learn how I built a 6-figure freelancing business from Egypt. Step-by-step guide to getting your first clients. 💼',
            contentAr: 'تعلم كيف بنيت عملًا حرًا بستة أرقام من مصر. دليل خطوة بخطوة للحصول على عملائك الأوائل. 💼',
            type: 'TEXT' as PostType,
            tier: 'BRONZE',
            thumbnailUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800'
        },
        {
            title: 'Upwork Profile Optimization',
            titleAr: 'تحسين ملف Upwork الشخصي',
            content: 'Complete guide to creating a winning Upwork profile that attracts high-paying clients. Includes templates! 🚀',
            contentAr: 'دليل كامل لإنشاء ملف Upwork رابح يجذب العملاء ذوي الأجور المرتفعة. يتضمن قوالب! 🚀',
            type: 'DOCUMENT' as PostType,
            tier: 'SILVER',
            mediaUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800',
            thumbnailUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800'
        },
        // Omar Khalil - Trading
        {
            title: 'Crypto Trading Strategies 2025',
            titleAr: 'استراتيجيات تداول العملات الرقمية 2025',
            content: 'My proven trading strategies that generated 300% returns. Risk management, technical analysis, and more. 📈',
            contentAr: 'استراتيجيات التداول المثبتة التي حققت عوائد 300٪. إدارة المخاطر والتحليل الفني والمزيد. 📈',
            type: 'TEXT' as PostType,
            tier: 'GOLD',
            thumbnailUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800'
        },
        {
            title: 'Live Market Analysis',
            titleAr: 'تحليل السوق المباشر',
            content: 'Watch me analyze BTC, ETH, and top altcoins in real-time. Learn my exact entry and exit strategies. 💹',
            contentAr: 'شاهدني أحلل BTC و ETH وأفضل العملات البديلة في الوقت الفعلي. تعلم استراتيجيات الدخول والخروج الدقيقة. 💹',
            type: 'VIDEO' as PostType,
            tier: 'GOLD',
            mediaUrl: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800',
            thumbnailUrl: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800',
            duration: 2400
        },
        // Layla Ibrahim - Coding & AI
        {
            title: 'Building AI Apps with Python',
            titleAr: 'بناء تطبيقات الذكاء الاصطناعي بلغة Python',
            content: 'Complete tutorial on building AI-powered apps using OpenAI GPT-4, LangChain, and Vector DBs. Code included! 🤖',
            contentAr: 'برنامج تعليمي كامل حول بناء التطبيقات المدعومة بالذكاء الاصطناعي باستخدام OpenAI GPT-4 و LangChain وقواعد بيانات Vector. الكود مضمن! 🤖',
            type: 'TEXT' as PostType,
            tier: 'BRONZE',
            thumbnailUrl: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800'
        },
        {
            title: 'React + TypeScript Best Practices',
            titleAr: 'أفضل ممارسات React + TypeScript',
            content: 'Advanced patterns and architectures for scalable React apps. Clean code, performance optimization, and testing. ⚛️',
            contentAr: 'أنماط ومعماريات متقدمة لتطبيقات React قابلة للتطوير. كود نظيف وتحسين الأداء والاختبار. ⚛️',
            type: 'VIDEO' as PostType,
            tier: 'SILVER',
            mediaUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
            thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
            duration: 3600
        },
        // Youssef Ali - Entrepreneurship
        {
            title: 'From Zero to First Million EGP',
            titleAr: 'من الصفر إلى أول مليون جنيه مصري',
            content: 'My complete journey building multiple businesses in Egypt. Failures, lessons, and the winning formula. 🎯',
            contentAr: 'رحلتي الكاملة في بناء أعمال متعددة في مصر. الفشل والدروس والصيغة الفائزة. 🎯',
            type: 'TEXT' as PostType,
            tier: 'BRONZE',
            thumbnailUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800'
        },
        {
            title: 'E-commerce Masterclass',
            titleAr: 'ماستركلاس التجارة الإلكترونية',
            content: 'Everything you need to start and scale an e-commerce business in MENA. Logistics, marketing, and automation. 📦',
            contentAr: 'كل ما تحتاجه لبدء وتوسيع نطاق أعمال التجارة الإلكترونية في منطقة الشرق الأوسط وشمال أفريقيا. الخدمات اللوجستية والتسويق والأتمتة. 📦',
            type: 'VIDEO' as PostType,
            tier: 'GOLD',
            mediaUrl: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?w=800',
            thumbnailUrl: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?w=800',
            duration: 4200
        },
        // Additional mixed posts
        {
            title: 'Q&A Session - Ask Me Anything',
            titleAr: 'جلسة أسئلة وأجوبة - اسألني أي شيء',
            content: 'Live Q&A answering your questions about learning, freelancing, and building online businesses. 💬',
            contentAr: 'أسئلة وأجوبة مباشرة للإجابة على أسئلتك حول التعلم والعمل الحر وبناء الأعمال التجارية عبر الإنترنت. 💬',
            type: 'ANNOUNCEMENT' as PostType,
            tier: 'BRONZE',
            thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800'
        },
        {
            title: 'Exclusive Resource Pack',
            titleAr: 'حزمة موارد حصرية',
            content: 'Download my complete toolkit: templates, scripts, checklists, and resources I use daily. Premium members only! 📁',
            contentAr: 'قم بتنزيل مجموعة الأدوات الكاملة الخاصة بي: القوالب والنصوص وقوائم المراجعة والموارد التي أستخدمها يوميًا. الأعضاء المميزون فقط! 📁',
            type: 'DOCUMENT' as PostType,
            tier: 'GOLD',
            mediaUrl: 'https://images.unsplash.com/photo-1544396821-4dd40b938ad3?w=800',
            thumbnailUrl: 'https://images.unsplash.com/photo-1544396821-4dd40b938ad3?w=800'
        },
    ];

    let postsCreated = 0;

    for (const creator of creators) {
        // Get or create default channel
        let channel = creator.channels[0];
        
        if (!channel) {
            console.log(`Creating default channel for ${creator.user.name}`);
            channel = await prisma.creatorChannel.create({
                data: {
                    creatorId: creator.id,
                    name: `${creator.user.name}'s Channel`,
                    description: `Official channel for ${creator.user.name}`,
                    coverImage: creator.user.profileImage,
                    tiers: { BRONZE: 49, SILVER: 99, GOLD: 199 }
                }
            });
        }

        // Create 2-3 posts per creator
        const creatorPosts = postsData.slice(postsCreated, postsCreated + 2);
        
        for (const postData of creatorPosts) {
            await prisma.channelPost.create({
                data: {
                    channelId: channel.id,
                    ...postData,
                    publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random within last 7 days
                    viewCount: Math.floor(Math.random() * 5000) + 100
                }
            });
            postsCreated++;
        }
    }

    console.log(`✅ Created ${postsCreated} feed posts across ${creators.length} creators`);

    // Verify posts
    const totalPosts = await prisma.channelPost.count();
    console.log(`📊 Total posts in database: ${totalPosts}`);
}

main()
    .catch((e) => {
        console.error('Error seeding posts:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
