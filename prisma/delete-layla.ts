import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteLayla() {
  const email = 'layla.ibrahim@example.com';
  
  const user = await prisma.user.findUnique({ 
    where: { email },
    include: { creator: true }
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log(`Deleting ${user.name}...`);
  const userId = user.id;
  const creatorId = user.creator?.id;

  // Delete VideoCallSession
  await prisma.$executeRaw`DELETE FROM "VideoCallSession" WHERE "inviteeId" = ${userId}`;
  await prisma.$executeRaw`DELETE FROM "VideoCallSession" WHERE "hostId" = ${userId}`;
  await prisma.$executeRaw`DELETE FROM "VideoCallSignal" WHERE "fromUserId" = ${userId}`;

  // Delete InstructorFollow records
  await prisma.$executeRaw`DELETE FROM "InstructorFollow" WHERE "userId" = ${userId}`;
  
  if (creatorId) {
    await prisma.$executeRaw`DELETE FROM "InstructorFollow" WHERE "creatorId" = ${creatorId}`;
    await prisma.$executeRaw`DELETE FROM "MentorSubscription" WHERE "creatorId" = ${creatorId}`;
    await prisma.$executeRaw`DELETE FROM "CreatorAnalytics" WHERE "creatorId" = ${creatorId}`;
    await prisma.$executeRaw`DELETE FROM "CreatorEarnings" WHERE "creatorId" = ${creatorId}`;
    await prisma.$executeRaw`DELETE FROM "Course" WHERE "creatorId" = ${creatorId}`;
    await prisma.$executeRaw`DELETE FROM "CreatorChannel" WHERE "creatorId" = ${creatorId}`;
    await prisma.$executeRaw`DELETE FROM "Meeting" WHERE "creatorId" = ${creatorId}`;
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
  console.log('✅ Deleted Layla Ibrahim');

  // Verify final state
  const count = await prisma.creator.count();
  console.log(`\n📊 Total creators now: ${count}`);
}

deleteLayla()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
