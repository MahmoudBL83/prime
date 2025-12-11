import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🗑️ Removing ALL mock/demo creators (keeping only @prime.edu)...\n')

    // Find all creators NOT using @prime.edu
    const mockCreators = await prisma.creator.findMany({
        where: {
            user: {
                email: {
                    not: { endsWith: '@prime.edu' }
                }
            }
        },
        include: {
            user: { select: { id: true, name: true, email: true } }
        }
    })

    console.log(`Found ${mockCreators.length} mock creators to delete\n`)

    let deletedCount = 0

    for (const creator of mockCreators) {
        try {
            console.log(`Deleting: ${creator.user.name} (${creator.user.email})`)
            
            // Delete all related records first (in correct order to avoid FK constraints)
            await prisma.creatorAnalytics.deleteMany({ where: { creatorId: creator.id } })
            await prisma.creatorEarnings.deleteMany({ where: { creatorId: creator.id } })
            await prisma.creatorPayout.deleteMany({ where: { creatorId: creator.id } })
            
            // Delete courses and their dependencies
            const courses = await prisma.course.findMany({ where: { creatorId: creator.id } })
            for (const course of courses) {
                await prisma.enrollment.deleteMany({ where: { courseId: course.id } })
                await prisma.lesson.deleteMany({ where: { courseId: course.id } })
                await prisma.quiz.deleteMany({ where: { courseId: course.id } })
                await prisma.assignment.deleteMany({ where: { courseId: course.id } })
                await prisma.review.deleteMany({ where: { courseId: course.id } })
                await prisma.certificate.deleteMany({ where: { courseId: course.id } })
            }
            await prisma.course.deleteMany({ where: { creatorId: creator.id } })
            
            // Delete channels and posts
            const channels = await prisma.creatorChannel.findMany({ where: { creatorId: creator.id } })
            for (const channel of channels) {
                // Delete post comments first
                const posts = await prisma.post.findMany({ where: { channelId: channel.id } })
                for (const post of posts) {
                    await prisma.postComment.deleteMany({ where: { postId: post.id } })
                    await prisma.postBookmark.deleteMany({ where: { postId: post.id } })
                }
                await prisma.post.deleteMany({ where: { channelId: channel.id } })
                await prisma.channelSubscription.deleteMany({ where: { channelId: channel.id } })
            }
            await prisma.creatorChannel.deleteMany({ where: { creatorId: creator.id } })
            
            // Delete other creator-related records
            await prisma.meeting.deleteMany({ where: { creatorId: creator.id } })
            await prisma.instructorAvailability.deleteMany({ where: { creatorId: creator.id } })
            await prisma.instructorFollow.deleteMany({ where: { instructorId: creator.id } })
            await prisma.videoAsset.deleteMany({ where: { creatorId: creator.id } })
            await prisma.payout.deleteMany({ where: { creatorId: creator.id } })
            await prisma.withdrawal.deleteMany({ where: { creatorId: creator.id } })
            await prisma.communityResource.deleteMany({ where: { creatorId: creator.id } })
            await prisma.memberMessage.deleteMany({ where: { creatorId: creator.id } })
            await prisma.memberPoll.deleteMany({ where: { creatorId: creator.id } })
            await prisma.videoPlaylist.deleteMany({ where: { creatorId: creator.id } })
            
            // Now delete the creator
            await prisma.creator.delete({ where: { id: creator.id } })
            
            // Don't delete the user if it's the admin
            if (!creator.user.email.includes('admin@')) {
                // Delete user-related records
                await prisma.session.deleteMany({ where: { userId: creator.user.id } })
                await prisma.notification.deleteMany({ where: { userId: creator.user.id } })
                
                // Finally delete the user
                await prisma.user.delete({ where: { id: creator.user.id } })
            }
            
            console.log(`  ✓ Deleted`)
            deletedCount++
        } catch (error: any) {
            console.log(`  ⚠️ Error: ${error.message?.substring(0, 100)}`)
        }
    }

    console.log(`\n✅ Cleanup complete! Deleted ${deletedCount} mock creators.`)

    // Show final count
    const realCreators = await prisma.creator.findMany({
        where: {
            user: { email: { endsWith: '@prime.edu' } }
        },
        include: {
            user: { select: { name: true, email: true } }
        },
        orderBy: { totalSubscribers: 'desc' }
    })
    const totalCreators = await prisma.creator.count()

    console.log(`\n📊 Final Database Summary:`)
    console.log(`   Total creators: ${totalCreators}`)
    console.log(`\n👥 Remaining creators:`)
    for (const c of realCreators) {
        console.log(`   - ${c.user.name} (${c.totalSubscribers} subscribers)`)
    }
}

main()
    .catch((e) => {
        console.error('❌ Cleanup failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
