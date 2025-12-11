import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🗑️ Removing ALL mock/demo creators (keeping only @prime.edu)...\n')

    // Find all users that are creators but NOT using @prime.edu (and not admin)
    const mockUsers = await prisma.user.findMany({
        where: {
            creator: { isNot: null },
            AND: [
                { email: { not: { endsWith: '@prime.edu' } } },
                { email: { not: { contains: 'admin' } } }
            ]
        },
        select: { id: true, name: true, email: true }
    })

    console.log(`Found ${mockUsers.length} mock creator users to delete\n`)

    // Use Prisma's cascade delete by deleting users (which should cascade to creators)
    // But first, we need to handle the relationship properly
    
    for (const user of mockUsers) {
        try {
            console.log(`Deleting: ${user.name} (${user.email})`)
            
            // Get creator
            const creator = await prisma.creator.findUnique({
                where: { userId: user.id }
            })
            
            if (creator) {
                // Delete in order of dependencies
                
                // 1. Delete analytics and earnings
                await prisma.creatorAnalytics.deleteMany({ where: { creatorId: creator.id } }).catch(() => {})
                await prisma.creatorEarnings.deleteMany({ where: { creatorId: creator.id } }).catch(() => {})
                await prisma.creatorPayout.deleteMany({ where: { creatorId: creator.id } }).catch(() => {})
                
                // 2. Delete channels and their content
                const channels = await prisma.creatorChannel.findMany({ 
                    where: { creatorId: creator.id },
                    select: { id: true }
                })
                
                for (const channel of channels) {
                    const posts = await prisma.post.findMany({ where: { channelId: channel.id }, select: { id: true } })
                    for (const post of posts) {
                        await prisma.postComment.deleteMany({ where: { postId: post.id } }).catch(() => {})
                        await prisma.postBookmark.deleteMany({ where: { postId: post.id } }).catch(() => {})
                    }
                    await prisma.post.deleteMany({ where: { channelId: channel.id } }).catch(() => {})
                    await prisma.channelSubscription.deleteMany({ where: { channelId: channel.id } }).catch(() => {})
                }
                await prisma.creatorChannel.deleteMany({ where: { creatorId: creator.id } }).catch(() => {})
                
                // 3. Delete courses and their content
                const courses = await prisma.course.findMany({ 
                    where: { creatorId: creator.id },
                    select: { id: true }
                })
                
                for (const course of courses) {
                    await prisma.enrollment.deleteMany({ where: { courseId: course.id } }).catch(() => {})
                    await prisma.lesson.deleteMany({ where: { courseId: course.id } }).catch(() => {})
                    await prisma.quiz.deleteMany({ where: { courseId: course.id } }).catch(() => {})
                    await prisma.assignment.deleteMany({ where: { courseId: course.id } }).catch(() => {})
                    await prisma.review.deleteMany({ where: { courseId: course.id } }).catch(() => {})
                    await prisma.certificate.deleteMany({ where: { courseId: course.id } }).catch(() => {})
                }
                await prisma.course.deleteMany({ where: { creatorId: creator.id } }).catch(() => {})
                
                // 4. Delete other related records (with catches for missing tables)
                await prisma.meeting.deleteMany({ where: { creatorId: creator.id } }).catch(() => {})
                await prisma.instructorAvailability.deleteMany({ where: { creatorId: creator.id } }).catch(() => {})
                await prisma.videoAsset.deleteMany({ where: { creatorId: creator.id } }).catch(() => {})
                await prisma.payout.deleteMany({ where: { creatorId: creator.id } }).catch(() => {})
                await prisma.withdrawal.deleteMany({ where: { creatorId: creator.id } }).catch(() => {})
                await prisma.communityResource.deleteMany({ where: { creatorId: creator.id } }).catch(() => {})
                await prisma.memberMessage.deleteMany({ where: { creatorId: creator.id } }).catch(() => {})
                await prisma.memberPoll.deleteMany({ where: { creatorId: creator.id } }).catch(() => {})
                await prisma.videoPlaylist.deleteMany({ where: { creatorId: creator.id } }).catch(() => {})
                
                // 5. Delete InstructorFollow (uses instructorId not creatorId)
                await prisma.instructorFollow.deleteMany({ where: { instructorId: creator.id } }).catch(() => {})
                
                // 6. Delete the creator
                await prisma.creator.delete({ where: { id: creator.id } })
            }
            
            // 7. Delete user-related records
            await prisma.session.deleteMany({ where: { userId: user.id } }).catch(() => {})
            await prisma.notification.deleteMany({ where: { userId: user.id } }).catch(() => {})
            await prisma.enrollment.deleteMany({ where: { userId: user.id } }).catch(() => {})
            
            // 8. Delete the user
            await prisma.user.delete({ where: { id: user.id } })
            
            console.log(`  ✓ Deleted`)
        } catch (error: any) {
            console.log(`  ⚠️ Partial delete: ${error.message?.substring(0, 80)}`)
        }
    }

    console.log(`\n✅ Cleanup attempt complete!`)

    // Show final count
    const totalCreators = await prisma.creator.count()
    const realCreators = await prisma.creator.findMany({
        where: { user: { email: { endsWith: '@prime.edu' } } },
        include: { user: { select: { name: true } } },
        orderBy: { totalSubscribers: 'desc' }
    })

    console.log(`\n📊 Final Database Summary:`)
    console.log(`   Total creators remaining: ${totalCreators}`)
    console.log(`   Real creators (@prime.edu): ${realCreators.length}`)
    
    if (realCreators.length > 0) {
        console.log(`\n👥 Real creators:`)
        for (const c of realCreators) {
            console.log(`   - ${c.user.name} (${c.totalSubscribers} subscribers)`)
        }
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
