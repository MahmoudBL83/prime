import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding mentors and posts...')

    try {
        // First, verify all creators and set their KYC status to VERIFIED
        const creators = await prisma.creator.findMany({
            include: {
                user: true,
                channels: true
            }
        })

        console.log(`Found ${creators.length} creators`)

        // Update all creators to VERIFIED status
        for (const creator of creators) {
            await prisma.creator.update({
                where: { id: creator.id },
                data: {
                    kycStatus: 'VERIFIED',
                    basicMonthlyPrice: creator.basicMonthlyPrice || 49,
                    premiumMonthlyPrice: creator.premiumMonthlyPrice || 99,
                    vipMonthlyPrice: creator.vipMonthlyPrice || 199,
                    totalSubscribers: Math.floor(Math.random() * 5000) + 100,
                }
            })
            console.log(`✅ Updated creator: ${creator.user.name}`)

            // Create a channel if they don't have one
            if (creator.channels.length === 0) {
                const channel = await prisma.creatorChannel.create({
                    data: {
                        creatorId: creator.id,
                        name: `${creator.user.name}'s Channel`,
                        nameAr: creator.user.arabicName ? `قناة ${creator.user.arabicName}` : null,
                        description: creator.user.bio || 'Welcome to my channel!',
                        coverImage: null,
                        tiers: {
                            bronze: { price: 49, benefits: ['Access to basic content', 'Community access'] },
                            silver: { price: 99, benefits: ['All bronze benefits', 'Exclusive videos', 'Priority support'] },
                            gold: { price: 199, benefits: ['All silver benefits', 'VIP access', '1-on-1 consultation'] },
                        }
                    }
                })
                console.log(`   ✅ Created channel: ${channel.name}`)

                // Create some demo posts for this channel
                const postTemplates = [
                    {
                        title: 'Welcome to my channel!',
                        titleAr: 'مرحباً بكم في قناتي!',
                        content: 'I\'m excited to share my knowledge with you all. Stay tuned for amazing content!',
                        contentAr: 'أنا متحمس لمشاركة معرفتي معكم جميعاً. ترقبوا محتوى رائع!',
                        tier: 'BRONZE',
                        type: 'TEXT' as const,
                    },
                    {
                        title: 'New Tutorial Available',
                        titleAr: 'درس جديد متاح',
                        content: 'Check out my latest tutorial on advanced techniques. Premium members get access to the full video!',
                        contentAr: 'تحقق من أحدث درس لي حول التقنيات المتقدمة. يحصل الأعضاء المميزون على الوصول إلى الفيديو الكامل!',
                        tier: 'SILVER',
                        type: 'VIDEO' as const,
                        mediaUrl: '/videos/demo-tutorial.mp4',
                    },
                    {
                        title: 'Exclusive Content for VIP Members',
                        titleAr: 'محتوى حصري لأعضاء VIP',
                        content: 'This is premium content only available to my VIP supporters. Thank you for your support!',
                        contentAr: 'هذا محتوى متميز متاح فقط لداعمي VIP. شكراً لدعمكم!',
                        tier: 'VIP',
                        type: 'TEXT' as const,
                    },
                ]

                for (const [index, template] of postTemplates.entries()) {
                    const publishDate = new Date()
                    publishDate.setDate(publishDate.getDate() - (postTemplates.length - index))

                    await prisma.channelPost.create({
                        data: {
                            channelId: channel.id,
                            ...template,
                            publishedAt: publishDate,
                        }
                    })
                }
                console.log(`   ✅ Created ${postTemplates.length} posts`)
            } else {
                // Creator has channels, create posts for first channel
                const channel = creator.channels[0]
                
                // Check if channel already has posts
                const existingPosts = await prisma.channelPost.count({
                    where: { channelId: channel.id }
                })

                if (existingPosts === 0) {
                    // Update channel with proper name fields
                    await prisma.creatorChannel.update({
                        where: { id: channel.id },
                        data: {
                            name: channel.name || `${creator.user.name}'s Channel`,
                            nameAr: channel.nameAr || (creator.user.arabicName ? `قناة ${creator.user.arabicName}` : null),
                        }
                    })

                    const postTemplates = [
                        {
                            title: `Latest update from ${creator.user.name}`,
                            titleAr: `آخر تحديث من ${creator.user.arabicName || creator.user.name}`,
                            content: 'Exciting new content coming soon! Make sure you\'re subscribed to not miss out.',
                            contentAr: 'محتوى جديد ومثير قريباً! تأكد من أنك مشترك حتى لا تفوتك.',
                            tier: 'BRONZE',
                            type: 'TEXT' as const,
                        },
                        {
                            title: 'Behind the Scenes',
                            titleAr: 'خلف الكواليس',
                            content: 'Here\'s a look at what I\'ve been working on this week.',
                            contentAr: 'هنا نظرة على ما كنت أعمل عليه هذا الأسبوع.',
                            tier: 'SILVER',
                            type: 'IMAGE' as const,
                            mediaUrl: '/images/demo-behind-scenes.jpg',
                        },
                    ]

                    for (const [index, template] of postTemplates.entries()) {
                        const publishDate = new Date()
                        publishDate.setHours(publishDate.getHours() - (index * 3))

                        await prisma.channelPost.create({
                            data: {
                                channelId: channel.id,
                                ...template,
                                publishedAt: publishDate,
                            }
                        })
                    }
                    console.log(`   ✅ Created ${postTemplates.length} posts for existing channel`)
                }
            }
        }

        console.log('\n📊 Final Statistics:')
        const totalCreators = await prisma.creator.count({ where: { kycStatus: 'VERIFIED' } })
        const totalChannels = await prisma.creatorChannel.count()
        const totalPosts = await prisma.channelPost.count()

        console.log(`✅ Verified Creators: ${totalCreators}`)
        console.log(`✅ Total Channels: ${totalChannels}`)
        console.log(`✅ Total Posts: ${totalPosts}`)

    } catch (error) {
        console.error('❌ Error seeding:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

main()
    .then(() => {
        console.log('\n✅ Seeding completed successfully!')
        process.exit(0)
    })
    .catch((error) => {
        console.error('❌ Seeding failed:', error)
        process.exit(1)
    })
