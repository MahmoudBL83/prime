import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function finalCleanup() {
  const mockEmails = [
    'ahmed.hassan@example.com',
    'sara.mohamed@example.com',
    'omar.khalil@example.com',
    'layla.ibrahim@example.com',
    'youssef.ali@example.com'
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

      const userId = user.id;
      const creatorId = user.creator?.id;

      // Delete InstructorFollow records
      await prisma.$executeRaw`DELETE FROM "InstructorFollow" WHERE "userId" = ${userId}`;
      
      if (creatorId) {
        await prisma.$executeRaw`DELETE FROM "InstructorFollow" WHERE "creatorId" = ${creatorId}`;
        await prisma.$executeRaw`DELETE FROM "MentorSubscription" WHERE "creatorId" = ${creatorId}`;
        await prisma.$executeRaw`DELETE FROM "CreatorAnalytics" WHERE "creatorId" = ${creatorId}`;
        await prisma.$executeRaw`DELETE FROM "CreatorEarnings" WHERE "creatorId" = ${creatorId}`;
        
        // Delete course-related data
        const courses = await prisma.course.findMany({ where: { creatorId }, select: { id: true } });
        for (const course of courses) {
          await prisma.$executeRaw`DELETE FROM "Enrollment" WHERE "courseId" = ${course.id}`;
          await prisma.$executeRaw`DELETE FROM "Review" WHERE "courseId" = ${course.id}`;
          await prisma.$executeRaw`DELETE FROM "Lesson" WHERE "courseId" = ${course.id}`;
          await prisma.$executeRaw`DELETE FROM "Quiz" WHERE "courseId" = ${course.id}`;
          await prisma.$executeRaw`DELETE FROM "CourseInteraction" WHERE "courseId" = ${course.id}`;
        }
        await prisma.$executeRaw`DELETE FROM "Course" WHERE "creatorId" = ${creatorId}`;
        
        // Delete channel-related data - skip Post since table doesn't exist
        const channels = await prisma.creatorChannel.findMany({ where: { creatorId }, select: { id: true } });
        for (const channel of channels) {
          await prisma.$executeRaw`DELETE FROM "ChannelSubscription" WHERE "channelId" = ${channel.id}`;
        }
        await prisma.$executeRaw`DELETE FROM "CreatorChannel" WHERE "creatorId" = ${creatorId}`;
        
        // Delete meetings
        const meetings = await prisma.meeting.findMany({ where: { creatorId }, select: { id: true } });
        for (const meeting of meetings) {
          await prisma.$executeRaw`DELETE FROM "MeetingBooking" WHERE "meetingId" = ${meeting.id}`;
          await prisma.$executeRaw`DELETE FROM "MeetingSlot" WHERE "meetingId" = ${meeting.id}`;
        }
        await prisma.$executeRaw`DELETE FROM "Meeting" WHERE "creatorId" = ${creatorId}`;
        
        // Delete creator
        await prisma.$executeRaw`DELETE FROM "Creator" WHERE "id" = ${creatorId}`;
      }

      // Delete user-related data
      await prisma.$executeRaw`DELETE FROM "Subscription" WHERE "userId" = ${userId}`;
      await prisma.$executeRaw`DELETE FROM "PaymentTransaction" WHERE "userId" = ${userId}`;
      await prisma.$executeRaw`DELETE FROM "Enrollment" WHERE "userId" = ${userId}`;
      await prisma.$executeRaw`DELETE FROM "Review" WHERE "userId" = ${userId}`;
      await prisma.$executeRaw`DELETE FROM "Session" WHERE "userId" = ${userId}`;
      await prisma.$executeRaw`DELETE FROM "Notification" WHERE "userId" = ${userId}`;
      await prisma.$executeRaw`DELETE FROM "Certificate" WHERE "userId" = ${userId}`;
      await prisma.$executeRaw`DELETE FROM "Message" WHERE "senderId" = ${userId}`;
      await prisma.$executeRaw`DELETE FROM "ConversationParticipant" WHERE "userId" = ${userId}`;
      
      // Finally delete user
      await prisma.$executeRaw`DELETE FROM "User" WHERE "id" = ${userId}`;
      console.log(`   ✅ Deleted ${user.name}`);

    } catch (error: any) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
  }

  // Final count
  const creators = await prisma.creator.findMany({
    include: { user: { select: { email: true, name: true } } }
  });
  
  console.log(`\n📊 Final state: ${creators.length} creators`);
  creators.forEach(c => {
    const isReal = c.user.email.endsWith('@prime.edu');
    console.log(`   ${isReal ? '✅' : '❌'} ${c.user.name} (${c.user.email})`);
  });
}

finalCleanup()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
