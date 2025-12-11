import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function finalCleanup() {
  const mockEmails = [
    'ahmed.hassan@example.com',
    'sara.mohamed@example.com',
    'omar.khalil@example.com',
    'layla.ibrahim@example.com',
    'youssef.ali@example.com',
    'admin@prime.eg'
  ];

  console.log('🧹 Final cleanup of mock creators...\n');

  for (const email of mockEmails) {
    try {
      const user = await prisma.user.findUnique({ 
        where: { email },
        include: { creator: true }
      });

      if (!user) {
        console.log(`⚠️ User not found: ${email}`);
        continue;
      }

      console.log(`Processing ${user.name} (${email})...`);

      // Delete all related records in order
      const userId = user.id;
      const creatorId = user.creator?.id;

      // User-related deletions
      await prisma.instructorFollow.deleteMany({ where: { userId } });
      await prisma.instructorFollow.deleteMany({ where: { creator: { userId } } });
      await prisma.subscription.deleteMany({ where: { userId } });
      await prisma.transaction.deleteMany({ where: { userId } });
      await prisma.channelSubscription.deleteMany({ where: { userId } });
      await prisma.meetingBooking.deleteMany({ where: { userId } });
      await prisma.review.deleteMany({ where: { userId } });
      await prisma.discussion.deleteMany({ where: { userId } });
      await prisma.discussionReply.deleteMany({ where: { userId } });
      await prisma.notification.deleteMany({ where: { userId } });
      await prisma.certificate.deleteMany({ where: { userId } });
      await prisma.enrollment.deleteMany({ where: { userId } });
      await prisma.post.deleteMany({ where: { userId } });
      await prisma.postLike.deleteMany({ where: { userId } });
      await prisma.postComment.deleteMany({ where: { userId } });
      await prisma.commentLike.deleteMany({ where: { userId } });
      await prisma.tipPayment.deleteMany({ where: { userId } });
      await prisma.message.deleteMany({ where: { senderId: userId } });
      await prisma.message.deleteMany({ where: { receiverId: userId } });
      await prisma.session.deleteMany({ where: { userId } });
      await prisma.account.deleteMany({ where: { userId } });

      if (creatorId) {
        // Creator-related deletions
        await prisma.creatorAnalytics.deleteMany({ where: { creatorId } });
        await prisma.creatorEarnings.deleteMany({ where: { creatorId } });
        await prisma.instructorFollow.deleteMany({ where: { instructorId: creatorId } });
        
        // Delete courses and their related data
        const courses = await prisma.course.findMany({ where: { creatorId } });
        for (const course of courses) {
          await prisma.enrollment.deleteMany({ where: { courseId: course.id } });
          await prisma.review.deleteMany({ where: { courseId: course.id } });
          await prisma.lesson.deleteMany({ where: { courseId: course.id } });
          await prisma.quiz.deleteMany({ where: { courseId: course.id } });
        }
        await prisma.course.deleteMany({ where: { creatorId } });

        // Delete posts and their related data
        const posts = await prisma.post.findMany({ where: { creatorId } });
        for (const post of posts) {
          await prisma.postLike.deleteMany({ where: { postId: post.id } });
          await prisma.postComment.deleteMany({ where: { postId: post.id } });
        }
        await prisma.post.deleteMany({ where: { creatorId } });

        // Delete channels and related
        const channels = await prisma.channel.findMany({ where: { creatorId } });
        for (const channel of channels) {
          await prisma.channelSubscription.deleteMany({ where: { channelId: channel.id } });
        }
        await prisma.channel.deleteMany({ where: { creatorId } });

        // Delete meetings and related
        const meetings = await prisma.meeting.findMany({ where: { creatorId } });
        for (const meeting of meetings) {
          await prisma.meetingBooking.deleteMany({ where: { meetingId: meeting.id } });
          await prisma.meetingSlot.deleteMany({ where: { meetingId: meeting.id } });
        }
        await prisma.meeting.deleteMany({ where: { creatorId } });

        // Delete creator
        await prisma.creator.delete({ where: { id: creatorId } });
      }

      // Finally delete user
      await prisma.user.delete({ where: { id: userId } });
      console.log(`   ✅ Deleted ${user.name}`);

    } catch (error: any) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
  }

  // Final count
  const remaining = await prisma.creator.count();
  const realCreators = await prisma.creator.count({
    where: { user: { email: { endsWith: '@prime.edu' } } }
  });

  console.log(`\n📊 Final state:`);
  console.log(`   Total creators: ${remaining}`);
  console.log(`   Real creators: ${realCreators}`);
}

finalCleanup()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
