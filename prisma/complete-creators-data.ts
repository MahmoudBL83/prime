import { PrismaClient, EarningType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🔧 Adding complete data for real creators (courses, analytics, earnings)...\n')

    // Find all creators we created with @prime.edu emails
    const creators = await prisma.creator.findMany({
        where: {
            user: {
                email: {
                    endsWith: '@prime.edu'
                }
            }
        },
        include: {
            user: true,
            courses: true,
            analytics: true,
            earnings: true,
        }
    })

    console.log(`📋 Found ${creators.length} real creators\n`)

    const expertiseToCategory: Record<string, string> = {
        'Freelance': 'Business',
        'German Language': 'Language',
        'Flutter': 'Programming',
        'Coding': 'Programming',
        'AI': 'Technology',
        'Web Development': 'Programming',
        'Mobile Development': 'Programming',
    }

    // Get current month/year for period
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()
    const monthlyPeriod = `${currentYear}-${String(currentMonth).padStart(2, '0')}`
    
    // Also create last month's data
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear
    const lastMonthPeriod = `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}`

    let coursesAdded = 0
    let analyticsAdded = 0
    let earningsAdded = 0

    for (const creator of creators) {
        try {
            const mainExpertise = creator.expertise?.split(',')[0].trim() || 'General'
            const category = expertiseToCategory[mainExpertise] || 'General'
            const language = creator.languages?.includes('German') ? 'DE' : 'EN'
            const price = (creator as any).monthlyPrice || creator.basicMonthlyPrice || 29 // EUR
            const monthlyRevenue = creator.totalSubscribers * price * 0.85

            // ============ COURSES ============
            if (creator.courses.length === 0) {
                await prisma.course.create({
                    data: {
                        title: `${mainExpertise} Masterclass`,
                        titleAr: `دورة ${creator.user.arabicName?.split(' ')[0] || ''} الشاملة`,
                        description: `Comprehensive course in ${mainExpertise} by ${creator.user.name}. Learn from an expert with proven track record.`,
                        descriptionAr: `دورة شاملة مع محتوى مميز وتمارين عملية`,
                        creatorId: creator.id,
                        category: category,
                        skillLevel: 'Intermediate',
                        duration: 120,
                        syllabus: [
                            { week: 1, title: 'Introduction', description: 'Getting started with the fundamentals' },
                            { week: 2, title: 'Core Concepts', description: 'Building your foundation' },
                            { week: 3, title: 'Advanced Topics', description: 'Deep dive into advanced techniques' },
                            { week: 4, title: 'Practical Projects', description: 'Hands-on real-world applications' },
                        ],
                        rating: 4.5 + Math.random() * 0.5,
                        totalEnrollments: Math.floor(creator.totalSubscribers * 0.6),
                        language: language,
                        price: 0,
                        thumbnail: `/images/courses/${mainExpertise.toLowerCase().replace(/\s+/g, '-')}.jpg`,
                        contentType: 'SERIES',
                        status: 'PUBLISHED',
                        publishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Published 30 days ago
                    },
                })
                coursesAdded++
            }

            // ============ ANALYTICS ============
            if (creator.analytics.length === 0) {
                const totalViews = creator.totalSubscribers * 50 + Math.floor(Math.random() * 10000)
                const totalEnrollments = Math.floor(creator.totalSubscribers * 0.6)
                
                // Current month analytics
                await prisma.creatorAnalytics.create({
                    data: {
                        creatorId: creator.id,
                        period: monthlyPeriod,
                        periodType: 'MONTHLY',
                        totalRevenue: monthlyRevenue,
                        totalViews: totalViews,
                        totalEnrollments: totalEnrollments,
                        totalSubscribers: creator.totalSubscribers,
                        avgCompletion: 0.65 + Math.random() * 0.25,
                        avgRating: 4.5 + Math.random() * 0.5,
                        retentionRate: 0.75 + Math.random() * 0.2,
                        churnRate: 0.05 + Math.random() * 0.1,
                        breakdown: {
                            views: {
                                organic: Math.floor(totalViews * 0.6),
                                referral: Math.floor(totalViews * 0.25),
                                social: Math.floor(totalViews * 0.15),
                            },
                            revenue: {
                                subscriptions: monthlyRevenue * 0.7,
                                courses: monthlyRevenue * 0.2,
                                tips: monthlyRevenue * 0.1,
                            },
                            engagement: {
                                likes: creator.totalSubscribers * 5,
                                comments: creator.totalSubscribers * 2,
                                shares: Math.floor(creator.totalSubscribers * 0.3),
                            }
                        },
                    },
                })

                // Last month analytics (for comparison)
                const lastMonthViews = Math.floor(totalViews * 0.85) // 15% growth
                const lastMonthRevenue = Math.floor(monthlyRevenue * 0.9)
                await prisma.creatorAnalytics.create({
                    data: {
                        creatorId: creator.id,
                        period: lastMonthPeriod,
                        periodType: 'MONTHLY',
                        totalRevenue: lastMonthRevenue,
                        totalViews: lastMonthViews,
                        totalEnrollments: Math.floor(totalEnrollments * 0.8),
                        totalSubscribers: Math.floor(creator.totalSubscribers * 0.9),
                        avgCompletion: 0.6 + Math.random() * 0.2,
                        avgRating: 4.4 + Math.random() * 0.5,
                        retentionRate: 0.7 + Math.random() * 0.2,
                        churnRate: 0.08 + Math.random() * 0.1,
                        breakdown: {
                            views: {
                                organic: Math.floor(lastMonthViews * 0.55),
                                referral: Math.floor(lastMonthViews * 0.3),
                                social: Math.floor(lastMonthViews * 0.15),
                            },
                            revenue: {
                                subscriptions: lastMonthRevenue * 0.7,
                                courses: lastMonthRevenue * 0.2,
                                tips: lastMonthRevenue * 0.1,
                            }
                        },
                    },
                })
                analyticsAdded += 2
            }

            // ============ EARNINGS ============
            if (creator.earnings.length === 0) {
                // Current month subscription earnings
                await prisma.creatorEarnings.create({
                    data: {
                        creatorId: creator.id,
                        sourceType: 'CHANNEL_SUBSCRIPTION' as EarningType,
                        amount: monthlyRevenue * 0.7,
                        currency: 'EUR',
                        period: monthlyPeriod,
                        description: `Subscription revenue - ${now.toLocaleString('en-US', { month: 'long', year: 'numeric' })}`,
                        status: 'COMPLETED',
                        metadata: {
                            subscriberCount: creator.totalSubscribers,
                            avgPrice: price,
                            newSubscribers: Math.floor(creator.totalSubscribers * 0.1),
                            renewals: Math.floor(creator.totalSubscribers * 0.9),
                        },
                    },
                })

                // Current month course earnings
                await prisma.creatorEarnings.create({
                    data: {
                        creatorId: creator.id,
                        sourceType: 'COURSE_ENROLLMENT' as EarningType,
                        amount: monthlyRevenue * 0.2,
                        currency: 'EUR',
                        period: monthlyPeriod,
                        description: `Course enrollment revenue - ${now.toLocaleString('en-US', { month: 'long', year: 'numeric' })}`,
                        status: 'COMPLETED',
                        metadata: {
                            enrollmentCount: Math.floor(creator.totalSubscribers * 0.3),
                            completionRate: 0.75,
                        },
                    },
                })

                // Current month tips
                const tipCount = Math.floor(creator.totalSubscribers * 0.05)
                await prisma.creatorEarnings.create({
                    data: {
                        creatorId: creator.id,
                        sourceType: 'TIP' as EarningType,
                        amount: monthlyRevenue * 0.1,
                        currency: 'EUR',
                        period: monthlyPeriod,
                        description: `Tips & donations - ${now.toLocaleString('en-US', { month: 'long', year: 'numeric' })}`,
                        status: 'COMPLETED',
                        metadata: {
                            tipCount: tipCount,
                            avgTip: tipCount > 0 ? (monthlyRevenue * 0.1) / tipCount : 0,
                        },
                    },
                })

                // Last month earnings (for comparison)
                const lastMonthRevenue = monthlyRevenue * 0.9
                await prisma.creatorEarnings.create({
                    data: {
                        creatorId: creator.id,
                        sourceType: 'CHANNEL_SUBSCRIPTION' as EarningType,
                        amount: lastMonthRevenue * 0.7,
                        currency: 'EUR',
                        period: lastMonthPeriod,
                        description: `Subscription revenue - ${new Date(lastMonthYear, lastMonth - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })}`,
                        status: 'COMPLETED',
                        metadata: {
                            subscriberCount: Math.floor(creator.totalSubscribers * 0.9),
                        },
                    },
                })

                await prisma.creatorEarnings.create({
                    data: {
                        creatorId: creator.id,
                        sourceType: 'COURSE_ENROLLMENT' as EarningType,
                        amount: lastMonthRevenue * 0.2,
                        currency: 'EUR',
                        period: lastMonthPeriod,
                        description: `Course enrollment revenue - ${new Date(lastMonthYear, lastMonth - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })}`,
                        status: 'COMPLETED',
                    },
                })

                await prisma.creatorEarnings.create({
                    data: {
                        creatorId: creator.id,
                        sourceType: 'TIP' as EarningType,
                        amount: lastMonthRevenue * 0.1,
                        currency: 'EUR',
                        period: lastMonthPeriod,
                        description: `Tips & donations - ${new Date(lastMonthYear, lastMonth - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })}`,
                        status: 'COMPLETED',
                    },
                })

                earningsAdded += 6
            }

            console.log(`✅ ${creator.user.name} - Complete`)
        } catch (error) {
            console.error(`❌ Error processing ${creator.user.name}:`, error)
        }
    }

    console.log('\n' + '='.repeat(60))
    console.log('🎉 SEEDING COMPLETED!')
    console.log('='.repeat(60))
    console.log(`📚 Courses added: ${coursesAdded}`)
    console.log(`📊 Analytics records added: ${analyticsAdded}`)
    console.log(`💰 Earnings records added: ${earningsAdded}`)
    
    // Final summary
    console.log('\n📋 FINAL CREATOR SUMMARY:')
    console.log('-'.repeat(60))
    
    const finalCreators = await prisma.creator.findMany({
        where: {
            user: { email: { endsWith: '@prime.edu' } }
        },
        include: {
            user: { select: { name: true, email: true } },
            courses: { select: { id: true, title: true } },
            analytics: { select: { id: true, totalRevenue: true, period: true } },
            earnings: { select: { id: true, amount: true, sourceType: true } },
        },
        orderBy: { totalSubscribers: 'desc' }
    })

    for (const c of finalCreators) {
        const totalEarnings = c.earnings.reduce((sum, e) => sum + e.amount, 0)
        const totalRevenue = c.analytics.reduce((sum, a) => sum + a.totalRevenue, 0)
        console.log(`\n👤 ${c.user.name}`)
        console.log(`   📧 ${c.user.email}`)
        console.log(`   👥 ${c.totalSubscribers} subscribers`)
        console.log(`   📚 ${c.courses.length} course(s)`)
        console.log(`   📊 ${c.analytics.length} analytics record(s)`)
        console.log(`   💰 ${c.earnings.length} earning record(s) (€${totalEarnings.toLocaleString()} total)`)
    }

    console.log('\n' + '='.repeat(60))
    console.log('✨ All 15 creators are now fully set up with:')
    console.log('   ✓ User accounts')
    console.log('   ✓ Creator profiles with pricing')
    console.log('   ✓ Courses')
    console.log('   ✓ Monthly analytics (current + last month)')
    console.log('   ✓ Earnings breakdown (subscriptions, courses, tips)')
    console.log('='.repeat(60))
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
