import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Fix Mentor Hourly Rates to Egyptian Market Pricing
 * 
 * PROBLEM:
 * - Current rates are in USD ($50-120) which equals 1,550-3,720 EGP
 * - Channel subscriptions are 49-149 EGP monthly
 * - This creates huge pricing conflict and unrealistic expectations
 * 
 * SOLUTION:
 * - Convert to realistic Egyptian pricing (200-800 EGP/hour)
 * - Make it reasonable compared to channel subscriptions
 * - Pricing tiers:
 *   - Junior/Standard mentors: 200-350 EGP/hour
 *   - Mid-level mentors: 400-550 EGP/hour
 *   - Senior/Expert mentors: 600-800 EGP/hour
 */

async function fixMentorPricing() {
    try {
        console.log('🔧 Fixing mentor hourly rates to Egyptian market pricing...\n')

        // Get all creators
        const creators = await prisma.creator.findMany({
            include: {
                user: true,
                _count: {
                    select: {
                        courses: true,
                        followers: true
                    }
                }
            }
        })

        if (creators.length === 0) {
            console.log('❌ No creators found in database.')
            return
        }

        console.log(`📊 Found ${creators.length} creators to update\n`)

        let updatedCount = 0

        for (const creator of creators) {
            const oldRate = creator.hourlyRate
            let newRate = 250 // Default rate

            // Calculate new rate based on experience and stats
            const totalCourses = creator._count.courses
            const totalFollowers = creator._count.followers
            const yearsExp = creator.yearsOfExperience || 0

            // Pricing logic based on experience and popularity
            if (yearsExp >= 10 || totalFollowers > 5000) {
                // Senior/Expert mentors: 600-800 EGP
                newRate = 600 + Math.floor(Math.random() * 200)
            } else if (yearsExp >= 5 || totalFollowers > 2000) {
                // Mid-level mentors: 400-550 EGP
                newRate = 400 + Math.floor(Math.random() * 150)
            } else if (yearsExp >= 2 || totalCourses >= 3) {
                // Experienced mentors: 300-450 EGP
                newRate = 300 + Math.floor(Math.random() * 150)
            } else {
                // Junior/Standard mentors: 200-350 EGP
                newRate = 200 + Math.floor(Math.random() * 150)
            }

            // Update the creator
            await prisma.creator.update({
                where: { id: creator.id },
                data: { hourlyRate: newRate }
            })

            console.log(`✅ ${creator.user.name}`)
            console.log(`   Old: $${oldRate} (~${oldRate * 31} EGP)`)
            console.log(`   New: ${newRate} EGP`)
            console.log(`   Experience: ${yearsExp}y | Courses: ${totalCourses} | Followers: ${totalFollowers}\n`)

            updatedCount++
        }

        console.log('═══════════════════════════════════════════════')
        console.log(`🎉 Successfully updated ${updatedCount} mentor hourly rates!`)
        console.log('═══════════════════════════════════════════════')
        console.log('\n📋 New Pricing Structure:')
        console.log('   Junior/Standard: 200-350 EGP/hour')
        console.log('   Mid-level: 400-550 EGP/hour')
        console.log('   Senior/Expert: 600-800 EGP/hour')
        console.log('\n💡 This is now consistent with channel subscriptions (49-149 EGP/month)')
        console.log('   Making 1-on-1 mentoring a premium service with fair pricing.')

    } catch (error) {
        console.error('❌ Error fixing mentor pricing:', error)
    } finally {
        await prisma.$disconnect()
    }
}

fixMentorPricing()
