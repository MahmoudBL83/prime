import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding demo messages for Fatma...');

  // Find Fatma
  const fatma = await prisma.user.findUnique({
    where: { email: 'fatma@demo.com' },
  });

  if (!fatma) {
    console.log('❌ Fatma user not found!');
    return;
  }

  console.log('✅ Found Fatma:', fatma.name);

  // Find other demo users
  const ahmed = await prisma.user.findUnique({
    where: { email: 'ahmed@demo.com' },
  });

  const sara = await prisma.user.findUnique({
    where: { email: 'sara@demo.com' },
  });

  const mohamed = await prisma.user.findUnique({
    where: { email: 'mohamed@demo.com' },
  });

  const users = [ahmed, sara, mohamed].filter(Boolean);
  
  if (users.length === 0) {
    console.log('❌ No other demo users found!');
    return;
  }

  console.log(`✅ Found ${users.length} other demo users`);

  // Sample messages for different contexts
  const messageTemplates = {
    greeting: [
      'السلام عليكم! كيف حالك؟',
      'مرحباً! هل أنت جاهزة للدرس اليوم؟',
      'صباح الخير! 🌅',
      'مساء الخير! كيف كان يومك؟',
    ],
    studyRelated: [
      'هل فهمت موضوع الدرس الأخير؟',
      'محتاجة مساعدة في حل التمارين',
      'الامتحان القادم صعب، لازم نذاكر كويس',
      'شكراً على المساعدة! فهمت الموضوع دلوقتي 📚',
      'ممكن نعمل مجموعة دراسية؟',
      'عندك ملخص الوحدة الثالثة؟',
    ],
    casual: [
      'شفت الكورس الجديد؟ روعة! 🎓',
      'بالتوفيق في الامتحان! 💪',
      'تمام، نتكلم بعدين',
      'شكراً جزيلاً! ❤️',
      'ماشي، اتفقنا',
      'ان شاء الله نشوف بعض قريب',
    ],
    questions: [
      'فين المحاضرة دي؟',
      'إمتى موعد التسليم؟',
      'عندك لينك الزووم؟',
      'فاكرة احنا اتفقنا على إيه؟',
    ],
  };

  let conversationCount = 0;
  let messageCount = 0;

  // Create conversations and messages with each user
  for (const otherUser of users) {
    if (!otherUser) continue;

    console.log(`\n💬 Creating conversation with ${otherUser.name}...`);

    // Create or find conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        participants: {
          every: {
            OR: [
              { userId: fatma.id },
              { userId: otherUser.id },
            ],
          },
        },
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          type: 'DIRECT',
          participants: {
            create: [
              {
                userId: fatma.id,
                role: 'MEMBER',
                isActive: true,
              },
              {
                userId: otherUser.id,
                role: 'MEMBER',
                isActive: true,
              },
            ],
          },
        },
      });
      conversationCount++;
    }

    // Generate 8-15 messages for this conversation
    const numMessages = Math.floor(Math.random() * 8) + 8;
    const allMessages = [
      ...messageTemplates.greeting,
      ...messageTemplates.studyRelated,
      ...messageTemplates.casual,
      ...messageTemplates.questions,
    ];

    for (let i = 0; i < numMessages; i++) {
      const isFromFatma = i % 3 !== 0; // Fatma sends ~66% of messages
      const messageContent = allMessages[Math.floor(Math.random() * allMessages.length)];
      
      // Create message with varying timestamps (last 7 days)
      const daysAgo = Math.floor(Math.random() * 7);
      const hoursAgo = Math.floor(Math.random() * 24);
      const minutesAgo = Math.floor(Math.random() * 60);
      
      const timestamp = new Date();
      timestamp.setDate(timestamp.getDate() - daysAgo);
      timestamp.setHours(timestamp.getHours() - hoursAgo);
      timestamp.setMinutes(timestamp.getMinutes() - minutesAgo);

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: isFromFatma ? fatma.id : otherUser.id,
          content: messageContent,
          messageType: 'TEXT',
          createdAt: timestamp,
        },
      });
      
      messageCount++;
    }

    // Add some reactions to random messages
    const messages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      take: 5,
    });

    const emojis = ['❤️', '👍', '😂', '🔥', '💯'];
    for (const msg of messages) {
      if (Math.random() > 0.5) {
        await prisma.messageReaction.create({
          data: {
            messageId: msg.id,
            userId: msg.senderId === fatma.id ? otherUser.id : fatma.id,
            emoji: emojis[Math.floor(Math.random() * emojis.length)],
          },
        });
      }
    }

    // Pin one random message
    if (messages.length > 0) {
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      await prisma.message.update({
        where: { id: randomMsg.id },
        data: { isPinned: true },
      });
    }

    // Star a couple of messages
    if (messages.length > 2) {
      await prisma.message.update({
        where: { id: messages[1].id },
        data: { isStarred: true },
      });
    }

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        updatedAt: new Date(),
      },
    });

    console.log(`   ✅ Created ${numMessages} messages with ${otherUser.name}`);
  }

  // Create a group conversation
  console.log('\n👥 Creating study group...');
  
  const groupConversation = await prisma.conversation.create({
    data: {
      type: 'GROUP',
      title: 'مجموعة المذاكرة - رياضيات',
      participants: {
        create: [
          {
            userId: fatma.id,
            role: 'ADMIN',
            isActive: true,
          },
          ...(users.filter(Boolean).map((user: any) => ({
            userId: user.id,
            role: 'MEMBER' as const,
            isActive: true,
          }))),
        ],
      },
    },
  });

  // Add group messages
  const groupMessages = [
    { sender: fatma.id, content: 'أهلاً بالجميع! 👋' },
    { sender: ahmed?.id, content: 'مرحباً! شكراً على إنشاء المجموعة' },
    { sender: sara?.id, content: 'ممتاز! متى نبدأ المذاكرة؟' },
    { sender: fatma.id, content: 'نبدأ بكره الساعة 5 مساءً' },
    { sender: mohamed?.id, content: 'تمام، أنا موافق 👍' },
    { sender: fatma.id, content: 'هل الجميع حمّل الملفات؟' },
    { sender: ahmed?.id, content: 'نعم! كلها موجودة' },
    { sender: sara?.id, content: 'أنا كمان جاهزة ✅' },
  ];

  for (const [index, msgData] of groupMessages.entries()) {
    if (!msgData.sender) continue;
    
    const timestamp = new Date();
    timestamp.setHours(timestamp.getHours() - (groupMessages.length - index));
    
    await prisma.message.create({
      data: {
        conversationId: groupConversation.id,
        senderId: msgData.sender,
        content: msgData.content,
        messageType: 'TEXT',
        createdAt: timestamp,
      },
    });
  }

  conversationCount++;
  messageCount += groupMessages.length;

  console.log('\n✨ Seeding completed!');
  console.log(`📊 Summary:`);
  console.log(`   - Conversations created: ${conversationCount}`);
  console.log(`   - Messages created: ${messageCount}`);
  console.log(`   - Reactions added: ~${Math.floor(messageCount * 0.3)}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding messages:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
